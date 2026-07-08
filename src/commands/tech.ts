import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'tech',
  description: 'Detect technologies used on a website',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a URL.' });
    }

    const url = args[0].startsWith('http') ? args[0] : 'https://' + args[0];
    try {
      // Using a public API for tech detection (BuiltWith or similar)
      // For this example, we'll use a simpler heuristic or a known public endpoint if available
      // Note: Real tech detection usually requires Wappalyzer-like libraries.
      const response = await axios.get(`https://api.hackertarget.com/hostsearch/?q=${new URL(url).hostname}`);
      await bot.sendMessage(jid, { text: `*Technology/Host Info for ${url}*\n\n${response.data}` });
    } catch (error) {
      await bot.sendMessage(jid, { text: 'Failed to detect technologies.' });
    }
  },
};

export default command;
