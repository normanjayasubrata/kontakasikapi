'use strict';
/** @type {import('sequelize-cli').Migration} */
const gender = require('../enum/gender')
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      contact_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      gender: {
        type: Sequelize.ENUM(...gender)
      },
      birth_place: {
        type: Sequelize.STRING
      },
      birth_date: {
        type: Sequelize.DATE
      },
      province: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      district: {
        type: Sequelize.STRING
      },
      village: {
        type: Sequelize.STRING
      },
      postal_code: {
        type: Sequelize.INTEGER
      },
      address: {
        type: Sequelize.TEXT
      },
      user_id: {
        type: Sequelize.STRING,
        references: {
          model: 'user',
          key: 'user_id',
        }
      },
      created_date: {
        allowNull: false,
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_date: {
        allowNull: false,
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contact');
  }
};