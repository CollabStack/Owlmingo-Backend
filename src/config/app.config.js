require('dotenv').config();

module.exports = {
    appName         : process.env.APP_NAME,
    port            : process.env.APP_PORT,
    mongoUri        : process.env.MONGO_URI,
    environment     : process.env.NODE_ENV || 'development',
    doSpaceEndpoint : process.env.DO_SPACE_ENDPOINT,
    doSpaceAccessKey: process.env.DO_SPACE_ACCESS_KEY,
    doSpaceSecretKey: process.env.DO_SPACE_SECRET_KEY,
    doSpaceBucket   : process.env.DO_SPACE_BUCKET,
    doSpaceRegion   : process.env.DO_SPACE_REGION,
};