const mongoose = require('mongoose');

const FileTypes = {
    DOC: 'doc',
    DOCX: 'docx',
    PPTX: 'pptx',
    PDF: 'pdf',
    IMAGE: 'image',
    TEXT: 'text',
    OTHER: 'other'
};

const fileOcrSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fileUrl: {
        type: String,
        required: false // Optional until cloud storage is implemented
    },
    extractedText: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: Object.values(FileTypes),
        default: FileTypes.IMAGE
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100
    },
    uploadTime: {
        type: Date,
        default: Date.now
    },
    metadata: {
        originalFileName: String,
        fileSize: Number,
        mimeType: String
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for common queries
fileOcrSchema.index({ userId: 1, uploadTime: -1 });
fileOcrSchema.index({ fileType: 1 });

const FileOcr = mongoose.model('FileOcr', fileOcrSchema);

module.exports = {
    FileOcr,
    FileTypes
};
