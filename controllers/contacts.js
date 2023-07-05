const {validationResult} = require('express-validator');
const {success, failed} = require('../utils/responseBean');
const {Contact, ContactImage, UserActivityLog, User} = require('../models');
const {emptyPropertyRemover} = require('../utils/objectFormatter')
const {getPhoneNumber} = require("../utils/phoneNumberUtil");
const socketIOUtil = require('../utils/socketIOUtil')
const {uploadImagesToUCareCDN, uploadImageToUCareCDN, deleteImageFromUCareCDN} = require('../utils/uploadCareHandlerUtil')
const {maximumFileUploadCount} = require('../utils/uploadHandlerUtil')
const LogActivity = require("../enum/logActivity");
const { Op, fn, literal, Sequelize} = require('sequelize');

const createContact = async (req, res, next) => {
    try {
        validationResult(req).throw();
        req.body.userId = req.user;
        const contactCreated = await Contact.scope('simplifiedScope').create(emptyPropertyRemover(req.body));
        if (req.files && req.files.length > 0) {
            const uploadResults = await uploadImagesToUCareCDN(req.files)
            for (let i = 0; i < uploadResults.length; i++) {
                if (uploadResults[i].isStored) {
                    await ContactImage.create({imageId: uploadResults[i].uuid, imageName: uploadResults[i].name, imageOriginalName: uploadResults[i].originalFilename, isDefaultImage: i === 0 ? true : false, cdnUrl: uploadResults[i].cdnUrl, contactId: contactCreated.contactId})
                } else {
                    console.error(`failed when uploading image : ${uploadResults[i]}`)
                }
                console.log(`testUploadCareImageUpload : ${uploadResults[i].message}`);
            }
        }
        await UserActivityLog.create({userId: contactCreated.userId, action: LogActivity.createContact, newData: contactCreated.dataValues})
        socketIOUtil.getIO().emit('contacts', {
            action: 'create',
            contactCreated
        })
        return res.json(success({}, "new contact generated successfully"));
    } catch (err) {
        next(failed(err));
    }
};

const readContact = async (req, res, next) => {
    try {
        const contact = await Contact.findOne({
            where: {user_id: req.user, contact_id: req.params.contactId},
            // include: [{
            //     model: ContactImage,
            //     as: 'contactImage',
            //     attributes: ['imageId', 'imageName', 'imageOriginalName', 'cdnUrl', 'isDefaultImage'],
            //     order: [['createdDate', 'ASC']],
            //     required: false,
            //     on: {
            //         '$"Contact"."contactId"$': { [Op.eq]: Sequelize.col('"contactImage".contact_id') },
            //     }
            // }]
        });
        if (!contact) {
            throw new Error('Contact not found')
        }
        const contactImages =  await ContactImage.findAll({where: {contactId: req.params.contactId}, order: [['created_date', 'ASC']]});
        contact.setDataValue('contactImages', contactImages)
        res.json(success(contact));
    } catch (err) {
        next(failed(err));
    }
};

const readContacts = async (req, res, next) => {
    try {
        let currentPage = parseInt(req.query.currentPage) || 1;
        let perPageLimit = parseInt(req.query.perPageLimit) || 5;
        let offset = (currentPage - 1) * perPageLimit; // Offset for pagination

        if (perPageLimit === -1) {
            perPageLimit = null
            offset = 0
        }

        const contacts = await Contact.scope('simplifiedScope').findAndCountAll({
            where: { userId: req.user },
            limit: perPageLimit,
            offset,
            include: [{
                model: ContactImage,
                as: 'contactImage',
                attributes: [
                    [fn('COALESCE', literal('"contactImage"."image_name"'), ''), 'imageName'],
                    [fn('COALESCE', literal('"contactImage"."image_original_name"'), ''), 'imageOriginalName'],
                    'cdnUrl'
                ],
                where: { isDefaultImage: true },
                required: false,
                on: {
                    '$"Contact"."contact_id"$': { [Op.eq]: Sequelize.col('"contactImage".contact_id') },
                }
            }],
            subQuery: false,
            order: [['created_date', 'DESC']]
        });

        const totalContacts = contacts.count
        let totalPages = perPageLimit === null ? 1 : Math.ceil(totalContacts / perPageLimit);

        if (totalContacts === 0) {
            totalPages = 0;
            currentPage = 0
        }

        if (currentPage > totalPages) {
            throw new Error('Selected pages exceeds the total pages')
        }



        res.json(success({ contacts: contacts.rows, totalPages, totalContacts, currentPage }));
    } catch (err) {
        next(failed(err));
    }
};

const updateContact = async (req, res, next) => {
   try {
       validationResult(req).throw();
       const {contactId} = req.params

       //get current contact selected
       const currentContactSelected = await Contact.findOne({where: {contactId: contactId, userId: req.user}})

       //get contact email address in current user
       const emailExist = await Contact.findOne({where: {email: req.body.email, user_id: req.user}});


       // error if email exists within the contact list (excluding contactId selected)
       if (emailExist && emailExist.contactId !== contactId) {
           throw new Error(`(update) Contact with the email ${req.body.email} already exists, belongs to contact with ID ${emailExist.contactId} and name ${emailExist.firstName}`);
       }

       // phone check
       const phoneExist = await Contact.findAll({where: {user_id: req.user}}).then( results => {
           return results.filter(result => result.phone === getPhoneNumber(req.body.phone))
       })

       // error if phone number within the contact list exists (excluding contactId selected)
       if (phoneExist.length > 0 && phoneExist[0].contactId != contactId) {
           throw new Error(`Contact with phone number ${req.body.phone} already exists, belongs to contact with email ${phoneExist[0].email}`);
       }

       // deleting phone field if there is no change in the user contact number
       if (phoneExist[0] && phoneExist[0].phone === req.body.phone) {
           delete req.body.phone
       }

       // updating contact
       const [rowsUpdated, [updateContact]] = await Contact.update(
           emptyPropertyRemover(req.body),
           {
               where: { userId: req.user, contactId: req.params.contactId },
               returning: true,
           }
       );
       if (rowsUpdated === 0) {
           throw new Error(`No contact with id ${req.body.contactId} found in contact list of user ${req.user}`);
       } else {
           const updatedContactFound = await Contact.findOne({where: {contactId: updateContact.contactId}})
           const contactImages =  await ContactImage.findAll({where: {contactId: updateContact.contactId}, order: [['created_date', 'ASC']]});
           updatedContactFound.setDataValue('contactImages', contactImages)
           await UserActivityLog.create({userId: req.user, action: LogActivity.updateContact, oldData: currentContactSelected.dataValues, newData: updatedContactFound.dataValues })
           res.json(success(updatedContactFound, "Contact successfully updated"))
       }

   } catch (err) {
       next(failed(err))
   }
}

const deleteContact = async (req, res, next) => {
    try {

        const contact = await Contact.scope('allContactScope').findOne({where: {userId: req.user, contactId: req.params.contactId}})
        if (!contact) {
            const error = new Error("Contact not found");
            throw error;
        }
        const SelectedContactImages = await ContactImage.scope('allContactImageScope').findAll({where: {contactId: req.params.contactId}})
        if (SelectedContactImages && SelectedContactImages.length > 0) {
            for (let i = 0; i < SelectedContactImages.length; i++) {
                await deleteImageFromUCareCDN(SelectedContactImages[i].imageId)
            }
        }
        await ContactImage.destroy({where: {contactId: req.params.contactId}})
        await contact.destroy()
        await UserActivityLog.create({userId: req.user, action: LogActivity.deleteContact, oldData: contact.dataValues})
        res.json(success({}, 'contact deleted successfully'))

    } catch (err) {
        next(failed(err));
    }
}

const readContactImages = async (req, res, next) => {
    try {
        const {contactId} = req.params
        const contact = await Contact.findOne({where: {contactId: contactId, userId: req.user}, order: [['created_date', 'ASC']]})
        const contactImages = contact ? await ContactImage.findAll({where: {contactId: contactId}, order: [['created_date', 'ASC']]}) : null;
        if (!contact) throw new Error(`Contact ID ${contactId} is not found`);
        res.json(success(contactImages, ``))
    } catch (err) {
        next(failed(err));
    }
}

const createContactImage = async (req, res, next) => {
    try {
        const {contactId} = req.params
        const contact = await Contact.findOne({where: {contactId: contactId, userId: req.user}})
        const contactImages = contact ? await ContactImage.findAll({where: {contactId: contactId}}) : null;
        if (!contact) throw new Error(`Contact ID ${contactId} is not found`);
        if (contactImages.length >= maximumFileUploadCount.image) throw new Error(`Contact IDs ${contactId} exceeds maximum file upload count (Max: ${maximumFileUploadCount.image})`);
        if (req.file) {
            console.log(`Uploading contact image for contact ID ${contactId}`);
            const uploadResult = await uploadImageToUCareCDN(req.file)
            const isNewImageDefault = contactImages.length === 0 ? true : false;
            if (uploadResult.isStored) {
               const newContactImage = await ContactImage.create({imageId: uploadResult.uuid, imageName: uploadResult.name, imageOriginalName: uploadResult.originalFilename, isDefaultImage: isNewImageDefault, cdnUrl: uploadResult.cdnUrl, contactId: contactId})
                const contactImageUpdated = await ContactImage.findAll({where: {contactId: contactId}, order: [['created_date', 'ASC']]})
                await UserActivityLog.create({userId: req.user, action: LogActivity.addContactImage, newData: newContactImage.dataValues, description: 'TABLE contact_image' })
                res.json(success(contactImageUpdated, `Image Updated`))
            } else {
                throw new Error(`failed when uploading image : ${uploadResult}`)
            }
        } else {
            res.json(success(contactImages, `No Image Uploaded`))
        }
    } catch (err) {
        next(failed(err));
    }
}

const deleteContactImage = async (req, res, next) => {
    try {
        const {contactId, contactImageId} = req.params
        const contact = await Contact.findOne({where: {contactId: contactId, userId: req.user}})
        if (!contact) throw new Error(`Contact ID ${contactId} is not found`);
        const deletedContactImage = await ContactImage.scope('allContactImageScope').findOne({where: {contactId: contactId, imageId: contactImageId}});
        if (!deletedContactImage) throw new Error(`No image with ID ${contactImageId} for contact ID ${contactId} found`);
        const otherContactImages = await ContactImage.scope('allContactImageScope').findAll({where: {contactId: contactId, imageId: {[Op.not]: contactImageId}}})
        if (deletedContactImage.isDefaultImage && otherContactImages.length > 1) {
            await ContactImage.update({isDefaultImage: true}, {where: {contactId: contactId, imageId: otherContactImages[0].imageId}})
        }
        const deleteResult = await deleteImageFromUCareCDN(deletedContactImage.imageId)
        deleteResult && await deletedContactImage.destroy();
        deleteResult && await UserActivityLog.create({userId: req.user, action: LogActivity.deleteContactImage, oldData: deletedContactImage.dataValues, description: 'TABLE contact_image' })
        const contactImageUpdated = await ContactImage.findAll({where: {contactId: contactId}, order: [['created_date', 'ASC']]})
        res.json(success(contactImageUpdated, `Image ${deletedContactImage.imageName} deleted successfully`))
    } catch (err) {
        next(failed(err))
    }
}

const updateContactImages = async (req, res, next) => {
    try {
        const {contactId, contactImageId} = req.params
        const contact = await Contact.findOne({where: {contactId: contactId, userId: req.user}})
        if (!contact) throw new Error(`Contact ID ${contactId} is not found`);
        const selectedDefaultImage = await ContactImage.findOne({where: {contactId: contactId, imageId: contactImageId}});
        if (!selectedDefaultImage) throw new Error(`No image with ID ${contactImageId} for contact ID ${contactId} found`);
        if (selectedDefaultImage.isDefaultImage) throw new Error(`Image with ID ${selectedDefaultImage.imageId} already default image`)
        const currentDefaultImage = await ContactImage.findOne({where: {contactId: contactId, isDefaultImage: true}})
        const [rowsUpdated, [updateContactImage]] = await ContactImage.update({isDefaultImage: true}, {where: {contactId: contactId, imageId: contactImageId}, returning: true})
        await ContactImage.update({isDefaultImage: false}, {where: {contactId: contactId, imageId: currentDefaultImage.imageId}})
        const contactImageUpdated = await ContactImage.findAll({where: {contactId: contactId}, order: [['created_date', 'ASC']]})
        await UserActivityLog.create({userId: req.user, action: LogActivity.updateContactImage, oldData: currentDefaultImage.dataValues, newData: updateContactImage.dataValues, description: 'TABLE contact_image' })
        res.json(success(contactImageUpdated, `contact images updated successfully`))
    } catch (err) {
        next(failed(err));
    }
}

module.exports = {
    createContact, readContacts, readContact, updateContact, deleteContact, readContactImages, createContactImage, updateContactImages, deleteContactImage

};

