const path = require('path');
const { Storage } = require('@google-cloud/storage');

//credentials initialization
// const gCStorageCredentials = path.join(__dirname, '..', 'credentials', 'kontakasik-ec701caeec92.json')

//storage and bucket initialization
const storage = new Storage({
    projectId: process.env.GC_STORAGE_PROJECT_ID,
    // keyFilename: gCStorageCredentials,
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
});
const bucketName = process.env.GC_STORAGE_BUCKET_NAME;
const imageFolderName = 'images'

//uploader to google storage
const uploadImagesToGCS = async (file, reqFileName) => {
    try {
        const bucket = storage.bucket(bucketName);
        const fileName = reqFileName || Date.now() + '-' + file.originalname;
        const destination = `${imageFolderName}/${fileName}`
        const fileUpload = bucket.file(destination);
        file.filename = fileName
        await new Promise((resolve, reject) => {
            const blobStream = fileUpload.createWriteStream({
                resumable: false,
                public: true,
                gzip: true,
            });

            blobStream.on('error', (error) => {
                // console.error(error);
                reject(error);
            });

            blobStream.on('finish', () => {
                resolve();
            });

            blobStream.end(file.buffer);
        });

        console.log(`File ${fileName} uploaded to GCS bucket ${bucketName}`);
    } catch (err) {
        throw new Error(err);
    }
};


// deleter to google storage
const deleteImagesFromGCS = (fileName) => {
    const bucket = storage.bucket(bucketName);
    const destination = `${imageFolderName}/${fileName}`
    const file = bucket.file(destination);

    return new Promise((resolve, reject) => {
        file.delete((err) => {
            if (err) {
                reject(err);
            } else {
                console.log(`Image file ${destination} deleted from GCS`);
                resolve();
            }
        });
    });
};

// getter to google storage
const getImageUrlFromGCS = (fileName) => {
    return `https://storage.googleapis.com/${bucketName}/${imageFolderName}/${fileName}`;
};




module.exports = {
    uploadImagesToGCS,
    deleteImagesFromGCS,
    getImageUrlFromGCS
};
