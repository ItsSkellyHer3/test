import { Command } from '../utils/commandHandler';

const command: Command = {
  name: 'json',
  description: 'Format a JSON string',
  category: 'Tools',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a JSON string.' });
    }

    const text = args.join(' ');
    try {
      const parsed = JSON.parse(text);
      await bot.sendMessage(jid, { text: `*Formatted JSON:*\n\n\`\`\`${JSON.stringify(parsed, null, 2)}\`\`\`` });
    } catch (e) {
      await bot.sendMessage(jid, { text: 'Invalid JSON string.' });
    }
  },
};

export default command;
