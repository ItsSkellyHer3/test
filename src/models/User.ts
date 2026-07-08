import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class User extends Model {
  declare public id: string; // JID
  declare public name: string | null;
  declare public password: string | null;
  declare public role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'VIEWER' | 'GUEST';
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('OWNER', 'ADMIN', 'MODERATOR', 'VIEWER', 'GUEST'),
      defaultValue: 'GUEST',
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);

export default User;
