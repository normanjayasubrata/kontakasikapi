const {failed, success} = require("../utils/responseBean");
const {validationResult} = require("express-validator");
const {deleteImagesFromGCS, getImageUrlFromGCS} = require("../utils/uploadGCHandlerUtil")
const {User, Contact, ContactImage} = require("../models")
const {Sequelize, Op, fn, literal} = require('sequelize');

const testGet = async (req, res, next) => {
    try {
        const contacts = await Contact.scope('simplifiedScope').findAndCountAll({
            where: { userId: req.body.userId },
            include: [{
                model: ContactImage,
                as: 'contactImage',
                attributes: [
                    [fn('COALESCE', literal('"contactImage"."image_name"'), ''), 'imageName'],
                    'imageUrl'
                ],
                where: { isDefaultImage: true },
                required: false,
                on: {
                    '$"Contact"."contact_id"$': { [Op.eq]: Sequelize.col('"contactImage".contact_id') },
                }
            }],
            offset: 0,
            limit: 5,
            subQuery: false,
            order: [['created_date', 'DESC']]
        });

        res.json(success(contacts, "success"));
    } catch (e) {
        next(failed(e))
    }
}


const testPost = async (req, res, next) => {
   try {
       validationResult(req).throw();
       return res.json(success(req.body, "test post success"));
   } catch (err) {
       next(failed(err));
   }
};

const testPut = async (req, res, next) => {
    try {
        validationResult(req).throw();
        const coba = (await User.findOne({where: {user_id: req.user}})).getDataValue()
        console.log(coba);
        return res.json(success(req.body, "test put success"));
    } catch (err) {
        next(failed(err));
    }
}

module.exports = {
    testPost, testPut, testGet
}