module.exports = (value) => {
    value = value.replace(/\s/g,'')
    if (value.charAt(0) === '0') {
        return value.substring(1)
    } else if (value.startsWith('62')) {
        return value.substring(2)
    } else if (value.startsWith('+62')) {
        return value.substring(3)
    }

    return value
}