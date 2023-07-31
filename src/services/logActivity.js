const UserActivityLog = require('../models').UserActivityLog;

exports.saveLog = async (userId, action, newData, oldData) => {
    const savedLog = await UserActivityLog.create({userId, action, newData, oldData})
    return savedLog
};