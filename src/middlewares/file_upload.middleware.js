const multer = require('multer');

// Use memory storage (if uploading to external service like DigitalOcean Spaces)
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage }).single('file'); // Accept single file uploads


module.exports = {
    uploadMiddleware
};