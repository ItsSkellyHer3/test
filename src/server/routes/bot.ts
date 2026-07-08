import { Router } from 'express';
import { bot } from '../../bot/WhatsAppBot';

const router = Router();

router.get('/status', (req, res) => {
  const sock = bot.getSocket();
  res.json({
    status: sock ? 'connected' : 'connecting',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    botJid: sock?.user?.id,
  });
});

router.post('/action', async (req: any, res: any) => {
    const { action, message } = req.body;
    if (req.user.role !== 'OWNER') return res.status(403).json({ error: 'Owner only' });

    try {
        const sock = bot.getSocket();
        if (!sock && action !== 'restart') return res.status(503).json({ error: 'Bot not connected' });

        if (action === 'restart') {
            res.json({ success: true, message: 'Restarting...' });
            setTimeout(() => process.exit(0), 1000);
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

router.post('/settings', async (req, res) => {
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

export default router;
