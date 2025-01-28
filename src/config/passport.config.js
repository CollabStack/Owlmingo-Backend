const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { clientID, clientSecret, githubCallbackURL} = require('../config/app.config');
// Configure Passport.js
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new GitHubStrategy(
    {
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: githubCallbackURL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Handle user profile from GitHub
      return done(null, profile);
    }
  )
);

module.exports = passport;
