const passport = require('../../../../config/passport.config');
const User = require('../../../../models/user.model');
const {redirectURL} = require('../../../../config/app.config');
const { generateToken } = require('../../../../utils/jwt.util');
// GitHub login function
const githubLogin = passport.authenticate('github', { scope: ['user:email'] });

// const githubCallback = (req, res, next) => {
//     passport.authenticate('github', async (err, user, info) => {
//         if (err) {
//             return next(err); // Handle any Passport-specific errors
//         }

//         if (!user) {
//             return res.status(401).send('Authentication failed: User not found');
//         }

//         try {
//             // Find user by GitHub ID or email
//             let existingUser = await User.findOne({
//                 $or: [{ github_id: user.id }, { email: user.emails[0].value }]
//             });

//             if (!existingUser) {
//                 // Create a new user if not found
//                 existingUser = new User({
//                     github_id: user.id,
//                     username: user.username,
//                     email: user.emails[0].value, // Use the first email from GitHub
//                 });
//                 await existingUser.save();
//             } else if (!existingUser.github_id) {
//                 // If user exists but doesn't have a GitHub ID, update it
//                 existingUser.github_id = user.id;
//                 await existingUser.save();
//             } 

//             // Generate JWT token
//             const token = generateToken(existingUser);
//             res.redirect(`${redirectURL}#token=${token}`);
//         } catch (error) {
//             return next(error); // Pass the error to the error-handling middleware
//         }
//     })(req, res, next); // Invoke Passport's authenticate function
// };

const githubCallback = (req, res, next) => {
    passport.authenticate('github', async (err, user, info) => {
        if (err) {
            return next(err); // Handle any Passport-specific errors
        }

        if (!user) {
            return res.status(401).send('Authentication failed: User not found');
        }

        try {
            console.log('========================= User from GitHub ==========================='); // Log the user object for debugging
            console.log(user);
            console.log('========================= User from GitHub ==========================='); // Log the user object for debugging

            // Check if the user has an email available
            const userEmail = user.emails && user.emails.length > 0 ? user.emails[0].value : null;

            if (!userEmail) {
                return res.status(400).send('GitHub account does not have an email associated');
            }

            // Find user by GitHub ID or email
            let existingUser = await User.findOne({
                $or: [{ github_id: user.id }, { email: userEmail }]
            });

            if (!existingUser) {
                // Create a new user if not found
                existingUser = new User({
                    github_id: user.id,
                    username: user.username,
                    email: userEmail, // Use the email fetched from GitHub
                });
                await existingUser.save();
            } else if (!existingUser.github_id) {
                // If user exists but doesn't have a GitHub ID, update it
                existingUser.github_id = user.id;
                await existingUser.save();
            } 

            // Generate JWT token
            const token = generateToken(existingUser);
            res.redirect(`${redirectURL}#token=${token}`);
        } catch (error) {
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
// https://owlmingo.space/auth#tgAuthResult=eyJpZCI6NTE3Nzk0OTM1LCJmaXJzdF9uYW1lIjoiVWNoIiwibGFzdF9uYW1lIjoiTWVuZ2x5IFx1ZDgzZFx1ZGU4MCIsInVzZXJuYW1lIjoiTWVuZ2x5VWNoIiwicGhvdG9fdXJsIjoiaHR0cHM6XC9cL3QubWVcL2lcL3VzZXJwaWNcLzMyMFwvU0J5WjI4dGZQQ0ZTbk5SRmJMVUwtS0ZHQTRhcENNMmlXRFlrSkNIQ2Vidy5qcGciLCJhdXRoX2RhdGUiOjE3NDIzNTc3NTUsImhhc2giOiIxYTE0M2ZlYjE2YjY1MzZiOTNjY2JhZDk2NDFkNTZjMGQ3OTM5Mjc5ODAwMjE0Njk5MTM4OThhOTVmMGI1MzE1In0