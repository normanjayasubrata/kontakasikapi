'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ContactImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ContactImage.belongsTo(models.Contact, {
        as: 'contact',
        foreignKey: 'contactId',
      })
    }
  }
  ContactImage.init({
    imageId: DataTypes.STRING,
    imageName: DataTypes.STRING,
    imageOriginalName: DataTypes.STRING,
    isDefaultImage: DataTypes.BOOLEAN,
    contactId: {
      type: DataTypes.STRING, // Use STRING data type
      references: {
        model: 'contact', // Reference the Contact model
        key: 'contactId'
      }
    },
    cdnUrl: DataTypes.STRING
  }, {
    defaultScope: {
      attributes: {exclude: ['id', 'created_date', 'updated_date']}
    },
    scopes: {
      allContactImageScope: {
        attributes: {}
      },
      simplifiedContactImageScope: {
        attributes: {exclude: ['id', 'imageId', 'isDefaultImage', 'contactId', 'created_date', 'updated_date']}
      }
    },
    sequelize,
    modelName: 'ContactImage',
    tableName:'contact_image',
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date'
  });
  return ContactImage;
};