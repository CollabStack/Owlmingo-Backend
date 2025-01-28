const Tesseract = require('tesseract.js');
const { FileOcr, FileTypes } = require('../../models/user/file_ocr.model');

class OcrService {
    static async processImage(imageBuffer, userId, metadata) {
        try {
            const result = await Tesseract.recognize(
                imageBuffer,
                'eng',
                { logger: progress => console.log('Processing:', progress) }
            );

            // Save to database
            const ocrRecord = await FileOcr.create({
                userId: userId,
                extractedText: result.data.text,
                confidence: result.data.confidence,
                fileType: FileTypes.IMAGE,
                metadata: metadata
            });

            return {
                id: ocrRecord._id,
                text: result.data.text,
                confidence: result.data.confidence
            };
        } catch (error) {
            throw new Error(`OCR processing failed: ${error.message}`);
        }
    }
}

module.exports = OcrService;