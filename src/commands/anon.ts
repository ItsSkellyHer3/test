import { Command } from '../utils/commandHandler';

const command: Command = {
  name: 'anon',
  description: 'Send an anonymous message',
  category: 'Tools',
  minRole: 'ADMIN',
  execute: async ({ bot, jid, args }) => {
    if (args.length < 2) {
      return await bot.sendMessage(jid, { text: 'Usage: .anon <name> | <message>' });
    }

    const content = args.join(' ');
    const [name, ...msgParts] = content.split('|');
    const message = msgParts.join('|').trim();

    if (!name || !message) {
      return await bot.sendMessage(jid, { text: 'Usage: .anon <name> | <message>' });
    }

    await bot.sendMessage(jid, {
      text: `*From: ${name.trim()}*\n\n${message}\n\n_(Sent via ${process.env.BOT_NAME || 'Bot'})_`
    });
  },
};

export default command;
