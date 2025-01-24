require('dotenv').config();

module.exports = {
    appName: process.env.APP_NAME,
    port: process.env.APP_PORT,
    mongoUri: process.env.MONGO_URI,
    environment: process.env.NODE_ENV || 'development',
    email_sender: process.env.EMAIL_SENDER,
    email_user: process.env.EMAIL_USER,
    email_pass: process.env.EMAIL_PASS,
};