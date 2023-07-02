const {validationResult} = require('express-validator');
const {success, failed} = require('../utils/responseBean');
const models = require('../models');
const {contactIdGenerator} = require('../utils/idGenerator');
const {phoneEncryptor} = require('../utils/cryptoUtil');
const CryptoJS = require('crypto-js');
const {Op} = require('Sequelize');

const getContacts = (req, res, next) => {
    res.json({
        title: 'get contacts list'
    });
};

const createContact = async (req, res, next) => {
    console.log("phone: ", req.body.phone);
    // const iv = CryptoJS.lib.WordArray.random(16);
    // const iv = process.env.ENCRYPTED_PHONE_IV
    const iv = CryptoJS.enc.Hex.parse('002d9e27a30cd8a7f4fa2739b65de7d9'); // Convert the IV string to a WordArray

    const encryptedPhone = CryptoJS.AES.encrypt(req.body.phone, 'secret_key', {iv}).toString();
    try {
        validationResult(req).throw();
        // const emailExist = await models.Contact.findOne({where: {email: req.body.email, user_id: req.body.user_id}});

        // if (emailExist) {
        //     const error = new Error("email already exists");
        //     throw error;
        // }
        // findPhoneNumber(req.body.phone)

        const contact = await models.Contact.findAll({
            where: {
                encrypted_phone: encryptedPhone
            }
        });
        console.log(contact);
        if (!contact || contact.length === 0) {
            const error = new Error("contact not found");
            error.status = 404;
            throw error;
        } else {
            return res.json(success(contact, "new contact generated successfully"));
        }

        // const phoneNumberExist = await models.Contact.findOne({
        //     where: {
        //         // phone: req.body.phone,
        //         phone: phoneEncryptor(req.body.phone),
        //         user_id: req.body.user_id
        //     }
        // });

        // if (phoneNumberExist) {
        //     const error = new Error("phone number already exists");
        //     throw error;
        // }

        // const contactObject = {...req.body, encrypted_phone: phoneEncryptor(req.body.phone)}
        // const contactObject = {...req.body, encrypted_phone: encryptedPhone}
        // const result = await models.Contact.create({contact_id: contactIdGenerator(), ...contactObject});
        // return res.json(success(result, "new contact generated successfully"));
    } catch (err) {
        next(failed(err));
    }
};

const findPhoneNumber = async (phone) => {
    console.log("phone", phone);
    try {
        const encryptedPhoneNumber = CryptoJS.AES.encrypt(phone, process.env.SECRET_KEY).toString();
        const phoneNumber = await models.Contact.findOne({
            where: {
                encrypted_phone: encryptedPhoneNumber
            }
        });
        console.log("phone", phoneNumber);

        if (phoneNumber) {
            const decryptedPhoneNumber = CryptoJS.AES.decrypt(phoneNumber.encrypted_phone, 'your secret key').toString(CryptoJS.enc.Utf8);
            console.log('Decrypted phone number:', decryptedPhoneNumber);
        } else {
            console.log('Phone number not found.');
        }
    } catch (error) {
        console.error('Error finding phone number:', error);
    }
};

const key = "secret_key";
const salt = CryptoJS.enc.Hex.parse("60a9810555914e9d1c1ee4bf6d851a7d");
const iv = CryptoJS.enc.Hex.parse("002d9e27a30cd8a7f4fa2739b65de7d9");

const encryptedPhone1 = CryptoJS.AES.encrypt("3455454", key, {
    iv: iv,
    salt: salt,
    mode: CryptoJS.mode.CBC,

}).toString();

const encryptedPhone2 = CryptoJS.AES.encrypt("3455454", key, {
    iv: iv,
    salt: salt,
    mode: CryptoJS.mode.CBC,
}).toString();

console.log(encryptedPhone1);
console.log(encryptedPhone2);

// Compare the encrypted phone numbers in a case-insensitive manner
console.log(
    encryptedPhone1.localeCompare(encryptedPhone2, undefined, {
        sensitivity: "base",
    }) === 0
);






// const decryptedPhone = CryptoJS.AES.decrypt(encryptedPhone2, 'secret_key', { iv }).toString(CryptoJS.enc.Utf8);
// console.log("decryptedPhone",decryptedPhone);
//

module.exports = {
    getContacts,
    createContact
};

