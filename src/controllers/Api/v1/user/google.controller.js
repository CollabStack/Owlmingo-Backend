const passport = require('../../../../config/passport.config');
const User = require('../../../../models/user.model');
const { redirectURL } = require('../../../../config/app.config');
const {successResponse, errorResponse} = require('../../baseAPI.controller');
const jwtUtil = require('../../../../utils/jwt.util');
// Google login function
const googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

// Google callback function
const googleCallback = (req, res, next) => {
  passport.authenticate('google', async (err, user) => {
    if (err) {
      return next(err); // Handle any Passport-specific errors
    }
    if (!user) {
      successResponse(res, "User not found", 401);
    }
    try {
      // Check if the user already exists in the database by Google ID or email
      let existingUser = await User.findOne({ $or: [{ google_id: user.id }, { email: user.emails[0].value }] });

      if (existingUser === null) {
        // Create a new user if not found
        existingUser = new User({
          google_id: user.id,
          username: user.displayName,
          email: user.emails[0].value, // Use the first email from Google
          isVerified: true,
        });
        await existingUser.save();

      }
      if (existingUser.google_id === null) {
        existingUser.google_id = user.id;
        await existingUser.save();
      }
      const token = jwtUtil.generateToken({ global_id: existingUser.global_id, role: existingUser.role });
      return res.redirect(`${redirectURL}#token=${token}`);
    } catch (error) {
      return next(error); // Pass the error to the error-handling middleware
    }
  })(req, res, next); // Invoke Passport's authenticate function
};

// Successful authentication handler
const googleSuccess = (req, res) => {
  res.redirect(redirectURL);
};

module.exports = {
  googleLogin,
  googleCallback,
  googleSuccess,
};