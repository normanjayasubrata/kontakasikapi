const {success, failed} = require('../utils/responseBean');
const {User, UserActivityLog} = require('../models');
const LogActivity = require('../enum/logActivity')
const {validationResult} = require('express-validator');
const {getPhoneCountryCode, getPhoneNumber} = require('../utils/phoneNumberUtil');
const {tokenGenerator} = require('../utils/tokenUtil');
const {propertySelector, emptyPropertyRemover} = require('../utils/objectFormatter');
const { deleteImagesFromGCS, uploadImagesToGCS} = require("../utils/uploadGCHandlerUtil")


const register = async (req, res, next) => {
    try {
        validationResult(req).throw();
        // create image name
        const imageFileOriginalName = req.file ? req.file.originalname : null;
        const imageFileName = req.file ? `UI${Date.now()}-${req.file.originalname}` : null;
        //save new user to database
        const newUser = await User.create(emptyPropertyRemover({...req.body, imageName: imageFileName, imageOriginalName: imageFileOriginalName}));
        //if there's image file, upload it to google storage
        if (req.file) {
            await uploadImagesToGCS(req.file, imageFileName)
        }
        //save the log
        await UserActivityLog.create({userId: newUser.userId, action: LogActivity.register, newData: newUser.dataValues})
        res.json(success({}, "User registered successfully"));
    } catch (err) {
        next(failed(err));
    }
};

const getUserInfo = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const userFound = await User.findOne({where: {userId: req.user}});
        if (!userFound) {
            throw new Error('User not found');
        }
        // await UserActivityLog.create({userId: userFound.userId, action: LogActivity.getUserInfo, oldData: userFound.dataValues})
        res.json(success(userFound))
    } catch (err) {
        next(failed(err));
    }
}

const updateUser = async (req, res, next) => {
    try {
        validationResult(req).throw();

        delete req.body.email;
        delete req.body.phone;
        const oldUserData = await User.findOne({where: {userId: req.user}});
        const [rowsUpdated, [updatedUser]] = await User.update(
            emptyPropertyRemover(req.body),
            {
                where: { userId: req.user },
                returning: true,
            }
        );

        if (rowsUpdated === 0) {
            throw new Error(`No user with id ${req.user} found`);
        } else {
            const updatedUserFound = await User.findOne({where: {userId: updatedUser.userId}})
            await UserActivityLog.create({userId: updatedUser.userId, action: LogActivity.updateUserInfo, oldData: oldUserData.dataValues, newData: updatedUserFound.dataValues})
            res.json(success(updatedUserFound, `User ${req.user} updated`));
        }
    } catch (err) {
        next(failed(err));
    }
};


const login = async (req, res, next) => {
    try {
        validationResult(req).throw();
        let foundedUser = null;
        if (req.body.phone) {
            foundedUser = await User.scope('authenticationScope').findAll().then(results => {
                return results.filter(result => result.phone === getPhoneNumber(req.body.phone))[0];
            });
        } else if (req.body.email) {
            foundedUser = await User.scope('authenticationScope').findOne({where: {email: req.body.email.toLowerCase()}});
        } else {
            throw new Error('please input phone or email');
        }

        if (!foundedUser) {
            throw new Error("user not found");
        }

        const loginSuccess = await foundedUser.validatePassword(req.body.password);
        if (!loginSuccess) {
            throw new Error("Wrong password");
        }
        const token = tokenGenerator(foundedUser.userId, foundedUser.email);
        delete foundedUser.dataValues.id;
        delete foundedUser.dataValues.password
        await UserActivityLog.create({userId: foundedUser.userId, action: LogActivity.login})
        res.json(success({...token, foundedUser}, "login success"));


    } catch (err) {
        next(failed(err));
    }
};

const updateUserEmail = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const {email} = req.body;
        const userExist = await User.findOne({where: {email}});
        if (userExist && req.user != userExist.userId) {
            throw new Error(`User with the email ${email} already exists`);
        }

        if (userExist && userExist.email === email) {
            throw new Error(`Email same as before, no update executed`)
        }

        await User.update({email}, {where: {userId: req.user}})
        const updatedUser = await User.findOne({where: {userId: req.user}})
        await UserActivityLog.create({userId: updatedUser.userId, action: LogActivity.updateUserEmail, oldData: {email: email}, newData: {email: updatedUser.email}})
        res.json(success(updatedUser, `Email for user ID ${req.user} updated successfully`));

    } catch (err) {
        next(failed(err));
    }
}

const updateUserPhone = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const {phone} = req.body;
        //check user phone exists
        const phoneExists = await User.findAll().then(results => {
            return results.filter(result => result.phone === getPhoneNumber(phone));
        });

        if (phoneExists.length > 0 && phoneExists[0].userId != req.user) {
            throw new Error(`User with phone number ${phone} already exists`);
        }

        if (phoneExists[0] && phoneExists[0].phone === phone) {
            throw new Error(`Phone same as before, no update executed`)
        }
        await User.update({phone}, {where: {userId: req.user}})
        const updatedUser = await User.findOne({where: {userId: req.user}})
        await UserActivityLog.create({userId: updatedUser.userId, action: LogActivity.updateUserPhone, oldData: {phone: phone}, newData: {phone: updatedUser.phone}})
        res.json(success(updatedUser, `Phone for user ID ${req.user} updated successfully`));

    } catch (err) {
        next(failed(err));
    }
}

const updateUserImage = async (req, res, next) => {
    try {
        const currentImageName = (await User.findOne({where: {userId: req.user}})).getDataValue("imageName")
        if (req.file) {
            if (currentImageName) {
               await deleteImagesFromGCS(currentImageName)
            }
            await uploadImagesToGCS(req.file)
            const deletedStatus = currentImageName ? `, and File ${currentImageName} deleted in GCS` : ""
            await User.update({imageName: req.file.filename}, {where: {userId: req.user}})
            console.log(`File ${req.file.filename} uploaded${deletedStatus}`);
            const updatedUser = await User.findOne({where: {userId: req.user}})
            await UserActivityLog.create({userId: updatedUser.userId, action: LogActivity.updateUserImage, oldData: {imageName: currentImageName}, newData: {imageName: updatedUser.imageName}})
            return res.json(success(updatedUser, "upload success"));
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
