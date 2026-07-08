import { Command } from '../utils/commandHandler';

const command: Command = {
  name: 'ping',
  description: 'Check bot latency',
  category: 'Utility',
  execute: async ({ bot, jid, msg }) => {
    const start = Date.now();
    const sent = await bot.sendMessage(jid, { text: 'Pinging...' });
    const end = Date.now();
    const latency = end - start;

    await bot.sendMessage(jid, {
        text: `*Pong!* 🏓\n\n*Latency:* ${latency}ms\n*Server Uptime:* ${Math.floor(process.uptime())}s`,
        edit: sent.key
    } as any);
  },
};

export default command;
