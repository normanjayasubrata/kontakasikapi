'use strict';
const {
  Model
} = require('sequelize');
const logEnum = require('../enum/logActivity')
module.exports = (sequelize, DataTypes) => {
  class UserActivityLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserActivityLog.belongsTo(models.User, {
        as: 'user',
        foreignKey: 'userId'
      })
    }
  }
  UserActivityLog.init({
    userId: DataTypes.STRING,
    action: DataTypes.ENUM(...Object.values(logEnum)),
    oldData: DataTypes.JSONB,
    newData: DataTypes.JSONB,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'UserActivityLog',
    tableName: 'user_activity_logs',
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date'
  });
  return UserActivityLog;
};