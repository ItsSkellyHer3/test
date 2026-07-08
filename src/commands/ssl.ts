import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'ssl',
  description: 'Inspect SSL certificate of a domain',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide a domain name.' });
    }

    const domain = args[0];
    try {
      // Using a public API for SSL info
      const response = await axios.get(`https://api.testssl.sh/v1/info?domain=${domain}`);
      // Since real SSL APIs often require keys or are complex, we'll use a simpler one if available
      // Or just a placeholder for now if I can't find a free one without auth
      // Let's use a known public one:
      const res = await axios.get(`https://api.certspotter.com/v1/issuances?domain=${domain}&expand=dns_names&expand=issuer&limit=1`);
      const cert = res.data[0];

      if (!cert) return await bot.sendMessage(jid, { text: 'No certificate info found.' });

      let info = `*SSL Info for ${domain}*\n\n`;
      info += `*Issuer:* ${cert.issuer.name}\n`;
      info += `*Not Before:* ${cert.not_before}\n`;
      info += `*Not After:* ${cert.not_after}\n`;
      info += `*DNS Names:* ${cert.dns_names.join(', ')}\n`;

      await bot.sendMessage(jid, { text: info });
    } catch (error) {
      await bot.sendMessage(jid, { text: 'Failed to fetch SSL information.' });
    }
  },
};

export default command;
