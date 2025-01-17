require('dotenv').config();

module.exports = {
    appName: process.env.APP_NAME,
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    environment: process.env.NODE_ENV || 'development',
};