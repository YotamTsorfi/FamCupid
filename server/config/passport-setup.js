const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const UserBL = require("../BL/userBL");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    function (accessToken, refreshToken, profile, cb) {
      UserBL.getUserByProviderId(profile.id)
        .then((currentUser) => {
          if (currentUser) {
            return cb(null, currentUser);
          } else {
            const newUser = {
              username: profile.displayName,
              provider: "google",
              providerId: profile.id,
              // add any other data you want to store
              photoUrl: profile.photos[0].value,
              //email: profile.emails ? profile.emails[0].value : null,
            };
            // Create a new user
            UserBL.createUser(newUser)
              .then((createdUser) => {
                return cb(null, createdUser);
              })
              .catch((err) => {
                return cb(err, null);
              });
          }
        })
        .catch((err) => {
          return cb(err, null);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  UserBL.getUserById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_REDIRECT_URI,
      profileFields: ["id", "displayName", "email", "picture.type(large)"],
    },
    function (accessToken, refreshToken, profile, cb) {
      UserBL.getUserByProviderId(profile.id)
        .then((currentUser) => {
          if (currentUser) {
            return cb(null, currentUser);
          } else {
            const newUser = {
              username: profile.displayName,
              provider: "facebook",
              providerId: profile.id,
              // add any other data you want to store
              photoUrl: profile.photos ? profile.photos[0].value : null,
              //email: profile.emails ? profile.emails[0].value : null,
            };
            // Create a new user
            UserBL.createUser(newUser)
              .then((createdUser) => {
                return cb(null, createdUser);
              })
              .catch((err) => {
                console.error("Error creating user:", err);
                return cb(err, null);
              });
          }
        })
        .catch((err) => {
          console.error("Error getting user by provider ID:", err);
          return cb(err, null);
        });
    }
  )
);
