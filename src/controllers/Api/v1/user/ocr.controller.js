const OcrService = require('../../../../services/user/ocr.service');
const { successResponse, errorResponse } = require('../../baseAPI.controller');

class OcrController {
    static async processImage(req, res) {
        try {
            if (!req.file) {
                return errorResponse(res, 'Please upload an image file', 400);
            }

            const metadata = {
                originalFileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            };

            const result = await OcrService.processImage(
                req.file.buffer,
                req.user._id, 
                metadata
            );
            
            return successResponse(res, 'Image processed successfully', result);
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
}

module.exports = OcrController;