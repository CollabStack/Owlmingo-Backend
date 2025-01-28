const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { doSpaceEndpoint, doSpaceAccessKey, doSpaceSecretKey } = require('../config/app.config');
const File = require('../models/file.model');
// src\models\file.model.js
console.log("File",File);
// Create an S3 client
const s3Client = new S3Client({
    endpoint: doSpaceEndpoint,
    region: 'us-east-1', // Replace with your region if needed
    credentials: {
        accessKeyId: doSpaceAccessKey,
        secretAccessKey: doSpaceSecretKey,
    },
});

// Function to upload a file
const uploadFile = async (fileBuffer, fileName, bucketName, user_global_id) => {
    const filePermissions = 'public-read';
    // const filePermissions = 'private';

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ACL: filePermissions,
        ContentType: fileBuffer.mimetype, // Ensure fileBuffer has a mimetype property
    };

    try {
        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);

        if (data.$metadata.httpStatusCode !== 200) {
            throw new Error('Failed to upload file');
        }

        // Insert a record in the database file table
        const url = `${doSpaceEndpoint}/${bucketName}/${fileName}`;
        const fileExtension = fileName.split('.').pop();
        const fileData = await File.create({ url, type: fileExtension, user_id: user_global_id }); // Use await here
        return fileData;
    } catch (error) {
        console.error("Error uploading file or saving to database:", error);
        throw error; // Re-throw the error to handle it in the controller
    }
};

module.exports = { uploadFile };