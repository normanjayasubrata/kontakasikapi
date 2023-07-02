const stringCapitalize = (str) => {
    let result = '';
    let capitalizeNext = true;

    for (let i = 0; i < str.length; i++) {
        const char = str.charAt(i);

        if (char === ' ' || char === '\t') {
            if (result.slice(-1) !== ' ') {
                result += char;
                capitalizeNext = true;
            }
        } else if (capitalizeNext) {
            result += char.toUpperCase();
            capitalizeNext = false;
        } else {
            result += char.toLowerCase();
        }
    }

    return result.trim();
}

module.exports = {
    stringCapitalize
}