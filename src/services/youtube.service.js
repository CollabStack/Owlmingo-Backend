const { YoutubeTranscript } = require('youtube-transcript');

class YoutubeService {
    static async getTranscript(videoId) {
        try {
            const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
            return transcripts;
        } catch (error) {
            // Enhanced error logging with video ID
            console.error(`YouTube transcript error for video ${videoId}:`, error.message);
            
            // Preserve the original error but add more context
            if (error.message.includes('Transcript is disabled') || 
                error.name === 'YoutubeTranscriptDisabledError') {
                throw new Error(`Transcript is disabled for video ${videoId}`);
            } else if (error.message.includes('private')) {
                throw new Error(`Video ${videoId} might be private or restricted`);
            } else {
                throw new Error(`Failed to fetch transcript: ${error.message}`);
            }
        }
    }
}

module.exports = YoutubeService;
