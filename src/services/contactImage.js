const ContactImage = require('../models').ContactImage;
const {maximumFileUploadCount} = require('../utils/uploadHandlerUtil');
const {uploadImageToUCareCDN, deleteImageFromUCareCDN, uploadImagesToUCareCDN} = require("../utils/uploadCareHandlerUtil");
const {Op} = require("sequelize");

exports.createContactImage = async (payload) => {
    if (!payload) {
        throw new Error("please input the requirements");
    }
    return await ContactImage.create(payload);
};

exports.getContactImageListByContactId = async (contactId) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    return await ContactImage.findAll({where: {contactId: contactId}, order: [['created_date', 'ASC']]});
};

exports.getOtherContactImagesByContactIdAndExceptionImageId = async (contactId, exceptContactImageId) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    if (!exceptContactImageId) {
        throw new Error("please input exceptContactImageId");
    }
    return await ContactImage.scope('allContactImageScope').findAll({
        where: {
            contactId: contactId,
            imageId: {[Op.not]: exceptContactImageId}
        }
    });
};

exports.getDefaultContactImageByContactId = async (contactId, simplified = true) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    const scopes = simplified ? 'simplifiedContactImageScope' : 'allContactImageScope'
    return await ContactImage.scope(scopes).findOne({
        where: {
            contactId: contactId,
            isDefaultImage: true
        }
    });
};

exports.getContactImageByContactIdAndImageId = async (contactId, contactImageId) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    if (!contactImageId) {
        throw new Error("please input contactImageId");
    }
    return await ContactImage.scope("allContactImageScope").findOne({where: {contactId, imageId: contactImageId}});
};

exports.updateContactImageByContactIdAndContactImageId = async (contactId, contactImageId, payload) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    if (!contactImageId) {
        throw new Error("please input contactId");
    }
    if (typeof payload !== "object") {
        throw new Error("payload must be an object");
    }
    if (!payload) {
        throw new Error("please input the contact image requirements");
    }
    const [rowsUpdated, [updatedContactImage]] = await ContactImage.update(
        payload,
        {
            where: {contactId, imageId: contactImageId},
            returning: true
        }
    );
    if (rowsUpdated === 0) {
        throw new Error(`No Contact Image with id ${contactImageId} and contact id ${contactId} found`);
    } else {
        return await this.getContactImageListByContactId(updatedContactImage.contactId);
    }

};

exports.deleteContactImageListAndCDNByContactId = async (contactId) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    const selectedContactImageList = await this.getContactImageListByContactId(contactId);
    if (selectedContactImageList && selectedContactImageList.length > 0) {
        for (let i = 0; i < selectedContactImageList.length; i++) {
            await deleteImageFromUCareCDN(selectedContactImageList[i].imageId);
        }
    }
    return await ContactImage.destroy({where: {contactId: contactId}});
};

exports.deleteContactImageByContactIdAndContactImageId = async (contactId, contactImageId) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    if (!contactImageId) {
        throw new Error("please input contactImageId");
    }
    const imageToDelete = await ContactImage.scope("allContactImageScope").findOne({
        where: {
            contactId,
            imageId: contactImageId
        }
    });
    if (!imageToDelete) {
        throw new Error(`No image with ID ${contactImageId} for contact ID ${contactId} found`);
        return null;
    }
    const otherImages = await ContactImage.scope('allContactImageScope').findAll({
        where: {
            contactId: contactId,
            imageId: {[Op.not]: contactImageId}
        }
    });
    if (imageToDelete.isDefaultImage && otherImages.length > 0) {
        await ContactImage.update({isDefaultImage: true}, {
            where: {
                contactId: contactId,
                imageId: otherImages[0].imageId
            }
        });
    }
    const deleteResult = await deleteImageFromUCareCDN(imageToDelete.imageId);
    if (deleteResult) {
        await imageToDelete.destroy();
        console.log(`Image ${imageToDelete.imageId} deleted successfully`);
        const {imageId, imageOriginalName} = imageToDelete.dataValues;
        return {imageId, imageOriginalName};
    } else {
        console.log(`Image ${imageToDelete.imageId} failed to be deleted`);
        return null;
    }

};

exports.uploadContactImageByContactId = async (contactId, file) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    if (!file || !file.buffer) {
        throw new Error("please input a proper file");
    }

    const contactImageListFound = await ContactImage.findAll({where: {contactId}});
    if (contactImageListFound.length >= maximumFileUploadCount.image) {
        throw new Error(`Contact IDs ${contactId} exceeds maximum file upload count (Max: ${maximumFileUploadCount.image})`);
    }

    const uploadResult = await uploadImageToUCareCDN(file);
    const isThisFirstImage = contactImageListFound.length === 0;
    if (uploadResult.isStored) {
        const dataCreate = {
            imageId: uploadResult.uuid,
            imageName: uploadResult.name,
            imageOriginalName: uploadResult.originalFilename,
            isDefaultImage: isThisFirstImage,
            cdnUrl: uploadResult.cdnUrl,
            contactId: contactId
        };
        await this.createContactImage(dataCreate);
        return await this.getContactImageListByContactId(contactId);
    } else {
        console.error(`failed when uploading image : ${uploadResult}`);
        return null;
    }

};

exports.uploadMultipleContactImagesByContactId = async (contactId, files) => {
    if (!contactId) {
        throw new Error("please input contactId");
    }
    for (const file of files) {
        if (!file.buffer) {
            console.log(`error file upload group for ${file.imageOriginalName}`, file);
            throw new Error(`please input a proper file for ${file.imageOriginalName}`);

        }
    }
    const uploadResults = await uploadImagesToUCareCDN(files);
    for (let i = 0; i < uploadResults.length; i++) {
        if (uploadResults[i].isStored) {
            await this.createContactImage({
                imageId: uploadResults[i].uuid,
                imageName: uploadResults[i].name,
                imageOriginalName: uploadResults[i].originalFilename,
                isDefaultImage: i === 0 ? true : false,
                cdnUrl: uploadResults[i].cdnUrl,
                contactId: contactId
            });
        } else {
            console.error(`failed when uploading image : ${uploadResults[i]}`);
        }
        console.log(`testUploadCareImageUpload : ${uploadResults[i].message}`);
    }
    return await this.getContactImageListByContactId(contactId)

};