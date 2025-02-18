const mongoose = require('mongoose');   
const { v4: uuidv4 } = require('uuid'); 

const summarySchema = new mongoose.Schema({
    globalId: {
        type: String,
        default: uuidv4,
        unique: true
    },

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    title: {
        type: String,
        required: true
    },

    content: {
        type: String,
        required: true
    },

    original_text: {
        type: String,
        required:true
    },

    file_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: false
    },

    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Summary', summarySchema);