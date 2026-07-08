import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'whois',
  description: 'Lookup WHOIS information for a domain',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a domain name.' });
    }

    const domain = args[0];
    await bot.sendMessage(jid, { text: `Searching WHOIS for ${domain}...` });

    try {
      // Using a public API for WHOIS. In a real scenario, one might use a specialized library or more robust API.
      const response = await axios.get(`https://rdap.org/domain/${domain}`);
      const data = response.data;

      let info = `*WHOIS Information for ${domain}*\n\n`;
      info += `*Domain:* ${data.ldhName}\n`;
      info += `*Status:* ${data.status?.join(', ') || 'N/A'}\n`;

      if (data.events) {
          const created = data.events.find((e: any) => e.eventAction === 'registration')?.eventDate;
          const expired = data.events.find((e: any) => e.eventAction === 'expiration')?.eventDate;
          if (created) info += `*Created:* ${created}\n`;
          if (expired) info += `*Expires:* ${expired}\n`;
      }

      await bot.sendMessage(jid, { text: info });
    } catch (error) {
      await bot.sendMessage(jid, { text: `Failed to fetch WHOIS info for ${domain}. It might not exist or the RDAP server is down.` });
    }
  },
};

export default command;
