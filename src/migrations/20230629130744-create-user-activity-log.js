'use strict';
/** @type {import('sequelize-cli').Migration} */
const logEnums = require('../enum/logActivity')
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_activity_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.STRING
      },
      action: {
        type: Sequelize.ENUM(...Object.values(logEnums))
      },
      old_data: {
        type: Sequelize.JSONB
      },
      new_data: {
        type: Sequelize.JSONB
      },
      description: {
        type: Sequelize.TEXT
      },
      created_date: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_date: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_activity_logs');
  }
};