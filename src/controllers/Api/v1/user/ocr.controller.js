const OcrService = require('../../../../services/user/ocr.service');
const { successResponse, errorResponse } = require('../../baseAPI.controller');

class OcrController {
    static async processFile(req, res) {
        try {
            if (!req.file) {
                return errorResponse(res, 'Please upload a file', 400);
            }

            const metadata = {
                originalFileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            };

            const result = await OcrService.processFile(
                req.file.buffer,
                req.user._id,
                metadata
            );
            
            return successResponse(res, 'File processed successfully', result);
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }

    static async processText(req, res) {
        try {
            if (!req.body.text) {
                return errorResponse(res, 'Please provide text', 400);
            }

            const metadata = {
                originalFileName: 'text_input.txt',
                fileSize: req.body.text.length,
                mimeType: 'text/plain'
            };

            const result = await OcrService.processText(
                req.body.text,
                req.user._id,
                metadata
            );
            
            return successResponse(res, 'Text processed successfully', result);
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
}

module.exports = OcrController;