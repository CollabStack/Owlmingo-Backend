const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz_id: { type: String, required: true, ref: 'Quiz' },
    question_index: { type: Number, required: true }, // Index of the question in the quiz
    selected_options: [{ type: String }],
    is_correct: { type: Boolean, required: true }
}, {
    timestamps: true
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
