const Tesseract = require('tesseract.js');
const { PDFExtract } = require('pdf.js-extract');
const { FileOcr, FileTypes } = require('../../models/user/file_ocr.model');

class OcrService {
    static async processFile(fileBuffer, userId, metadata) {
        try {
            let extractedText, confidence, fileType;

            if (metadata.mimeType === 'application/pdf') {
                const pdfExtract = new PDFExtract();
                const tempPath = `temp_${Date.now()}.pdf`;
                require('fs').writeFileSync(tempPath, fileBuffer);
                
                const data = await pdfExtract.extract(tempPath);
                extractedText = data.pages
                    .map(page => page.content.map(item => item.str).join(' '))
                    .join('\n\n');
                confidence = 100; // PDF extraction usually has high confidence
                fileType = FileTypes.PDF;
                
                require('fs').unlinkSync(tempPath);
            } else {
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

            const ocrRecord = await FileOcr.create({
                userId,
                extractedText,
                confidence,
                fileType,
                metadata
            });

            return {
                id: ocrRecord._id,
                text: extractedText,
                confidence,
                fileType
            };
        } catch (error) {
            throw new Error(`File processing failed: ${error.message}`);
        }
    }
}

module.exports = OcrService;