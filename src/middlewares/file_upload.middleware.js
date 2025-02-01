const multer = require('multer');

// Allowed file types
const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

// Memory storage configuration
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file), false);
    }
};

// Multer upload middleware configuration
const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 150 * 1024 * 1024, // 150MB max file size
    },
    fileFilter
}).single('file'); // Adjust field name as necessary

module.exports = {
    uploadMiddleware
};