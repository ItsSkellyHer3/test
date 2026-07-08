import { WhatsAppBot } from '../bot/WhatsAppBot';
import logger from '../utils/logger';

async function testBot() {
  const bot = new WhatsAppBot();

  bot.on('qr', (qr) => {
    logger.info('QR Code received (Bot is working and waiting for scan)');
    process.exit(0); // Exit successfully if QR is generated
  });

  bot.on('connected', () => {
    logger.info('Bot connected successfully');
    process.exit(0);
  });

  try {
    logger.info('Starting bot test...');
    // We don't want to actually start a full session in the test if it requires a real QR scan
    // but we can check if it initializes correctly.
    // However, Baileys will likely print the QR.

    // We'll set a timeout to fail if nothing happens
    setTimeout(() => {
      logger.error('Bot test timed out');
      process.exit(1);
    }, 30000);

    await bot.start();
  } catch (error) {
    logger.error({ err: error }, 'Bot failed to start');
    process.exit(1);
  }
}

testBot();
