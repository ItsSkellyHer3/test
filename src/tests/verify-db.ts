import sequelize from '../database';
import User from '../models/User';
import Group from '../models/Group';
import Message from '../models/Message';
import CommandLog from '../models/CommandLog';
import Settings from '../models/Settings';
import logger from '../utils/logger';

async function verifyModels() {
  try {
    await sequelize.authenticate();
    logger.info('Connection to database has been established successfully.');

    await sequelize.sync({ force: true });
    logger.info('All models were synchronized successfully.');

    // Create a test user
    const testUser = await User.create({
      id: '1234567890@s.whatsapp.net',
      name: 'Test User',
      role: 'OWNER'
    });
    logger.info(`Test user created: ${JSON.stringify(testUser.toJSON())}`);

    const users = await User.findAll();
    logger.info(`All users: ${JSON.stringify(users.map(u => u.toJSON()))}`);

  } catch (error) {
    logger.error({ err: error }, 'Unable to connect to the database or sync models');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verifyModels();
