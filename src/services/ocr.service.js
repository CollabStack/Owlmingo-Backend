const Tesseract = require('tesseract.js');
const { PDFExtract } = require('pdf.js-extract');
const officeparser = require('officeparser');
const { File, FileTypes } = require('../models/file.model');
const fs = require('fs').promises;
const path = require('path');

class OcrService {
    static async processFile(fileBuffer, userId, metadata, fileUrl) {
        try {
            let extractedText, confidence, fileType;
            const tempPath = `temp_${Date.now()}${path.extname(metadata.originalFileName)}`;
            
            await fs.writeFile(tempPath, fileBuffer);
            switch(metadata.mimeType) {
                case 'application/pdf':
                    const pdfExtract = new PDFExtract();
                    const data = await pdfExtract.extract(tempPath);
                    extractedText = data.pages
                        .map(page => page.content.map(item => item.str).join(' '))
                        .join('\n\n');
                    confidence = 100;
                    fileType = FileTypes.PDF;
                    break;

                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    extractedText = await officeparser.parseOfficeAsync(tempPath);
                    confidence = 100;
                    fileType = FileTypes.DOCX;
                    break;

                case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                    extractedText = await officeparser.parseOfficeAsync(tempPath);
                    confidence = 100;
                    fileType = FileTypes.PPTX;
                    break;

                default:
                    // Handle image processing
                    const result = await Tesseract.recognize(
                        fileBuffer,
                        'eng',
                        { logger: progress => console.log('Processing:', progress) }
                    );
                    extractedText = result.data.text;
                    confidence = result.data.confidence;
                    fileType = FileTypes.IMAGE;
            }

            // Cleanup temp file
            await fs.unlink(tempPath);

            const ocrRecord = await File.create({
                user_id: userId,
                data: extractedText,
                confidence,
                type: fileType,
                url: fileUrl,
                metadata
            });

            return ocrRecord;
        } catch (error) {
            throw new Error(`File processing failed: ${error.message}`);
        }
    }

    static async processText(text, userId, metadata) {
        try {
            const ocrRecord = await FileOcr.create({
                userId,
                extractedText: text,
                confidence: 100,
                fileType: FileTypes.TEXT,
                metadata
            });

            return {
                id: ocrRecord._id,
                text: ocrRecord.extractedText,
                confidence: 100,
                fileType: FileTypes.TEXT
            };
        } catch (error) {
            throw new Error(`Text processing failed: ${error.message}`);
        }
    }
}

module.exports = OcrService;