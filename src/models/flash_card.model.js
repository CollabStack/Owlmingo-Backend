const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const flashCardSchema = new mongoose.Schema({
    flash_card_id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    flash_card_title: {
        type: String,
        required: true
    },
    // NEW: Add globalId field for unique identification
    globalId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    source: {
        fileOcrId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FileOcr'
        },
        extractedTextSegment: String
    },
    cards: [{
        front: {
            type: String,
            required: true
        },
        frontImage: {
            type: String // Optional URL for front image
        },
        back: {
            type: String,
            required: true
        },
        backImage: {
            type: String // Optional URL for back image
        },
        category: String,
        difficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            default: 'Medium'
        },
        status: {
            type: String,
            enum: ['New', 'Learning', 'Review', 'Mastered'],
            default: 'New'
        },
        nextReviewDate: {
            type: Date,
            default: Date.now
        }
    }],
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

flashCardSchema.index({ flash_card_id: 1, created_by: 1 });
flashCardSchema.index({ globalId: 1 });
flashCardSchema.index({ created_by: 1, 'cards.status': 1 });

module.exports = mongoose.model('FlashCard', flashCardSchema);
