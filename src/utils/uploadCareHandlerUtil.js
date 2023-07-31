const {uploadFile } = require('@uploadcare/upload-client')
const {deleteFile, UploadcareSimpleAuthSchema,} = require('@uploadcare/rest-client');

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
    publicKey: process.env.UPLOAD_CARE_PUBLIC_KEY,
    secretKey: process.env.UPLOAD_CARE_SECRET_KEY
});
const testUploadcareConnection = async () => {
    try {
        // Create a dummy file object for testing (replace with your actual file object)
        const dummyFile = {
            buffer: Buffer.from('dummy-file-data'),
            originalname: 'dummy-file.jpg',
        };

        // Test the connection by uploading a dummy file
        const uploadResult = await uploadImageToUCareCDN(dummyFile);
        return Promise.resolve('Uploadcare API connection successful. Upload Result:', uploadResult);
        // You can perform additional operations with the API here

        // Example: Delete the uploaded file
        // const deleteResult = await deleteImageFromUCareCDN(uploadResult.uuid);
        // console.log('Delete Result:', deleteResult);
    } catch (error) {
        return Promise.reject('Uploadcare API connection failed:', error);
    }
};
const uploadImageToUCareCDN = async (file) => {
    try {
        if (file) {
            const {buffer, originalname} = file
            const result = await uploadFile(buffer, {
                publicKey: process.env.UPLOAD_CARE_PUBLIC_KEY,
                store: 'auto',
                fileName: originalname,
                metadata: {
                    subsystem: 'uploader',
                    pet: 'cat'
                }
            })
            const {uuid, isStored, originalFilename, cdnUrl, name} = result
            isStored && console.log(`Image ${uuid} with original name ${originalFilename} uploaded`)
            return Promise.resolve({uuid, isStored, originalFilename, cdnUrl, name, message: 'file uploaded successfully'})
        } else {
            return Promise.resolve({message: "no file uploaded"})
        }
    } catch (err) {
        const {originalname} = file
        console.error(`Failed when uploading image ${originalname}`)
        return Promise.reject(err)
    }
}

const uploadImagesToUCareCDN = async (files) => {
    try {
        const results = [];
        console.log("Group upload");
        for (const file of files) {
            const result = await uploadImageToUCareCDN(file)
            results.push(result)
        }
        console.log("Success group upload");
        return Promise.resolve(results)
    } catch (err) {
        console.error("Failed group upload");
        return Promise.reject(err)
    }
}

const deleteImageFromUCareCDN = async (uuid) => {
    try {
        const result = await deleteFile(
            {uuid},
            { authSchema: uploadcareSimpleAuthSchema }
        );
        result && console.log(`Image ${uuid} deleted successfully from CDN`)
        return Promise.resolve(result)
    } catch (err) {
        console.error(`Failed when deleting ${uuid} image`)
        return Promise.reject(err)
    }
}

module.exports = {
    uploadImageToUCareCDN, uploadImagesToUCareCDN, deleteImageFromUCareCDN, testUploadcareConnection
}