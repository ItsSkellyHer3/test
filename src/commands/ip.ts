import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'ip',
  description: 'Lookup information for an IP address',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide an IP address.' });
    }

    const ip = args[0];
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      const data = response.data;

      if (data.status === 'fail') {
        return await bot.sendMessage(jid, { text: `Error: ${data.message}` });
      }

      let info = `*IP Information for ${ip}*\n\n`;
      info += `*Country:* ${data.country} (${data.countryCode})\n`;
      info += `*Region:* ${data.regionName}\n`;
      info += `*City:* ${data.city}\n`;
      info += `*ISP:* ${data.isp}\n`;
      info += `*Org:* ${data.org}\n`;
      info += `*AS:* ${data.as}\n`;
      info += `*Lat/Lon:* ${data.lat}, ${data.lon}\n`;

      await bot.sendMessage(jid, { text: info });
    } catch (error) {
      await bot.sendMessage(jid, { text: 'Failed to fetch IP information.' });
    }
  },
};

export default command;
