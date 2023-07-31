'use strict';

const {phoneDecryptor, phoneEncryptor} = require('../utils/cryptoUtil')
const gender = require('../enum/gender')
const {
  Model, Sequelize
} = require('sequelize');
const {contactIdGenerator} = require('../utils/idGenerator');

const {getPhoneNumber} = require("../utils/phoneNumberUtil");
const {stringCapitalize} = require("../utils/stringFormatter");
module.exports = (sequelize, DataTypes) => {
  class Contact extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Contact.belongsTo(models.User, {
        as: 'user',
        foreignKey: 'userId'
      });
      Contact.hasMany(models.ContactImage, {
        foreignKey: 'contactId',
        as: 'contactImage',
      });
    }
  }
  Contact.init({
    contactId: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    phone: {
      type: DataTypes.STRING,
      get() {
        const encryptedPhone = this.getDataValue('phone')
        return phoneDecryptor(encryptedPhone)
      },
      set(value) {
        this.setDataValue('phone', phoneEncryptor(value))
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    gender: {
      type: DataTypes.ENUM,
      values: gender
    },
    birthPlace: DataTypes.STRING,
    birthDate: DataTypes.DATE,
    province: DataTypes.STRING,
    city: DataTypes.STRING,
    district: DataTypes.STRING,
    village: DataTypes.STRING,
    postalCode: DataTypes.INTEGER,
    address: DataTypes.TEXT,
    userId: DataTypes.STRING,
  }, {
    hooks: {
      beforeValidate(contact, options) {
        if (contact.firstName) {
          contact.firstName = stringCapitalize(contact.firstName)
        }
        if (contact.lastName) {
          contact.lastName = stringCapitalize(contact.lastName)
        }
        if (contact.province) {
          contact.province = stringCapitalize(contact.province)
        }
        if (contact.city) {
          contact.city = stringCapitalize(contact.city)
        }
        if (contact.district) {
          contact.district = stringCapitalize(contact.district)
        }
        if (contact.village) {
          contact.village = stringCapitalize(contact.village)
        }
        if (contact.gender) {
          contact.gender = stringCapitalize(contact.gender);
        }
      },
      beforeCreate: async (contact, options) => {
        // check contact email exists
        const contactExist = await sequelize.models.Contact.findOne({ where : {userId: contact.userId ,email: contact.email}})
        if (contactExist) {
          throw new Error(`(create) Contact with the email ${contact.email} already exists`);
        }

        // check contact phone exists
        const phoneExists = await sequelize.models.Contact.findAll({where: {userId: contact.userId}}).then(results => {
          return results.filter(result => result.phone === getPhoneNumber(contact.phone));
        });
        if (phoneExists.length > 0) {
          throw new Error(`Contact with phone number ${contact.phone} already exists`);
        }

        // generate contact id
        contact.contactId = contactIdGenerator();
      }
    },
    defaultScope: {
      attributes: {exclude: ['id', 'userId', 'created_date', 'updated_date']}
    },
    scopes: {
      simplifiedScope: {
        attributes: ['contactId', 'firstName', 'lastName', 'phone', 'email', 'gender']
      },
      onlyContactIdScope: {
        attributes: ['contactId']
      },
      withIdScope: {
        attributes: { exclude: ['created_date', 'updatedAt'] }
      },
      allContactScope: {
        attributes: {}
      }
    },
    sequelize,
    modelName: 'Contact',
    tableName: 'contact',
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date'
  });
  return Contact;
};