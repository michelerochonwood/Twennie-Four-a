const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');

const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');

module.exports = (passport) => {
    // ✅ Local Authentication with bcrypt
    passport.use(new LocalStrategy(
        { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
        async (req, email, password, done) => {
            try {
                const normalizedEmail = email.toLowerCase();
                const { membershipType } = req.body;

                let user;

                if (membershipType === 'member') {
                    user = await Member.findOne({ email: normalizedEmail });
                } else if (membershipType === 'leader') {
                    user = await Leader.findOne({ groupLeaderEmail: normalizedEmail });
                } else if (membershipType === 'group_member') {
                    user = await GroupMember.findOne({ email: normalizedEmail });
                } else {
                    return done(null, false, { message: 'Invalid membership type.' });
                }

                if (!user) {
                    return done(null, false, { message: 'No user found with that email.' });
                }

                const passwordMatches = await bcrypt.compare(password, user.password);
                if (!passwordMatches) {
                    return done(null, false, { message: 'Incorrect email or password.' });
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    // ✅ Google Authentication (unchanged)
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await Member.findOne({ googleId: profile.id });

            if (!user) {
                user = new Member({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    avatar: profile.photos[0].value
                });
                await user.save();
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));

    // ✅ Serialize/Deserialize (unchanged)
passport.deserializeUser(async (id, done) => {
    try {
        const user =
            (await Member.findById(id).lean()) ||
            (await Leader.findById(id).lean()) ||
            (await GroupMember.findById(id).lean());

        if (!user) return done(null, false);

        done(null, user); // plain object now
    } catch (err) {
        done(err, false);
    }
});


    passport.deserializeUser(async (id, done) => {
        try {
            const user =
                (await Member.findById(id)) ||
                (await Leader.findById(id)) ||
                (await GroupMember.findById(id));

            done(null, user);
        } catch (err) {
            done(err, false);
        }
    });
};




