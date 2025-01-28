const AWS = require('aws-sdk');
const { doSpaceEndpoint, doSpaceAccessKey, doSpaceSecretKey } = require('../config/app.config');

const spaceEndpoint = new AWS.Endpoint(doSpaceEndpoint);
const s3 = new AWS.S3({
    endpoint: spaceEndpoint,
    accessKeyId: doSpaceAccessKey,
    secretAccessKey: doSpaceSecretKey
});

module.exports = {
    s3
};