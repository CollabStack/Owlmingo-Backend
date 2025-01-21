require('dotenv').config();

module.exports = {
    appName: process.env.APP_NAME,
    port: process.env.APP_PORT,
    mongoUri: process.env.MONGO_URI,
    environment: process.env.NODE_ENV || 'development',
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubCallbackURL: process.env.GITHUB_CALLBACK_URL,
    redirectURL : process.env.REDIRECT_URL,
};