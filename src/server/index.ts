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
import { commandHandler } from '../utils/commandHandler';

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
  const sock = bot.getSocket();
  res.json({
    status: sock ? 'connected' : 'connecting',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    botJid: sock?.user?.id,
  });
});

app.post('/api/osint/execute', auth, async (req, res) => {
    const { command, query } = req.body;
    const cmd = commandHandler.commands.get(command);
    if (!cmd) return res.status(404).json({ error: 'Command not found' });

    // Mock a context for the command
    // Note: Some commands might expect a real bot instance to send messages.
    // For the dashboard, we want the result returned as JSON.
    // This requires refactoring commands to return data or having a separate service.
    // For now, we'll try to capture what would be sent.

    try {
        // Since the current command system is designed for WhatsApp (sending messages via bot.sendMessage),
        // we'll implement a simple execution for the dashboard.
        // In a real professional app, the OSINT logic would be in a shared service.

        // For the sake of this task, I'll add a specialized response for the dashboard
        // if the command is being called from here.

        let result = '';
        const mockBot = {
            ...bot,
            sendMessage: async (jid: string, content: any) => {
                result += (content.text || '') + '\n';
                return {};
            }
        } as any;

        await cmd.execute({
            bot: mockBot,
            jid: 'dashboard',
            args: [query],
            text: `.${command} ${query}`,
            sender: 'dashboard',
            msg: {} as any
        });

        res.json({ result: result.trim() });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/messages', auth, async (req, res) => {
  const { jid } = req.query;
  const where = jid ? { chatJid: jid as string } : {};
  const messages = await MessageModel.findAll({
    where,
    limit: 50,
    order: [['timestamp', 'DESC']]
  });
  res.json(messages);
});

app.get('/api/groups', auth, async (req, res) => {
  const sock = bot.getSocket();
  if (!sock) return res.status(503).json({ error: 'Bot not connected' });
  const groups = await sock.groupFetchAllParticipating();
  res.json(Object.values(groups));
});

app.get('/api/groups/:jid', auth, async (req, res) => {
  const { jid } = req.params;
  try {
      const sock = bot.getSocket();
      if (!sock) return res.status(503).json({ error: 'Bot not connected' });
      const metadata = await sock.groupMetadata(jid);
      res.json(metadata);
  } catch (e) {
      res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/groups/:jid/action', auth, async (req, res) => {
  const { jid } = req.params;
  const { action, participants, name, description, ephemeral } = req.body;

  try {
    const sock = bot.getSocket();
    if (!sock) return res.status(503).json({ error: 'Bot not connected' });
    let response: any = { success: true };
    if (action === 'kick' || action === 'remove') response = await sock.groupParticipantsUpdate(jid, participants, 'remove');
    else if (action === 'promote') response = await sock.groupParticipantsUpdate(jid, participants, 'promote');
    else if (action === 'demote') response = await sock.groupParticipantsUpdate(jid, participants, 'demote');
    else if (action === 'updateSubject') await sock.groupUpdateSubject(jid, name);
    else if (action === 'updateDescription') await sock.groupUpdateDescription(jid, description);
    else if (action === 'toggleEphemeral') await sock.groupToggleEphemeral(jid, ephemeral);
    else if (action === 'leave') await sock.groupLeave(jid);

    res.json(response);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/bot/action', auth, async (req: any, res: any) => {
    const { action, message } = req.body;
    if (req.user.role !== 'OWNER') return res.status(403).json({ error: 'Owner only' });

    try {
        const sock = bot.getSocket();
        if (!sock && action !== 'restart') return res.status(503).json({ error: 'Bot not connected' });

        if (action === 'restart') {
            res.json({ success: true, message: 'Restarting...' });
            setTimeout(() => process.exit(0), 1000); // Nodemon/Run.sh will restart it
        } else if (action === 'broadcast' && sock) {
            const groups = await sock.groupFetchAllParticipating();
            for (const jid of Object.keys(groups)) {
                await bot.sendMessage(jid, { text: `📢 *BROADCAST*\n\n${message}` });
            }
            res.json({ success: true });
        } else if (action === 'maintenance') {
            bot.maintenanceMode = !bot.maintenanceMode;
            res.json({ success: true, maintenanceMode: bot.maintenanceMode });
        } else {
            res.json({ success: true, message: 'Action received' });
        }
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/bot/settings', auth, async (req, res) => {
  const { name, bio, presence, pfpUrl } = req.body;

  try {
    const sock = bot.getSocket();
    if (!sock) return res.status(503).json({ error: 'Bot not connected' });
    if (name) await sock.updateProfileName(name);
    if (bio) await sock.updateProfileStatus(bio);
    if (presence) await sock.sendPresenceUpdate(presence);
    if (pfpUrl) await sock.updateProfilePicture(sock.user!.id, { url: pfpUrl });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/messages/send', auth, async (req, res) => {
    const { jid, text, quotedId } = req.body;
    try {
        const options: any = {};
        if (quotedId) {
            const quotedMsg = await MessageModel.findByPk(quotedId);
            if (quotedMsg) {
                // This is a simplification; Baileys needs the full proto message for quoting
                // In a real app, you'd store the full raw message JSON
            }
        }
        const result = await bot.sendMessage(jid, { text });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
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

  // Owner terminal stream
  socket.on('join_terminal', () => {
      // Stream logs logic could go here
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
