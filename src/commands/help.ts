import { Command, commandHandler } from '../utils/commandHandler';

const command: Command = {
  name: 'help',
  description: 'List all available commands',
  category: 'Utility',
  execute: async ({ bot, jid }) => {
    const commands = (commandHandler as any).commands as Map<string, Command>;
    const categorized: { [key: string]: string[] } = {};

    commands.forEach((cmd) => {
      const cat = cmd.category || 'Other';
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(cmd.name);
    });

    let helpText = `*${process.env.BOT_NAME || 'OSINT Bot'} Help Menu*\n\n`;
    for (const [category, cmds] of Object.entries(categorized)) {
      helpText += `*${category}*\n`;
      helpText += `${cmds.map(c => `  - .${c}`).join('\n')}\n\n`;
    }

    helpText += `_Type .<command> to use. Example: .whois google.com_`;

    await bot.sendMessage(jid, { text: helpText });
  },
};

export default command;
