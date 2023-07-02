const jwt = require('jsonwebtoken');
const passport = require("../config/passport");
const {failed} = require("./responseBean");

const tokenGenerator = (userId, email) => {

    const payload = {
        userId,
        email
    };
    console.log("payload generated", payload);
    const token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: '1h'});
    return {token};
};

const tokenValidator = (req, res, next) => {
        passport.authenticate('jwt', (err, user, info) => {
            if (err) return next(failed(err));
            if (!user && info.name === 'TokenExpiredError') {
                return next(failed("token is expired, please login again"));
            }
            if (info) {
                console.log(info);
                return next(failed("You are not authorized"))
            }
            req.user = user;
            return next()
        })(req, res, next)
}

module.exports = {
    tokenGenerator,
    tokenValidator
};