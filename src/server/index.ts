import express from 'express';
import http from 'http';
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
import Message from '../models/Message';
import { getAnalytics } from '../utils/analytics';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(helmet({
  contentSecurityPolicy: false, // For simplicity in dashboard
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

// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { name: username } });

  if (user && await bcrypt.compare(password, user.get('password') as string || '')) {
    const token = jwt.sign({ id: user.id, username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }

  // Fallback for first run if no users exist
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

app.get('/api/status', auth, (req, res) => {
  res.json({
    status: 'connected', // Mock status for now
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.get('/api/messages', auth, async (req, res) => {
  const { jid } = req.query;
  const where = jid ? { chatJid: jid as string } : {};
  const messages = await Message.findAll({
    where,
    limit: 50,
    order: [['timestamp', 'DESC']]
  });
  res.json(messages);
});

app.get('/api/groups', auth, async (req, res) => {
  const groups = await bot.getSocket().groupFetchAllParticipating();
  res.json(Object.values(groups));
});

app.post('/api/groups/:jid/action', auth, async (req, res) => {
  const { jid } = req.params;
  const { action, participants } = req.body;

  try {
    const response = await bot.getSocket().groupParticipantsUpdate(jid, participants, action);
    res.json(response);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get('/api/chats', auth, async (req, res) => {
  const chats = await Message.findAll({
    attributes: [
      'chatJid',
      [Message.sequelize!.fn('MAX', Message.sequelize!.col('timestamp')), 'lastTimestamp'],
      [Message.sequelize!.fn('MAX', Message.sequelize!.col('content')), 'lastMessage'],
    ],
    group: ['chatJid'],
    order: [[Message.sequelize!.literal('lastTimestamp'), 'DESC']]
  });
  res.json(chats);
});

app.get('/api/analytics', auth, async (req, res) => {
  const analytics = await getAnalytics();
  res.json(analytics);
});

// Socket.io connection
io.on('connection', (socket) => {
  logger.info('New dashboard client connected');

  socket.on('disconnect', () => {
    logger.info('Dashboard client disconnected');
  });
});

// Link bot events to socket.io
bot.on('messages.upsert', ({ messages }) => {
  io.emit('new_message', messages);
});

const PORT = process.env.PORT || 3000;

export const startServer = () => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

export { io };
