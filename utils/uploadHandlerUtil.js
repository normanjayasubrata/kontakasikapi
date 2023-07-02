const multer = require('multer');
const mime = require('mime');
const path = require('path');
const fs = require('fs');
const { failed } = require("./responseBean");

const allowedFileSizes = {
    image: 1024 * 1024, // 1MB
}

const maximumFileUploadCount = {
    image: 5
}

const fieldNames = {
    image: 'file_image',
    pdf: 'file_pdf',
};

const allowedFileTypes = {
    image: ['image/png', 'image/jpeg'],
    pdf: ['pdf'],
};

const fileFilters = {
    image: (req, file, cb) => {
        const allowedMimeTypes = allowedFileTypes.image;
        const mimeType = mime.getType(file.originalname);
        if (!allowedMimeTypes.includes(mimeType)) {
            return cb(new Error('Invalid file type. Only PNG and JPEG files are allowed.'));
        }
        cb(null, true);
    },
    pdf: (req, file, cb) => {
        const allowedMimeTypes = allowedFileTypes.pdf;
        const mimeType = mime.getType(file.originalname);
        if (!allowedMimeTypes.includes(mimeType)) {
            return cb(new Error('Invalid file type. Only PDF files are allowed.'));
        }
        cb(null, true);
    },
};

// disk directory initiation
const imagesUploadsDir = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(imagesUploadsDir)) {
    fs.mkdirSync(imagesUploadsDir, { recursive: true });
}

const pdfUploadsDir = path.join(__dirname, '..', 'uploads', 'pdf');
if (!fs.existsSync(pdfUploadsDir)) {
    fs.mkdirSync(pdfUploadsDir, { recursive: true });
}

// storage initialization
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, imagesUploadsDir);
        } else if (file.mimetype.startsWith('application/pdf')) {
            cb(null, pdfUploadsDir);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const tempStorage = multer.memoryStorage();

// Function to create the uploader with the given storage and file filter
const createUploader = (storage, fileFilter, fieldName) => {
    return multer({
        storage: storage,
        fileFilter: fileFilter,
    }).single(fieldName);
};

// Create the uploader instances
const diskImageUploader = createUploader(diskStorage, fileFilters.image, fieldNames.image);
const tempImageUploader = createUploader(tempStorage, fileFilters.image, fieldNames.image);
const diskPDFUploader = createUploader(diskStorage, fileFilters.pdf, fieldNames.pdf)
const tempPDFUploader = createUploader(tempStorage, fileFilters.pdf, fieldNames.pdf)

// Function to handle the file upload and invoke the appropriate callbacks
const handleFileUpload = (req, res, next, fieldName) => {
    return async function (err) {
        if (err instanceof multer.MulterError) {
            if (err.field !== fieldNames.image) {
                return next(failed(`field name not accepted, please change to ${fieldNames.image}`));
            } else if (err.field === fieldNames.image  && err.code === 'LIMIT_UNEXPECTED_FILE') {
                return next(failed(`Only one image allowed`));
            } else {
                console.log("error multerCloudImagesUploadMiddleWare", err);
                return next(failed(`something wrong happened when uploading image`));
            }
        } else if (err) {
            return next(failed(err));
        }
        if (req.file) {
            if (req.file.size >= allowedFileSizes.image) return next(failed(`this file is exceeded the limit (Max: 1MB)`));
            return next();
        } else {
            console.log("No file uploaded");
            return next();
        }
    };
};

// Middleware initialization
const multerCloudImageUploadMiddleWare = (req, res, next) => {
    try {
        const uploadCallback = handleFileUpload(req, res, next, fieldNames.image);
        tempImageUploader(req, res, uploadCallback);
    } catch (err) {
        next(failed(err));
    }
};

const multerCloudImagesUploadMiddleWare = (req, res, next) => {
    try {
        const upload = multer({
            storage: tempStorage,
            fileFilter: fileFilters.image
        }).array(fieldNames.image, maximumFileUploadCount.image); // Set the field name and maximum number of files to be uploaded (e.g., 5)

        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                if (err.field !== fieldNames.image) {
                    return next(failed(`field name not accepted, please change to ${fieldNames.image}`));
                } else if (err.field === fieldNames.image  && err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(failed(`file uploaded should not more than ${maximumFileUploadCount.image} images`));
                } else {
                    console.log("error multerCloudImagesUploadMiddleWare", err);
                    return next(failed(`something wrong happened when uploading image`));
                }

            } else if (err) {
                return next(failed(err));
            }

            if (req.files && req.files.length > 0) {
                const overSizeFileImages = req.files.filter(file => file.size >= allowedFileSizes.image)
                if (overSizeFileImages.length > 0) {
                    const fileNames = overSizeFileImages.map(file => file.originalname)
                    return next(failed(`these files are exceeded the limit (Max: 1MB) : [${fileNames}]`))
                }
                return next();
            } else {
                console.log("No files uploaded");
                return next();
            }
        });
    } catch (err) {
        next(failed(err));
    }
};

const multerDiskImageUploadMiddleWare = (req, res, next) => {
    try {
        const uploadCallback = handleFileUpload(req, res, next, fieldNames.image);
        diskImageUploader(req, res, uploadCallback);
    } catch (err) {
        next(failed(err));
    }
};

const multerCloudPDFUploadMiddleWare = (req, res, next) => {
    try {
        const uploadCallback = handleFileUpload(req, res, next, fieldNames.pdf);
        tempPDFUploader(req, res, uploadCallback);
    } catch (err) {
        next(failed(err));
    }
};

const multerDiskPDFUploadMiddleWare = (req, res, next) => {
    try {
        const uploadCallback = handleFileUpload(req, res, next, fieldNames.pdf);
        diskPDFUploader(req, res, uploadCallback);
    } catch (err) {
        next(failed(err));
    }
};

module.exports = {
    multerCloudImageUploadMiddleWare,
    multerCloudImagesUploadMiddleWare,
    multerDiskImageUploadMiddleWare,
    multerCloudPDFUploadMiddleWare,
    multerDiskPDFUploadMiddleWare,
    maximumFileUploadCount
};
