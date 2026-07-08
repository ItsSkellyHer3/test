import { Command } from '../utils/commandHandler';
import crypto from 'crypto';

const command: Command = {
  name: 'hash',
  description: 'Generate hashes for a text',
  category: 'Tools',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide text to hash.' });
    }

    const text = args.join(' ');
    const md5 = crypto.createHash('md5').update(text).digest('hex');
    const sha1 = crypto.createHash('sha1').update(text).digest('hex');
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');

    let info = `*Hashes for:* ${text}\n\n`;
    info += `*MD5:* ${md5}\n`;
    info += `*SHA-1:* ${sha1}\n`;
    info += `*SHA-256:* ${sha256}\n`;

    await bot.sendMessage(jid, { text: info });
  },
};

export default command;
