import { Command } from '../utils/commandHandler';
import axios from 'axios';

const command: Command = {
  name: 'asn',
  description: 'Lookup Autonomous System Number (ASN) information',
  category: 'OSINT',
  execute: async ({ bot, jid, args }) => {
    if (args.length === 0) {
      return await bot.sendMessage(jid, { text: 'Please provide an IP or AS number.' });
    }

    const query = args[0];
    try {
      const response = await axios.get(`https://ip-api.com/json/${query}?fields=status,message,as,isp,org`);
      const data = response.data;

      if (data.status === 'fail') {
        return await bot.sendMessage(jid, { text: `Error: ${data.message}` });
      }

      let info = `*ASN Information for ${query}*\n\n`;
      info += `*AS:* ${data.as}\n`;
      info += `*ISP:* ${data.isp}\n`;
      info += `*Organization:* ${data.org}\n`;

      await bot.sendMessage(jid, { text: info });
    } catch (error) {
      await bot.sendMessage(jid, { text: 'Failed to fetch ASN info.' });
    }
  },
};

export default command;
