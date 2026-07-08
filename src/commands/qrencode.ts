import { Command } from '../utils/commandHandler';
import QRCode from 'qrcode';

const command: Command = {
  name: 'qrencode',
  description: 'Generate a QR code from text',
  category: 'Tools',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide text to encode.' });
    }

    const text = args.join(' ');
    try {
      const qrBuffer = await QRCode.toBuffer(text);
      await bot.sendMessage(jid, {
          image: qrBuffer,
          caption: `*QR Code for:* ${text}`
      });
    } catch (error) {
      await bot.sendMessage(jid, { text: 'Failed to generate QR code.' });
    }
  },
};

export default command;
