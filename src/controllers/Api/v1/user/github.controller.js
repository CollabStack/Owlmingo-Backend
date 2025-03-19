const passport = require('../../../../config/passport.config');
const User = require('../../../../models/user.model');
const {redirectURL} = require('../../../../config/app.config');
const {jwt} = require('../../../../utils/jwt.util');
// GitHub login function
const {generateToken}  = passport.authenticate('github', { scope: ['user:email'] });

// GitHub callback function
// const githubCallback = passport.authenticate('github', { failureRedirect: 'http://localhost:3001' });
const githubCallback = (req, res, next) => {
    passport.authenticate('github', async (err, user, info) => {
        if (err) {
            return next(err); // Handle any Passport-specific errors
        }

        if (!user) {
            return res.status(401).send('Authentication failed: User not found');
        }
        try {
            // Check if the user already exists in the database
            let existingUser = await User.findOne({ github_id: user.id });
            if (!existingUser) {
                // Create a new user if not found
                console.log("================ User =================");
                console.log("user", user);
                existingUser = new User({
                    github_id: user.id,
                    username: user.username,
                    email: user.emails[0].value, // Use the first email from GitHub
                });
                await existingUser.save();
            }
            // Log the user in
            // req.logIn(existingUser, (err) => {
            //     if (err) {
            //         return next(err); // Handle login errors
            //     }
            //     return res.redirect(redirectURL); // Redirect to success URL
            // });
            const token = generateToken(existingUser);
            console.log("========= token =========");
            console.log("token", token);
            return res.redirect(redirectURL + `#token=${token}`);
        } catch (error) {
            return next(error); // Pass the error to the error-handling middleware
        }
    })(req, res, next); // Invoke Passport's authenticate function
};
// const githubCallback = (req, res, next) => {
//     passport.authenticate('github', async (err, user, info) => {
//         if (err) {
//             return next(err); // Handle any Passport-specific errors
//         }

//         if (!user) {
//             return res.status(401).send('Authentication failed: User not found');
//         }
//         try {
//             // Check if user already exists by either GitHub ID or email
//             let existingUser = await User.findOne({
//                 $or: [
//                     { githubId: user.id },
//                     { email: user.emails[0].value }
//                 ]
//             });

//             if (!existingUser) {
//                 console.log("================ User =================");
//                 console.log("user", user);
                
//                 existingUser = new User({
//                     githubId: user.id,  // Use correct field name
//                     username: user.username,
//                     email: user.emails[0].value, // Use the first email from GitHub
//                 });
//                 await existingUser.save();
//             } else {
//                 // If user exists but doesn't have a GitHub ID, update it
//                 if (!existingUser.githubId) {
//                     existingUser.githubId = user.id;
//                     await existingUser.save();
//                 }
//             }

//             const token = generateToken(existingUser);
//             console.log("========= token =========");
//             console.log("token", token);
//             return res.redirect(redirectURL + `#token=${token}`);
//         } catch (error) {
//             return next(error); // Pass the error to the error-handling middleware
//         }
//     })(req, res, next); // Invoke Passport's authenticate function
// };

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