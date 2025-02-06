const OcrService = require('../../../../services/ocr.service');
const { successResponse, errorResponse } = require('../../baseAPI.controller');
const {uploadFile} = require('../../../../services/upload_file.service');
const File = require('../../../../models/file.model');
class OcrController {
    static async processFile(req, res) {
        try {
            if (!req.file) {
                return errorResponse(res, 'Please upload a file', 400);
            }

            const file = req.file;
            const userId = req.user._id;
            const fileName = `owlmingo/${userId}/${Date.now()}-${file.originalname}`;
            
            const metadata = {
                originalFileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype
            };

            // Upload file first, then process OCR
            const fileUrl = await uploadFile(file.buffer, fileName);

            // Run OCR processing with fileUrl
            const ocrResult = await OcrService.processFile(file.buffer, userId, metadata, fileUrl);

            return successResponse(res, ocrResult, 'File uploaded & processed successfully');
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
            
            return successResponse(res, result, 'Text processed successfully');
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
}

module.exports = OcrController;