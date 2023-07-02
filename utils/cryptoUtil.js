const CryptoJS = require('crypto-js');

const phoneEncryptor = (phoneNumber) => {
    if (phoneNumber) {
        return CryptoJS.AES.encrypt(phoneNumber, 'secret_key').toString();
    }
    return;
}

const phoneDecryptor = (phoneNumberChipper) => {
    if (phoneNumberChipper) {
        const bytes  = CryptoJS.AES.decrypt(phoneNumberChipper, 'secret_key');
        return bytes.toString(CryptoJS.enc.Utf8);
    }
    return;
}

module.exports = {
    phoneEncryptor,
    phoneDecryptor
}