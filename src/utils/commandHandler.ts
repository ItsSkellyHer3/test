import { WAMessage, proto } from '@whiskeysockets/baileys';
import { WhatsAppBot } from '../bot/WhatsAppBot';

export interface CommandContext {
  bot: WhatsAppBot;
  msg: WAMessage;
  jid: string;
  sender: string;
  args: string[];
  text: string;
}

export interface Command {
  name: string;
  description: string;
  category: string;
  minRole?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'VIEWER' | 'GUEST';
  aliases?: string[];
  execute: (ctx: CommandContext) => Promise<void>;
}

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import User from '../models/User';

const ROLE_PRIORITY = {
    'OWNER': 4,
    'ADMIN': 3,
    'MODERATOR': 2,
    'VIEWER': 1,
    'GUEST': 0
};

export class CommandHandler {
  private commands: Map<string, Command> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.loadCommands();
  }

  private loadCommands() {
    const commandsDir = path.join(__dirname, '..', 'commands');
    if (!fs.existsSync(commandsDir)) return;

    const files = fs.readdirSync(commandsDir);
    for (const file of files) {
      if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('index')) {
        try {
          const command: Command = require(path.join(commandsDir, file)).default;
          if (command && command.name) {
            this.commands.set(command.name, command);
            if (command.aliases) {
              for (const alias of command.aliases) {
                this.aliases.set(alias, command.name);
              }
            }
            logger.info(`Loaded command: ${command.name}`);
          }
        } catch (error) {
          logger.error(`Error loading command from ${file}: ${error}`);
        }
      }
    }
  }

  public async handleMessage(bot: WhatsAppBot, msg: WAMessage) {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const prefix = process.env.PREFIX || '.';

    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const actualCommandName = this.aliases.get(commandName) || commandName;
    const command = this.commands.get(actualCommandName);

    if (command) {
      // Check permissions
      const [user] = await User.findOrCreate({ where: { id: msg.key.participant || msg.key.remoteJid! } });
      const userRole = user.role || 'GUEST';
      const minRole = command.minRole || 'GUEST';

      if (ROLE_PRIORITY[userRole] < ROLE_PRIORITY[minRole]) {
          await bot.sendMessage(msg.key.remoteJid!, { text: `⚠️ You do not have permission to use this command. Required role: ${minRole}` });
          return;
      }

      const ctx: CommandContext = {
        bot,
        msg,
        jid: msg.key.remoteJid!,
        sender: msg.key.participant || msg.key.remoteJid!,
        args,
        text,
      };

      try {
        await command.execute(ctx);
      } catch (error) {
        logger.error(`Error executing command ${commandName}: ${error}`);
        await bot.sendMessage(ctx.jid, { text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
      }
    }
  }
}

export const commandHandler = new CommandHandler();
