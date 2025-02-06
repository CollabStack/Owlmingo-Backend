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
        answeredCount: { type: Number, default: 0 },
        correctCount: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    },
    progress: {
        currentQuestionIndex: { type: Number, default: 0 },
        answers: [{
            questionIndex: Number,
            selectedOption: String,
            isCorrect: Boolean
        }]
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    timeSpent: { type: Number, default: 0 }, // seconds
    is_active: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Indexes
quizSessionSchema.index({ 'user._id': 1, startedAt: -1 });
quizSessionSchema.index({ 'source.fileOcrId': 1 });

// Update progress method
quizSessionSchema.methods.updateProgress = function(questionIndex, selectedOption, isCorrect) {
    this.progress.answers.push({ questionIndex, selectedOption, isCorrect });
    this.quiz.answeredCount++;
    if (isCorrect) this.quiz.correctCount++;
    this.progress.currentQuestionIndex = questionIndex + 1;
};

const QuizSession = mongoose.model('QuizSession', quizSessionSchema);

module.exports = QuizSession;
