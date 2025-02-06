const { successResponse, errorResponse } = require('../../baseAPI.controller');
const { doSpaceBucket } = require('../../../../config/app.config');
const { uploadFile } = require('../../../../services/upload_file.service'); // Import the function

const uploadFileHandler = async (req, res) => {
    try {
        const file = req.file;
        const user_global_id = req.params.id;

        if (!file) {
            return errorResponse(res, 'No file uploaded', 400);
        }
        
        const fileBuffer = file.buffer;
        const fileName = `owlmingo/${user_global_id}/${Date.now()}-${file.originalname}`;
        const bucketName = doSpaceBucket;

        // Call the uploadFile function directly
        const data = await uploadFile(fileBuffer, fileName, bucketName, user_global_id);

        successResponse(res, data, 'File uploaded successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
};

module.exports = {
    uploadFile: uploadFileHandler, // Export the handler function
};