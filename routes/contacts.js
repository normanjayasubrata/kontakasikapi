const express = require('express');
const {check} = require('express-validator');
const router = express.Router();
const {createContact, readContacts, readContact, updateContact, deleteContact, readContactImages, createContactImage, updateContactImages, deleteContactImage} = require('../controllers/contacts');
const {getPhoneNumber, phoneLength} = require('../utils/phoneNumberUtil')
const {tokenValidator} = require('../utils/tokenUtil')
const {multerCloudImagesUploadMiddleWare, multerCloudImageUploadMiddleWare} = require('../utils/uploadHandlerUtil')


router.get('/', tokenValidator, readContacts);
router.get('/:contactId', tokenValidator, readContact);
router.post('/',
    tokenValidator,
    multerCloudImagesUploadMiddleWare,
    check('firstName', 'firstName field cannot be empty').trim().not().isEmpty(),
    check('email', 'email field cannot be empty').trim().not().isEmpty(),
    check('email', 'invalid email value').isEmail().normalizeEmail(),
    check('phone', 'phone field cannot be empty').trim().not().isEmpty(),
    check('phone').customSanitizer(getPhoneNumber),
    check('phone', `phone length must between ${phoneLength.min} and ${phoneLength.max}, and begin with '+' sign`).isLength(phoneLength),
    createContact
);

router.put('/:contactId',
    tokenValidator,
    check('firstName', 'firstName field cannot be empty').trim().not().isEmpty(),
    check('email', 'email field cannot be empty').trim().not().isEmpty(),
    check('email', 'invalid email value').isEmail().normalizeEmail(),
    check('phone', 'phone field cannot be empty').trim().not().isEmpty(),
    check('phone').customSanitizer(getPhoneNumber),
    check('phone', `phone length must between ${phoneLength.min} and ${phoneLength.max}, and begin with '+' sign`).isLength(phoneLength),
    updateContact
);

router.get('/images/:contactId',
    tokenValidator,
    readContactImages
)

router.post('/images/:contactId',
    tokenValidator,
    multerCloudImageUploadMiddleWare,
    createContactImage
)

router.put('/images/:contactId/:contactImageId',
    tokenValidator,
    updateContactImages
)

router.delete('/images/:contactId/:contactImageId',
    tokenValidator,
    deleteContactImage
)

router.delete('/:contactId', tokenValidator, deleteContact);

module.exports = router;