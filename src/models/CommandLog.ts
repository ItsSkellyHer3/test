import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class CommandLog extends Model {
  declare public id: number;
  declare public command: string;
  declare public userJid: string;
  declare public chatJid: string;
  declare public success: boolean;
  declare public timestamp: number;
}

CommandLog.init(
  {
    command: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userJid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chatJid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'command_log',
  }
);

export default CommandLog;
