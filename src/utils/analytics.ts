import CommandLog from '../models/CommandLog';
import Message from '../models/Message';
import User from '../models/User';
import { Op } from 'sequelize';

export const getAnalytics = async () => {
  const totalMessages = await Message.count();
  const totalUsers = await User.count();
  const totalCommands = await CommandLog.count();

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime() / 1000;
  const activeUsers24h = await Message.count({
    distinct: true,
    col: 'senderJid',
    where: {
      timestamp: {
        [Op.gt]: last24h
      }
    }
  });

  const commandStats = await CommandLog.findAll({
    attributes: ['command', [CommandLog.sequelize!.fn('COUNT', 'command'), 'count']],
    group: ['command'],
    order: [[CommandLog.sequelize!.literal('count'), 'DESC']],
    limit: 5
  });

  return {
    totalMessages,
    totalUsers,
    totalCommands,
    activeUsers24h,
    commandStats
  };
};
