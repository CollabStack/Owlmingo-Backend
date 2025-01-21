const passport = require('../../../../config/passport.config');
const User = require('../../../../models/user.model');
const {redirectURL} = require('../../../../config/app.config');
// GitHub login function
const githubLogin = passport.authenticate('github', { scope: ['user:email'] });

// GitHub callback function
// const githubCallback = passport.authenticate('github', { failureRedirect: 'http://localhost:3001' });
const githubCallback = (req, res, next) => {
    passport.authenticate('github', async (err, user, info) => {
        if (err) {
            return next(err); // Handle any Passport-specific errors
        }
        // if (!user) {
        //     return res.redirect('http://localhost:3001'); // Redirect if authentication fails
        // }
        if (!user) {
            return res.status(401).send('Authentication failed: User not found');
        }
        try {
            console.log("GitHub User:", user);

            // Check if the user already exists in the database
            let existingUser = await User.findOne({ githubId: user.id });
            if (!existingUser) {
                // Create a new user if not found
                existingUser = new User({
                    githubId: user.id,
                    username: user.username,
                    email: user.emails[0].value, // Use the first email from GitHub
                });
                await existingUser.save();
            }

            // Log the user in
            req.logIn(existingUser, (err) => {
                if (err) {
                    return next(err); // Handle login errors
                }
                return res.redirect(redirectURL); // Redirect to success URL
            });
        } catch (error) {
            console.error("Error in GitHub Callback:", error);
            return next(error); // Pass the error to the error-handling middleware
        }
    })(req, res, next); // Invoke Passport's authenticate function
};

// Successful authentication handler
const githubSuccess = (req, res) => {
  res.redirect(redirectURL);
};

module.exports = {
  githubLogin,
  githubCallback,
  githubSuccess,
};
