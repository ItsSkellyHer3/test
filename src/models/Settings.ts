import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Settings extends Model {
  declare public key: string;
  declare public value: string;
}

Settings.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'settings',
  }
);

export default Settings;
