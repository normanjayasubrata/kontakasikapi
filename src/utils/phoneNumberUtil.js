const {phone} = require('phone');
const getPhoneNumber = value => {
    const {phoneNumber} = phone(value);
    return phoneNumber;
}

const getPhoneDetails = value => {
    return phone(value);
}

const getPhoneCountryCode = value => {
    const {countryCode} = phone(value);
    return countryCode.replace('+','')
}

const phoneLength = {
    min: 7,
    max: 13
}

module.exports = {
    getPhoneNumber,
    getPhoneDetails,
    getPhoneCountryCode,
    phoneLength
}