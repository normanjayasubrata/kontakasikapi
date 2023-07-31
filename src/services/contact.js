const Contact = require('../models').Contact;
const {emptyPropertyRemover} = require('../utils/objectFormatter');
const ContactImageService = require('./contactImage');
const {getPhoneNumber} = require("../utils/phoneNumberUtil");

exports.createContact = async (userId, payload) => {
    if (!userId) {
        throw new Error("please input userId");
    }
    if (!payload) {
        throw new Error("please input the requirements");
    }

    const filteredPayload = emptyPropertyRemover(payload);
    filteredPayload.userId = userId;
   return await Contact.create(filteredPayload);

};

exports.getContactListByUserIdWithPaginationAndDefaultImage = async (userId, currentPage, perPageLimit) => {
    if (!userId) {
        throw new Error("please input userId");
    }
    if (!currentPage) {
        throw new Error("please input currentPage");
    }
    if (!perPageLimit) {
        throw new Error("please input perPageLimit");
    }
    let offset = (currentPage - 1) * perPageLimit; // Offset for pagination
    if (perPageLimit === -1) {
        perPageLimit = null;
        offset = 0;
    }
    const contactList = await Contact.scope('simplifiedScope').findAll({
        where: {userId},
        limit: perPageLimit,
        offset,
        order: [['created_date', 'DESC']]
    });
    for (const contact of contactList) {
        const defaultContactImage = await ContactImageService.getDefaultContactImageByContactId(contact.contactId);
        contact.setDataValue('image', defaultContactImage);
    }

    const totalContacts = contactList.length;
    let totalPages = perPageLimit === null ? 1 : Math.ceil(totalContacts / perPageLimit);

    if (totalContacts === 0) {
        totalPages = 0;
        currentPage = 0;
    }
    if (currentPage > totalPages) {
        throw new Error('Selected pages exceeds the total pages');
    }

    return {contactList: contactList, totalPages, totalData: totalContacts};
};

exports.getContactByUserIdAndContactId = async (userId, contactId) => {
    if (!userId) {
        throw new Error("please input userId");
    }
    if (!contactId) {
        throw new Error("please input contactId");
    }

    return await Contact.findOne({
        where: {userId, contactId},
        order: [['created_date', 'DESC']]
    });
};

exports.getContactByUserIdAndContactIdWithImageList = async (userId, contactId) => {
    const contactFound = await this.getContactByUserIdAndContactId(userId, contactId);
    if (!contactFound) {
        throw new Error(`Contact with id ${contactId} not found`);
    }
    const contactImageList = await ContactImageService.getContactImageListByContactId(contactFound.contactId);
    contactFound.setDataValue('contactImageList', contactImageList);
    return contactFound;
};

exports.updateContactByUserIdAndContactId = async (userId, contactId, payload) => {
    if (!userId) {
        throw new Error("please input userId");
    }
    if (!contactId) {
        throw new Error("please input contactId");
    }

    const filteredPayload = emptyPropertyRemover(payload);
    const contactToUpdate = await this.getContactByUserIdAndContactId(userId, contactId);

    if (!contactToUpdate) {
        throw new Error(`No contact with ID "${contactId}" found in the contact list of user with ID "${userId}"`);
    }

    if (filteredPayload.email !== contactToUpdate.email) {
        const emailExist = await Contact.findOne({where: {email: filteredPayload.email, userId}});
        if (emailExist && emailExist.contactId !== contactId) {
            throw new Error(`(update) Contact with the email ${filteredPayload.email} already exists, belongs to contact with ID ${emailExist.contactId} and name ${emailExist.firstName}`);
        }
    }

    if (filteredPayload.phone !== contactToUpdate.phone) {
        const phoneExist = await Contact.findAll({where: {userId}}).then(results => {
            return results.filter(result => result.phone === getPhoneNumber(filteredPayload.phone));
        });
        if (phoneExist.length > 0 && phoneExist[0].contactId !== contactId) {
            throw new Error(`Contact with phone number ${filteredPayload.phone} already exists, belongs to contact with email ${phoneExist[0].email}`);
        }
    } else {
        delete filteredPayload.phone;
    }

    const [rowsUpdated, [updateContact]] = await Contact.update(
        filteredPayload,
        {
            where: {userId, contactId},
            returning: true,
        }
    );
    if (rowsUpdated === 0) {
        throw new Error(`No contact with id ${contactId} found in contact list of user ${userId}`);
    } else {
        return await this.getContactByUserIdAndContactIdWithImageList(updateContact.userId, updateContact.contactId);
    }
};

exports.deleteContactByUserIdAndContactIdWithImageList = async (userId, contactId) => {
    const contactToDelete = await Contact.scope('allContactScope').findOne({
        where: {userId, contactId}
    });
    if (!contactToDelete) {
        throw new Error(`No contact with id ${contactId} found in contact list of user ${userId}`);
    }
    await ContactImageService.deleteContactImageListAndCDNByContactId(contactId)
    return await contactToDelete.destroy();
}

// contactImage

