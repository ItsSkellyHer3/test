import { Command } from '../utils/commandHandler';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import ExifParser from 'exif-parser';

const command: Command = {
  name: 'exif',
  description: 'Extract EXIF metadata from an image',
  category: 'OSINT',
  execute: async ({ bot, jid, msg }) => {
    const imageMsg = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!imageMsg) {
      return await bot.sendMessage(jid, { text: 'Please reply to an image with .exif' });
    }

    try {
      const buffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
      const parser = ExifParser.create(buffer);
      const result = parser.parse();

      if (Object.keys(result.tags).length === 0) {
        return await bot.sendMessage(jid, { text: 'No EXIF metadata found in this image.' });
      }

      let info = `*EXIF Metadata*\n\n`;
      for (const [tag, value] of Object.entries(result.tags)) {
        info += `*${tag}:* ${value}\n`;
      }

      await bot.sendMessage(jid, { text: info });
    } catch (error) {
      await bot.sendMessage(jid, { text: `Failed to extract EXIF: ${(error as Error).message}` });
    }
  },
};

export default command;
