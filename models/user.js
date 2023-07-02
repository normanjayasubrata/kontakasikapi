'use strict';
const bcrypt = require("bcryptjs");
const {userIdGenerator} = require('../utils/idGenerator');
const {
    Model
} = require('sequelize');
const {phoneDecryptor, phoneEncryptor} = require("../utils/cryptoUtil");
const gender = require("../enum/gender");
const {getPhoneNumber} = require("../utils/phoneNumberUtil");
const {stringCapitalize} = require("../utils/stringFormatter");
const {getImageUrlFromGCS} = require("../utils/uploadGCHandlerUtil")
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            User.hasMany(models.Contact, {
                as: 'contact',
                foreignKey: 'contactId'
            })
            User.hasMany(models.UserActivityLog, {
                as: 'userActivityLog',
                foreignKey: 'id'
            })

        }
        async validatePassword(password) {
            return await bcrypt.compare(password, this.password);
        }

    }

    User.init({
        userId: DataTypes.STRING,
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        phone: {
            type: DataTypes.STRING,
            get() {
                return phoneDecryptor(this.getDataValue('phone'));
            },
            set(value) {
                this.setDataValue('phone', phoneEncryptor(value));
            }
        },
        email: DataTypes.STRING,
        password: DataTypes.STRING,
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
        imageName: DataTypes.STRING,
        imageOriginalName: DataTypes.STRING,
        imageUrl: {
            type: DataTypes.VIRTUAL,
            get() {
                if (this.imageName) {
                    return getImageUrlFromGCS(this.imageName)
                }
            }
        }
    }, {
        hooks: {
            beforeValidate(user, options) {
                if (user.firstName) {
                    user.firstName = stringCapitalize(user.firstName)
                }
                if (user.lastName) {
                    user.lastName = stringCapitalize(user.lastName)
                }
                if (user.province) {
                    user.province = stringCapitalize(user.province)
                }
                if (user.city) {
                    user.city = stringCapitalize(user.city)
                }
                if (user.district) {
                    user.district = stringCapitalize(user.district)
                }
                if (user.village) {
                    user.village = stringCapitalize(user.village)
                }
                if (user.gender) {
                    user.gender = stringCapitalize(user.gender);
                }
            },
            beforeCreate: async (user) => {
                //check user email exists
                const userExist = await sequelize.models.User.findOne({where: {email: user.email}});
                if (userExist) {
                    throw new Error(`User with the email ${user.email} already exists`);
                }

                //check user phone exists
                const phoneExists = await sequelize.models.User.findAll().then(results => {
                    return results.filter(result => result.phone === getPhoneNumber(user.phone));
                });
                if (phoneExists.length > 0) {
                    throw new Error(`User with phone number ${user.phone} already exists`);
                }

                //generate userId
                user.userId = userIdGenerator();

                //generate hashed password
                const hashedPassword = await bcrypt.hash(user.password, 12);
                user.password = hashedPassword;
            }
        },
        defaultScope: {
            attributes: {exclude: ['id', 'password', 'created_date', 'updated_date']}
        },
        scopes: {
            authenticationScope: {
                attributes:  ['id', 'userId', 'phone', 'email', 'password', 'firstName', 'imageName', 'imageUrl']
            }
        },
        sequelize,
        modelName: 'User',
        tableName: 'user',
        underscored: true,
        freezeTableName: true,
        timestamps: true,
        createdAt: 'created_date',
        updatedAt: 'updated_date',
    });
    return User;
};
