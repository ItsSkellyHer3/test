import { Router } from 'express';
import { bot } from '../../bot/WhatsAppBot';
import MessageModel from '../../models/Message';

const router = Router();

router.get('/', async (req, res) => {
  const { jid } = req.query;
  const where = jid ? { chatJid: jid as string } : {};
  const messages = await MessageModel.findAll({
    where,
    limit: 50,
    order: [['timestamp', 'DESC']]
  });
  res.json(messages);
});

router.post('/send', async (req, res) => {
    const { jid, text, quotedId } = req.body;
    try {
        const result = await bot.sendMessage(jid, { text });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

export default router;
