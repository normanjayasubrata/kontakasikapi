const express = require('express');
const {check, body} = require('express-validator');
const router = express.Router();
const {register, login, updateUser, getUserInfo, updateUserEmail, updateUserPhone, updateUserImage } = require('../controllers/users');
const {getPhoneNumber, phoneLength} = require('../utils/phoneNumberUtil');
const phoneOrEmailChecker = require('../utils/phoneOrEmailChecker')
const {multerCloudImageUploadMiddleWare} = require('../utils/uploadHandlerUtil')
const {tokenValidator} = require('../utils/tokenUtil')


/* GET users listing. */
router.post('/register',
    multerCloudImageUploadMiddleWare,
    check('firstName', 'firstName field cannot be empty').trim().not().isEmpty(),
    check('email', 'email field cannot be empty').trim().not().isEmpty(),
    check('email', 'invalid email value').isEmail().normalizeEmail(),
    check('password', 'password field cannot be empty').trim().not().isEmpty(),
    check('password', 'password too weak').isStrongPassword(),
    check('phone', 'phone field cannot be empty').trim().not().isEmpty(),
    check('phone').customSanitizer(getPhoneNumber),
    check('phone', `phone length must between ${phoneLength.min} and ${phoneLength.max}, and begin with '+' sign`).isLength(phoneLength),
    register
);

router.get(
    '/',
    tokenValidator,
    getUserInfo
);

router.put('/update',
    tokenValidator,
    updateUser
)

router.put('/update/email',
    tokenValidator,
    check('email', 'email field cannot be empty').trim().not().isEmpty(),
    check('email', 'invalid email value').isEmail().normalizeEmail(),
    updateUserEmail
)

router.put('/update/phone',
    tokenValidator,
    check('phone', 'phone field cannot be empty').trim().not().isEmpty(),
    check('phone').customSanitizer(getPhoneNumber),
    check('phone', `phone length must between ${phoneLength.min} and ${phoneLength.max}, and begin with '+' sign`).isLength(phoneLength),
    updateUserPhone
)

router.put('/update/image',
    tokenValidator,
    multerCloudImageUploadMiddleWare,
    updateUserImage
)

router.post('/login',
    check('phoneOrEmail', 'please input phone or email').trim().not().isEmpty(),
    check('password', 'please input the password').trim().not().isEmpty(),
    body().customSanitizer(phoneOrEmailChecker),
    check('falseInput', 'please input valid email or phone number').not().exists(),
    login
)



module.exports = router;
