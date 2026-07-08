import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'headers',
  description: 'Inspect HTTP headers of a website',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a URL.' });
    }

    let url = args[0];
    if (!url.startsWith('http')) url = 'http://' + url;

    try {
      const response = await axios.head(url, { timeout: 5000 });
      let info = `*HTTP Headers for ${url}*\n\n`;

      for (const [key, value] of Object.entries(response.headers)) {
        info += `*${key}:* ${value}\n`;
      }

      await bot.sendMessage(jid, { text: info });
    } catch (error) {
      await bot.sendMessage(jid, { text: `Failed to fetch headers: ${(error as Error).message}` });
    }
  },
};

export default command;
