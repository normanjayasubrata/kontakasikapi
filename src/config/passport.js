const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const UserService = require('../services/user')

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY,
};

passport.use(
    new JwtStrategy(opts, async (jwtPayload, done) => {
        try {
            const user = await UserService.getUserByUserId(jwtPayload.userId)
            if (user) {
                return done(null, jwtPayload.userId);
            } else {
                throw new Error("Cannot find user")
            }
        } catch (err) {
            return done(err, false);
        }
    })
);

module.exports = passport;
