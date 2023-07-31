const {success, failed} = require('../utils/responseBean');
const {validationResult} = require('express-validator');
const {tokenGenerator} = require('../utils/tokenUtil');
const UserService = require('../services/user')
const LogActivityService = require('../services/logActivity')
const LogEnum = require('../enum/logActivity');


const register = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const {firstName, lastName, gender, birthPlace, birthDate, province, city, district, village, postalCode, address, email, phone, password} = req.body;
        const payload = {firstName, lastName, gender, birthPlace, birthDate, province, city, district, village, postalCode, address, email, phone, password}

        const newUser = await UserService.createUser(payload);
        if (!newUser) {
            throw new Error("Something went wrong when creating new user")
        }
        if (req.file) {
            await UserService.uploadUserImageByUserId(newUser.userId, req.file)
        }
        await LogActivityService.saveLog(newUser.userId, LogEnum.register, newUser.dataValues, null)
        res.json(success({}, "User registered successfully"));
    } catch (err) {
        next(failed(err));
    }
};

const getUserInfo = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const userFound = await UserService.getUserByUserId(req.user)
        if (!userFound) {
            throw new Error("No user found with userId " + req.user)
        }
        res.json(success(userFound))
    } catch (err) {
        next(failed(err));
    }
}

const updateUser = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const {firstName, lastName, gender, birthPlace, birthDate, province, city, district, village, postalCode, address} = req.body;
        const payload = {firstName, lastName, gender, birthPlace, birthDate, province, city, district, village, postalCode, address}
        const oldUserData = await UserService.getUserByUserId(req.user)
        const updatedUser = await UserService.updateUserByUserId(req.user, payload)
        await LogActivityService.saveLog(req.user, LogEnum.updateUserInfo, updatedUser.dataValues, oldUserData.dataValues)
        res.json(success(updatedUser, `User ${req.user} updated`));
    } catch (err) {
        next(failed(err))
    }
}


const login = async (req, res, next) => {
    try {
        validationResult(req).throw();
        let userInfo = null;
        if (req.body.phone) {
            userInfo = await UserService.loginByPhone(req.body.phone, req.body.password);
        } else if (req.body.email) {
            userInfo = await UserService.loginByEmail(req.body.email, req.body.password)
        } else {
            throw new Error('please input phone or email');
        }
        const token = tokenGenerator(userInfo.userId, userInfo.email);
        await LogActivityService.saveLog(userInfo.userId, LogEnum.login, null, null)
        res.json(success({token, userInfo}, "login success"));

    } catch (err) {
        next(failed(err));
    }
};
const updateUserEmail = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const {email} = req.body;
        const userExist = await UserService.getUserByEmail(email);
        if (userExist && req.user !== userExist.userId) {
            throw new Error(`User with the email ${email} already exists`);
        }
        if (userExist && userExist.email === email) {
            throw new Error(`Email same as before, no update executed`)
        }
        const oldUserData = await UserService.getUserByUserId(req.user)
        const updatedUser = await UserService.updateUserByUserId(req.user, {email})
        await LogActivityService.saveLog(req.user, LogEnum.updateUserEmail, updatedUser.dataValues, oldUserData.dataValues)
        res.json(success(updatedUser, `Email for user ID ${req.user} updated successfully`));

    } catch (err) {
        next(failed(err));
    }
}

const updateUserPhone = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const {phone} = req.body;
        const phoneExists = await UserService.getUserByPhone(phone)
        if (phoneExists && phoneExists.userId !== req.user) {
            throw new Error(`User with phone number ${phone} already exists`);
        }
        if (phoneExists && phoneExists.phone === phone) {
            throw new Error(`Phone same as before, no update executed`)
        }
        const oldUserData = await UserService.getUserByUserId(req.user)
        const updatedUser = await UserService.updateUserByUserId(req.user, {phone})
        await LogActivityService.saveLog(req.user, LogEnum.updateUserPhone, updatedUser.dataValues, oldUserData.dataValues)
        res.json(success(updatedUser, `Phone for user ID ${req.user} updated successfully`));

    } catch (err) {
        next(failed(err));
    }
}

const updateUserImage = async (req, res, next) => {
    try {
        if (req.file) {
            const oldUserData = await UserService.getUserByUserId(req.user)
            const uploadSuccess = await UserService.uploadUserImageByUserId(req.user, req.file)
            if (uploadSuccess) {
                await LogActivityService.saveLog(req.user, LogEnum.updateUserImage, uploadSuccess.dataValues, oldUserData.dataValues)
                return res.json(success({}, "upload success"));
            } else {
                return next(failed("failed to upload the image"));
            }
        } else {
            return res.json(success({}, "no file uploaded"));
        }
    } catch (err) {
        next(failed(err));
    }
}

module.exports = {
    register,
    getUserInfo,
    updateUser,
    updateUserEmail,
    updateUserPhone,
    updateUserImage,
    login
};
