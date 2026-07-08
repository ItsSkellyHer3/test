import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Message extends Model {
  declare public id: string;
  declare public chatJid: string;
  declare public senderJid: string;
  declare public content: string;
  declare public type: string;
  declare public timestamp: number;
  declare public isEdited: boolean;
}

Message.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    chatJid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderJid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'message',
  }
);

export default Message;
