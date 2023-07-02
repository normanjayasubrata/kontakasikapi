const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY,
};

passport.use(
    new JwtStrategy(opts, async (jwtPayload, done) => {
        try {
            const user = await User.findOne({ where: { userId: jwtPayload.userId } });
            if (!user) {
                throw new Error("User not found")
            } else {
                return done(null, jwtPayload.userId);
            }
            // if (user) {
            //     return done(null, jwtPayload.userId);
            // } else {
            //     return done(null, false);
            // }
        } catch (err) {
            return done(err, false);
        }
    })
);

module.exports = passport;
