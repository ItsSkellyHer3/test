import { Router } from 'express';
import { bot } from '../../bot/WhatsAppBot';
import { commandHandler } from '../../utils/commandHandler';

const router = Router();

router.post('/execute', async (req, res) => {
    const { command, query } = req.body;
    const cmd = commandHandler.commands.get(command);
    if (!cmd) return res.status(404).json({ error: 'Command not found' });

    try {
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

export default router;
