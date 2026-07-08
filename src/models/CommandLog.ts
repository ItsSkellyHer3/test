import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class CommandLog extends Model {
  public id!: number;
  public command!: string;
  public userJid!: string;
  public chatJid!: string;
  public success!: boolean;
  public timestamp!: number;
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
