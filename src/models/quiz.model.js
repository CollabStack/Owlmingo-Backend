const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
});

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [optionSchema]
});

const quizSchema = new mongoose.Schema({
    quiz_id: { type: String, required: true, unique: true },
    quiz_title: { type: String, required: true },
    source: {
        fileOcrId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileOcr', required: true },
        extractedTextSegment: { type: String, required: true }
    },
    questions: [questionSchema],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
