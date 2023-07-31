const {getPhoneNumber} = require("./phoneNumberUtil")
module.exports = (input) => {
    if (getPhoneNumber(input.phoneOrEmail)) {
        input.phone = input.phoneOrEmail;
    } else if (input.phoneOrEmail.toLowerCase().match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )) {
        input.email = input.phoneOrEmail;
    } else {
        input.falseInput = true;
    }
    delete input.phoneOrEmail
   return input
};