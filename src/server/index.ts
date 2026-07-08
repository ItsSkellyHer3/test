import express from 'express';
import http from 'http';
import os from 'os';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { bot } from '../bot/WhatsAppBot';
import User from '../models/User';
import MessageModel from '../models/Message';
import { getAnalytics } from '../utils/analytics';

// Import Routes
import osintRoutes from './routes/osint';
import botRoutes from './routes/bot';
import groupRoutes from './routes/groups';
import messageRoutes from './routes/messages';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static('src/dashboard/public'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Auth middleware
const auth = (req: any, res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { name: username } });

  if (user && await bcrypt.compare(password, user.get('password') as string || '')) {
    const token = jwt.sign({ id: user.id, username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }

  if (username === 'admin' && password === 'admin' && (await User.count()) === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      const newUser = await User.create({
          id: 'admin',
          name: 'admin',
          role: 'OWNER',
          password: hashedPassword
      } as any);
      const token = jwt.sign({ id: newUser.id, username, role: 'OWNER' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// Mount Routes
app.use('/api/osint', auth, osintRoutes);
app.use('/api/bot', auth, botRoutes);
app.use('/api/groups', auth, groupRoutes);
app.use('/api/messages', auth, messageRoutes);

// Additional analytics route
app.get('/api/analytics', auth, async (req, res) => {
  const analytics = await getAnalytics();
  res.json(analytics);
});

app.get('/api/chats', auth, async (req, res) => {
  const chats = await MessageModel.findAll({
    attributes: [
      'chatJid',
      [MessageModel.sequelize!.fn('MAX', MessageModel.sequelize!.col('timestamp')), 'lastTimestamp'],
      [MessageModel.sequelize!.fn('MAX', MessageModel.sequelize!.col('content')), 'lastMessage'],
    ],
    group: ['chatJid'],
    order: [[MessageModel.sequelize!.literal('lastTimestamp'), 'DESC']]
  });
  res.json(chats);
});

// Status shorthand for dashboard top bar
app.get('/api/status', auth, (req, res) => {
  const sock = bot.getSocket();
  res.json({
    status: sock ? 'connected' : 'connecting',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    botJid: sock?.user?.id,
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  logger.info('New dashboard client connected');
  socket.on('disconnect', () => {
    logger.info('Dashboard client disconnected');
  });
});

// Helper for owner terminal
const originalLog = logger.info.bind(logger);
logger.info = (msg: any, ...args: any[]) => {
    originalLog(msg, ...args);
    io.emit('terminal_log', { level: 'info', msg, timestamp: Date.now() });
};

// Link bot events to socket.io
bot.on('messages.upsert', ({ messages }) => {
  io.emit('new_message', messages);
});

const PORT = process.env.PORT || 3000;

export const startServer = () => {
  server.listen(PORT, () => {
    const nets = os.networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            if (net.family === 'IPv4' && !net.internal) {
                results.push(`http://${net.address}:${PORT}`);
            }
        }
    }

    logger.info(`Server running on port ${PORT}`);
    logger.info('Dashboard available at:');
    logger.info(`- http://localhost:${PORT}`);
    results.forEach(url => logger.info(`- ${url}`));
  });
};

export { io };
