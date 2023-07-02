'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_image', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      image_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      is_default_image: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      image_name: {
        type: Sequelize.STRING
      },
      image_original_name: {
        type: Sequelize.STRING
      },
      contact_id: {
        type: Sequelize.STRING,
        references: {
          model: 'contact',
          key: 'contact_id'
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
    await queryInterface.dropTable('contact_image');
  }
};