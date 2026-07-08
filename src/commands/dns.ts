import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'dns',
  description: 'Lookup DNS records for a domain',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a domain name.' });
    }

    const domain = args[0];
    try {
      const response = await axios.get(`https://dns.google/resolve?name=${domain}&type=A`);
      const data = response.data;

      if (!data.Answer) {
        return await bot.sendMessage(jid, { text: `No A records found for ${domain}.` });
      }

      let info = `*DNS Records (A) for ${domain}*\n\n`;
      data.Answer.forEach((record: any) => {
        info += `- ${record.data} (TTL: ${record.TTL})\n`;
      });

      await bot.sendMessage(jid, { text: info });
    } catch (error) {
      await bot.sendMessage(jid, { text: 'Failed to fetch DNS records.' });
    }
  },
};

export default command;
