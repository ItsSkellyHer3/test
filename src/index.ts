import { bot } from './bot/WhatsAppBot';
import sequelize from './database';
import logger from './utils/logger';
import { commandHandler } from './utils/commandHandler';
import { startServer } from './server';

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    logger.info('Database connected.');

    bot.on('connected', () => {
      logger.info('Bot is ready!');
    });

    bot.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message) continue;

        const jid = msg.key.remoteJid!;
        const sender = msg.key.participant || jid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Passive Owner Detection
        const ownerNumber = process.env.OWNER_NUMBER || '';
        if (jid.endsWith('@g.us') && sender === ownerNumber && !text.startsWith(process.env.PREFIX || '.')) {
            await bot.sendMessage(jid, { text: `👑 The King has spoken! Welcome back, Boss.` }, { quoted: msg });
        }

        // Save message to DB
        try {
            await Message.upsert({
                id: msg.key.id!,
                chatJid: jid,
                senderJid: sender,
                content: text,
                type: Object.keys(msg.message)[0],
                timestamp: msg.messageTimestamp as number,
                isEdited: !!msg.message.editedMessage
            });
        } catch (e) {
            logger.error(`Failed to save message: ${e}`);
        }

        // Handle commands
        await commandHandler.handleMessage(bot, msg);
      }
    });

    startServer();
    await bot.start();
  } catch (error) {
    logger.error({ err: error }, 'Failed to start application');
  }
}

main();
