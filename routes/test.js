const express = require('express');
const {check} = require('express-validator');
const router = express.Router();
const {testPost, testPut, testGet} = require('../controllers/test');
const {multipartMiddleware} = require('../utils/uploadGCHandlerUtil')
const {multerCloudImageUploadMiddleWare, multerDiskImageUploadMiddleWare, multerCloudImagesUploadMiddleWare} = require('../utils/uploadHandlerUtil')
const {tokenValidator} = require('../utils/tokenUtil')

router.get('/', testGet)

router.post('/',

    // multipartMiddleware,
    multerCloudImagesUploadMiddleWare,
    // check('name', 'name field cannot be empty').trim().not().isEmpty(),
    testPost
)

router.put('/',
    tokenValidator,
    // GCSImageUploadMiddleware,
    testPut
)

module.exports = router;