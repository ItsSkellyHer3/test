import { Command } from '../utils/commandHandler';

const command: Command = {
  name: 'base64',
  description: 'Encode or decode base64 text',
  category: 'Tools',
  execute: async ({ bot, jid, args }) => {
    if (args.length < 2) {
      return await bot.sendMessage(jid, { text: 'Usage: .base64 <encode|decode> <text>' });
    }

    const action = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    try {
      if (action === 'encode') {
        const encoded = Buffer.from(text).toString('base64');
        await bot.sendMessage(jid, { text: `*Encoded:* ${encoded}` });
      } else if (action === 'decode') {
        const decoded = Buffer.from(text, 'base64').toString('utf-8');
        await bot.sendMessage(jid, { text: `*Decoded:* ${decoded}` });
      } else {
        await bot.sendMessage(jid, { text: 'Invalid action. Use encode or decode.' });
      }
    } catch (e) {
      await bot.sendMessage(jid, { text: 'Error processing base64.' });
    }
  },
};

export default command;
