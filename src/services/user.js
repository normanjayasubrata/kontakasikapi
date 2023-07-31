const User = require('../models').User;
const {emptyPropertyRemover} = require('../utils/objectFormatter');
const {getPhoneNumber} = require("../utils/phoneNumberUtil");
const {deleteImageFromUCareCDN, uploadImageToUCareCDN} = require("../utils/uploadCareHandlerUtil");
const {UserActivityLog} = require("../models");
const LogActivity = require("../enum/logActivity");

exports.createUser = async (payload) => {
    if (!payload) {
        throw new Error("please input the requirements");
    }
    const filteredPayload = emptyPropertyRemover(payload);
    const userCreated = await User.create(filteredPayload);
    if (userCreated) {
        return userCreated;
    } else {
        return null;
    }
};

exports.getUserByUserId = async (userId) => {
    if (!userId) {
        throw new Error("please input userId");
    }
    return await User.findOne({where: {userId}});
};

exports.getUserByEmail = async (email) => {
    if (!email) {
        throw new Error("please input email");
    }
    return await User.findOne({where: {email}});
};

exports.getUserByPhone = async (phone) => {
    if (!phone) {
        throw new Error("please input phone");
    }
    const userFound = await User.findAll().then(results => {
        return results.filter(result => result.phone === getPhoneNumber(phone));
    });
    return userFound.length > 0 ? userFound[0] : null;
};

exports.updateUserByUserId = async (userId, payload) => {
    if (!userId) {
        throw new Error("please input userId");
    }
    if (typeof payload !== "object") {
        throw new Error("payload must be an object");
    }
    const filteredPayload = emptyPropertyRemover(payload);
    const [rowsUpdated, [updatedUser]] = await User.update(
        filteredPayload,
        {
            where: {userId: userId},
            returning: true,
        }
    );

    if (rowsUpdated === 0) {
        throw new Error(`No user with id ${userId} found`);
    } else {
        return await this.getUserByUserId(updatedUser.userId);
    }
};

exports.uploadUserImageByUserId = async (userId, file) => {
    if (!userId) {
        throw new Error("please input userId");
    }
    if (!file || !file.buffer) {
        throw new Error("please input a proper file");
    }
    const userFound = await this.getUserByUserId(userId);
    const currentImageId = userFound.imageId;
    if (currentImageId) {
        const currentImageName = userFound.imageOriginalName;
        const deleteResult = await deleteImageFromUCareCDN(currentImageId);
        if (deleteResult) {
            console.log(`File ${currentImageName} deleted in CDN`);
        } else {
            console.log(`File ${currentImageName} with id ${currentImageId} not yet deleted - response : ${deleteResult}`);
        }
    }
    const uploadResult = await uploadImageToUCareCDN(file);
    if (uploadResult.isStored) {
        const dataUpdate = {
            imageId: uploadResult.uuid,
            imageName: uploadResult.name,
            imageOriginalName: uploadResult.originalFilename,
            imageCdnUrl: uploadResult.cdnUrl
        };
        console.log(`File ${file.originalname} uploaded with id ${dataUpdate.imageId}`);
        return await this.updateUserByUserId(userId, dataUpdate);
    } else {
        console.error(`failed uploading image for user ${userId} : ${uploadResult}`);
        return null;
    }

};

exports.loginByPhone = async (phone, password) => {
    if (!phone) {
        throw new Error("please input the phone");
    }
    if (!password) {
        throw new Error("please input the password");
    }
    const foundUser = await User.scope('authenticationScope').findAll().then(results => {
        return results.filter(result => result.phone === getPhoneNumber(phone))[0];
    });
    if (!foundUser) {
        throw new Error(`user with phone ${phone} not found`);
    }
    const loginSuccess = await foundUser.validatePassword(password);
    if (!loginSuccess) {
        throw new Error(`Password input for user ${foundUser.firstName} is wrong `);
    }
    delete foundUser.dataValues.id;
    delete foundUser.dataValues.password;
    return foundUser;
};

exports.loginByEmail = async (email, password) => {
    if (!email) {
        throw new Error("please input the email");
    }
    if (!password) {
        throw new Error("please input the password");
    }
    const foundUser = await User.scope('authenticationScope').findOne({where: {email: email.toLowerCase()}});
    if (!foundUser) {
        throw new Error(`user with email ${email} not found`);
    }
    const loginSuccess = await foundUser.validatePassword(password);
    if (!loginSuccess) {
        throw new Error(`Password input for user ${foundUser.firstName} is wrong `);
    }
    delete foundUser.dataValues.id;
    delete foundUser.dataValues.password;
    return foundUser;
};
