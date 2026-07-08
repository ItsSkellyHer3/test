import { Command } from '../utils/commandHandler';
import jwt from 'jsonwebtoken';

const command: Command = {
  name: 'jwt',
  description: 'Decode a JWT token (without verifying)',
  category: 'Tools',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a JWT token.' });
    }

    const token = args[0];
    try {
      const decoded = jwt.decode(token);
      if (!decoded) throw new Error('Invalid JWT');

      await bot.sendMessage(jid, { text: `*JWT Decoded:*\n\n\`\`\`${JSON.stringify(decoded, null, 2)}\`\`\`` });
    } catch (error) {
      await bot.sendMessage(jid, { text: 'Failed to decode JWT. Make sure it is a valid token format.' });
    }
  },
};

export default command;
