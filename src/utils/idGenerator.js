const idGenerator = require('alphanumeric-id');
const userIdGenerator = () => {
    return generateId('U');
};

const contactIdGenerator = () => {
    return generateId('C');

};

const imageIdGenerator = () => {
    return generateId('I');
};

const deletedIdGenerator = () => {
    return generateId('D');
};

const generateId = (indicator) => {
    const y = new Date().getFullYear();
    const m = ("0" + (new Date().getMonth() + 1)).slice(-2);
    const d = ("0" + new Date().getDate()).slice(-2);
    const alphaNumY = y + idGenerator(4).toUpperCase();
    const alphaNumM = m + idGenerator(6).toUpperCase();
    const alphaNumD = d + idGenerator(6).toUpperCase();
    return indicator + alphaNumY + alphaNumM + alphaNumD;
};

module.exports = {
    userIdGenerator,
    contactIdGenerator,
    imageIdGenerator,
    deletedIdGenerator
};