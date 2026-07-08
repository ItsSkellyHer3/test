import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'expand',
  description: 'Expand a shortened URL',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a URL.' });
    }

    let url = args[0];
    if (!url.startsWith('http')) url = 'http://' + url;

    try {
      const response = await axios.get(url, { maxRedirects: 10, timeout: 5000 });
      const finalUrl = response.request.res.responseUrl || url;

      await bot.sendMessage(jid, { text: `*Expanded URL:* ${finalUrl}` });
    } catch (error) {
      // Some servers block HEAD or have issues, but often we can still get the location header from an error if it's a redirect
      const err = error as any;
      if (err.response && err.response.status >= 300 && err.response.status < 400 && err.response.headers.location) {
          return await bot.sendMessage(jid, { text: `*Expanded URL:* ${err.response.headers.location}` });
      }
      await bot.sendMessage(jid, { text: `Failed to expand URL: ${err.message}` });
    }
  },
};

export default command;
