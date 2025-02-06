const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema({
    _id: { type: String, required: true, unique: true },
    user: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: String
    },
    source: {
        fileOcrId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileOcr', required: true },
        fileName: String,
        fileType: String
    },
    quiz: {
        totalQuestions: { type: Number, required: true },
        answeredQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    timeSpent: Number, // Total time spent in seconds
    is_active: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Indexes
quizSessionSchema.index({ 'user._id': 1, startedAt: -1 });
quizSessionSchema.index({ 'source.fileOcrId': 1 });

const QuizSession = mongoose.model('QuizSession', quizSessionSchema);

module.exports = QuizSession;
