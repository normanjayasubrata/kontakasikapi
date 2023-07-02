const fs = require('fs');
const path = require('path');
const { uploadImages, multer } = require("../utils/uploadHandlerUtil");

const {failed} = require("../utils/responseBean");

const profilePictureUpload = (req, res, next) => {
    try {
        uploadImages(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return next(failed(err));
            } else if (err) {
                return next(failed(err));
            }
            if (req.file) {
                console.log(`file ${req.file.filename} for new user ${req.body.email} uploaded`);
            } else {
                // return next(failed('File not found'));
                console.log("No file Uploaded");
            }
            return next();
        });

    } catch (err) {
        next(failed(err));
    }
};

const deleteFailedUserCreateImage = async (userEmail, filename) => {
    try {
        const filePath = path.join(__dirname, "..", "uploads", "images", filename);
        await fs.promises.unlink(filePath);
        console.log(`image ${filename} for new user ${userEmail}  deleted`);
    } catch (error) {
        console.log('Error deleting file:', error);
    }
}

module.exports = {
    profilePictureUpload,
    deleteFailedUserCreateImage,
};
