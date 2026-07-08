import { Router } from 'express';
import { bot } from '../../bot/WhatsAppBot';

const router = Router();

router.get('/', async (req, res) => {
  const sock = bot.getSocket();
  if (!sock) return res.status(503).json({ error: 'Bot not connected' });
  const groups = await sock.groupFetchAllParticipating();
  res.json(Object.values(groups));
});

router.get('/:jid', async (req, res) => {
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

router.post('/:jid/action', async (req, res) => {
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

export default router;
