const {success, failed} = require("../utils/responseBean");
const {uploadImageToUCareCDN, deleteImageFromUCareCDN} = require("../utils/uploadCareHandlerUtil")
const db = require("../models")
const testGet = (req, res, next) => {
    res.json(success({}, 'you are successfully connected'))
}

const testDB = async (req, res, next) => {
    try {
        const response = await db.sequelize.authenticate();
        res.json(success(response, `Database connection for '${process.env.NODE_ENV || 'development'}' has been established successfully.`))
    } catch (error) {
        next(failed(error))
    }
}

const testStorage = async (req, res, next) => {
    try {
        if (req.file) {
            const uploadResult = await uploadImageToUCareCDN(req.file)
            await deleteImageFromUCareCDN(uploadResult.uuid)
            res.json(success(uploadResult, `connection to storage success`))

        } else {
            res.json(success({}, `please select one image to upload`))

        }
    } catch (error) {
        next(failed(error))
    }
}

module.exports = {
    testGet,
    testDB,
    testStorage
}