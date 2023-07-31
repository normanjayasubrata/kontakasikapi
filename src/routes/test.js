const express = require('express');
const router = express.Router();
const {testGet, testDB, testStorage} = require('../controllers/test');
const {multerCloudImageUploadMiddleWare}= require('../utils/uploadHandlerUtil')

router.get('/', testGet)
router.get('/database', testDB)
router.get('/storage',multerCloudImageUploadMiddleWare, testStorage)


module.exports = router;