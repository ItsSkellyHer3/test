import { Command } from '../utils/commandHandler';

const command: Command = {
  name: 'time',
  description: 'Convert Unix timestamp to readable date',
  category: 'Tools',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a Unix timestamp.' });
    }

    const ts = parseInt(args[0]);
    if (isNaN(ts)) {
      return await bot.sendMessage(jid, { text: 'Invalid timestamp.' });
    }

    // Handle both seconds and milliseconds
    const date = ts < 10000000000 ? new Date(ts * 1000) : new Date(ts);

    await bot.sendMessage(jid, { text: `*Readable Date:* ${date.toUTCString()} (${date.toLocaleString()})` });
  },
};

export default command;
