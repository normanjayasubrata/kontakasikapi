const success = (params, msg) => {
    return {
        success: true,
        message: msg,
        data: params
    };
};

const failed = (error) => {
    if (error.errors) {
        return {
            status: error.status,
            message: error.message,
            data: error.array ?  error.array({onlyFirstError: true}) : error.errors
        };
    } else {
        console.log("default error", error);
        return error;
    }
};

module.exports = {
    success,
    failed
};