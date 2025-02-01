const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const FileTypes = {
    DOC: 'doc',
    DOCX: 'docx',
    PPTX: 'pptx',
    PDF: 'pdf',
    IMAGE: 'image',
    TEXT: 'text',
    OTHER: 'other'
};

const fileSchema = new mongoose.Schema({
    global_id:{
        type: String,
        unique: true,
        default: uuidv4
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    url: {
        type: String,
        required: false // Optional until cloud storage is implemented
    },
    data: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(FileTypes),
        default: FileTypes.IMAGE
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100
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
fileSchema.index({ user_id: 1, createdAt: -1 });
fileSchema.index({ type: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = {
    File,
    FileTypes
};
