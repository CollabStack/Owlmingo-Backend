const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const flashCardSessionSchema = new mongoose.Schema({
    globalId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    category: String,
    cards: [{
        cardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FlashCard'
        },
        status: {
            type: String,
            enum: ['Unreviewed', 'Learning', 'Review', 'Mastered'],
            default: 'Unreviewed'
        },
        confidence: {
            type: String,
            enum: ['Again', 'Hard', 'Good', 'Easy'],
            default: null
        },
        nextReviewDate: Date,
        reviewHistory: [{
            date: Date,
            confidence: String,
            timeSpent: Number
        }]
    }],
    progress: {
        mastered: { type: Number, default: 0 },
        learning: { type: Number, default: 0 },
        toReview: { type: Number, default: 0 }
    },
    lastStudied: Date,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FlashCardSession', flashCardSessionSchema);
