const OcrService = require('../../../../services/ocr.service');
const { successResponse, errorResponse } = require('../../baseAPI.controller');
const { uploadFile } = require('../../../../services/upload_file.service');
const YoutubeService = require('../../../../services/youtube.service');
const File = require('../../../../models/file.model');

class OcrController {
    static async processFile(req, res) {
        try {
            if (!req.file) {
                return errorResponse(res, 'Please upload a file', 400);
            }

            const file = req.file;
            const userId = req.user._id;
            const fileName = `owlmingo/${userId}/${Date.now()}-${file.originalname}`;
            
            const metadata = {
                originalFileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype
            };

            // Upload file first, then process OCR
            const fileUrl = await uploadFile(file.buffer, fileName);

            // Run OCR processing with fileUrl
            const ocrResult = await OcrService.processFile(file.buffer, userId, metadata, fileUrl);

            return successResponse(res, ocrResult, 'File uploaded & processed successfully');
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }

    static async processText(req, res) {
        try {
            if (!req.body.text) {
                return errorResponse(res, 'Please provide text', 400);
            }

            const metadata = {
                originalFileName: 'text_input.txt',
                fileSize: req.body.text.length,
                mimeType: 'text/plain'
            };

            const result = await OcrService.processText(
                req.body.text,
                req.user._id,
                metadata
            );
            
            return successResponse(res, result, 'Text processed successfully');
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }

    static async processYoutube(req, res) {
        try {
            const { url } = req.body;
            if (!url) {
                return errorResponse(res, 'YouTube URL is required', 400);
            }

            // Extract video ID from the URL
            const videoId = extractVideoId(url);
            if (!videoId) {
                return errorResponse(res, 'Invalid YouTube URL', 400);
            }

            // First check if video is accessible before attempting transcript
            try {
                const accessCheck = await YoutubeService.validateVideoAccessibility(videoId);
                if (!accessCheck.accessible) {
                    return errorResponse(res, `Video is not accessible: ${accessCheck.error}`, 400);
                }
                
                console.log(`Processing video: "${accessCheck.title}" by ${accessCheck.author}`);
                
                // After confirming video is accessible, try to get transcript
                const transcripts = await YoutubeService.getTranscript(videoId);
                
                if (!transcripts || transcripts.length === 0) {
                    return errorResponse(res, 'No subtitles found for this video', 404);
                }

                // Process transcripts with timestamps
                const processedText = transcripts
                    .map(item => `[${formatTime(item.offset)}] ${item.text}`)
                    .join('\n');

                // Create metadata
                const metadata = {
                    originalFileName: `youtube_${videoId}.txt`,
                    fileSize: Buffer.byteLength(processedText, 'utf8'),
                    mimeType: 'text/plain',
                    source: 'youtube',
                    videoId: videoId,
                    videoUrl: url,
                    videoTitle: accessCheck.title,
                    videoAuthor: accessCheck.author,
                    duration: transcripts[transcripts.length - 1]?.offset || 0
                };

                const result = await OcrService.processText(
                    processedText,
                    req.user._id,
                    metadata
                );

                return successResponse(res, {
                    ...result,
                    videoId,
                    videoUrl: url,
                    videoTitle: accessCheck.title
                }, 'YouTube transcripts processed successfully');

            } catch (transcriptError) {
                console.error('Error fetching transcripts:', transcriptError);
                
                // Environment-specific debugging info
                const environment = process.env.NODE_ENV || 'development';
                const isHeroku = process.env.DYNO ? true : false;
                console.log(`Current environment: ${environment}, Running on Heroku: ${isHeroku}`);
                
                // More specific error messages based on error type and environment
                if (transcriptError.message.includes('Transcript is disabled')) {
                    const message = isHeroku ? 
                        'This video does not have available transcripts. Some videos may work locally but not on Heroku due to regional restrictions.' : 
                        'This video does not have available transcripts. The creator may have disabled them.';
                    return errorResponse(res, message, 400);
                } else if (transcriptError.message.includes('private') || transcriptError.message.includes('restricted')) {
                    return errorResponse(res, 'Unable to access video transcripts. The video might be private or restricted.', 400);
                } else if (transcriptError.message.includes('Network') && isHeroku) {
                    return errorResponse(res, 'Network access to YouTube might be restricted on Heroku. Try a different video or contact support.', 400);
                } else {
                    return errorResponse(res, `Failed to fetch video transcripts: ${transcriptError.message}`, 400);
                }
            }
        } catch (error) {
            console.error('Error processing YouTube URL:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }
}

// Helper functions
function extractVideoId(url) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
    }
    return `${pad(minutes)}:${pad(seconds % 60)}`;
}

module.exports = OcrController;