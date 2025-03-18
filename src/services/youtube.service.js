const { YoutubeTranscript } = require('youtube-transcript');

class YoutubeService {
    static async getTranscript(videoId) {
        try {
            const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
            return transcripts;
        } catch (error) {
            throw new Error(`Failed to fetch transcript: ${error.message}`);
        }
    }
}

module.exports = YoutubeService;
