import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Group extends Model {
  public id!: string; // JID
  public name!: string;
  public description!: string | null;
  public isBotAdmin!: boolean;
}

Group.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isBotAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'group',
  }
);

export default Group;
