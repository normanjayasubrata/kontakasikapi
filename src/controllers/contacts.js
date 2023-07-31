const {validationResult} = require('express-validator');
const {success, failed} = require('../utils/responseBean');
const socketIOUtil = require('../utils/socketIOUtil');
const ContactService = require('../services/contact');
const ContactImageService = require('../services/contactImage');
const LogActivityService = require('../services/logActivity')
const LogEnum = require("../enum/logActivity");


const createContact = async (req, res, next) => {
    try {
        validationResult(req).throw();
        let contactImageList = null;
        const contactCreated = await ContactService.createContact(req.user, req.body)
        if (contactCreated && req.files && req.files.length > 0) {
            contactImageList = await ContactImageService.uploadMultipleContactImagesByContactId(contactCreated.contactId, req.files)
        }
        contactCreated.setDataValue('images', contactImageList)
        socketIOUtil.getIO().emit('contacts', {
            action: 'create',
            contactCreated
        });
        await LogActivityService.saveLog()
        return res.json(success({}, "new contact generated successfully"));
    } catch (err) {
        next(failed(err));
    }
};

const readContact = async (req, res, next) => {
    try {
        const contactFound = await ContactService.getContactByUserIdAndContactIdWithImageList(req.user, req.params.contactId);
        res.json(success(contactFound));
    } catch (err) {
        next(failed(err));
    }
};

const readContacts = async (req, res, next) => {
    try {
        let currentPage = parseInt(req.query.currentPage) || 1;
        let perPageLimit = parseInt(req.query.perPageLimit) || 5;
        const {
            contactList,
            totalPages,
            totalData
        } = await ContactService.getContactListByUserIdWithPaginationAndDefaultImage(req.user, currentPage, perPageLimit);
        res.json(success({contacts: contactList, totalPages, totalData, currentPage}));
    } catch (err) {
        next(failed(err));
    }
};

const updateContact = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const {contactId} = req.params;
        const {
            firstName,
            lastName,
            phone,
            email,
            gender,
            birthPlace,
            birthDate,
            province,
            city,
            district,
            village,
            postalCode,
            address
        } = req.body;
        const payload = {
            firstName,
            lastName,
            phone,
            email,
            gender,
            birthPlace,
            birthDate,
            province,
            city,
            district,
            village,
            postalCode,
            address
        };
        const updatedContact = await ContactService.updateContactByUserIdAndContactId(req.user, contactId, payload);
        res.json(success(updatedContact, "Contact successfully updated"));
    } catch (err) {
        next(failed(err));
    }
};

const deleteContact = async (req, res, next) => {
    try {
        await ContactService.deleteContactByUserIdAndContactIdWithImageList(req.user, req.params.contactId);
        res.json(success({}, 'contact deleted successfully'));
    } catch (err) {
        next(failed(err));
    }
};

const readContactImages = async (req, res, next) => {
    try {
        const {contactId} = req.params;
        const contact = await ContactService.getContactByUserIdAndContactId(req.user, contactId);
        const contactImages = contact ? await ContactImageService.getContactImageListByContactId(contactId) : null;
        if (!contact) {
            throw new Error(`Contact ID ${contactId} is not found`);
        }
        res.json(success(contactImages, ``));
    } catch (err) {
        next(failed(err));
    }
};

const createContactImage = async (req, res, next) => {
    try {
        const {contactId} = req.params;
        const contact = await ContactService.getContactByUserIdAndContactId(req.user, contactId);
        if (!contact) {
            throw new Error(`Contact ID ${contactId} is not found`);
        }

        if (req.file) {
            const updatedContactImageList = await ContactImageService.uploadContactImageByContactId(contactId, req.file);
            res.json(success(updatedContactImageList, `Image Updated`));
        } else {
            res.json(success({}, `No Image Uploaded`));
        }
    } catch (err) {
        next(failed(err));
    }
};

const deleteContactImage = async (req, res, next) => {
    try {
        const {contactId, contactImageId} = req.params;
        const contact = await ContactService.getContactByUserIdAndContactId(req.user, contactId);
        if (!contact) {
            throw new Error(`Contact ID ${contactId} is not found`);
        }
        const deletedResult = await ContactImageService.deleteContactImageByContactIdAndContactImageId(contactId, contactImageId)
        if (deletedResult) {
            const contactImageUpdated = await ContactImageService.getContactImageListByContactId(contactId)
            res.json(success(contactImageUpdated, `Image ${deletedResult.imageOriginalName} deleted successfully`));
        } else {
            throw new Error(`Failed to delete the image selected`)
        }
    } catch (err) {
        next(failed(err));
    }
};

const updateContactImages = async (req, res, next) => {
    try {
        const {contactId, contactImageId} = req.params;
        const contact = await ContactService.getContactByUserIdAndContactId(req.user, contactId);
        if (!contact) {
            throw new Error(`Contact ID ${contactId} is not found`);
        }
        const imageToUpdate = await ContactImageService.getContactImageByContactIdAndImageId(contactId, contactImageId);
        if (!imageToUpdate) {
            throw new Error(`No image with ID ${contactImageId} for contact ID ${contactId} found`);
        }
        if (imageToUpdate.isDefaultImage) {
            throw new Error(`Image with ID ${imageToUpdate.imageId} already default image`);
        }
        const currentDefaultContactImage = await ContactImageService.getDefaultContactImageByContactId(contactId, false);
        await ContactImageService.updateContactImageByContactIdAndContactImageId(
            currentDefaultContactImage.contactId,
            currentDefaultContactImage.imageId,
            {isDefaultImage: false}
        );
        const contactImageUpdated = await ContactImageService.updateContactImageByContactIdAndContactImageId(
            imageToUpdate.contactId,
            imageToUpdate.imageId,
            {isDefaultImage: true}
        );
        res.json(success(contactImageUpdated, `contact images updated successfully`));
    } catch (err) {
        next(failed(err));
    }
};

module.exports = {
    createContact,
    readContacts,
    readContact,
    updateContact,
    deleteContact,
    readContactImages,
    createContactImage,
    updateContactImages,
    deleteContactImage

};

