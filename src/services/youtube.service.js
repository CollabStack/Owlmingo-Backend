const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');

class YoutubeService {
    static async getTranscript(videoId) {
        try {
            console.log(`Attempting to fetch transcript for video ${videoId}...`);
            const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
            console.log(`Successfully fetched transcript for video ${videoId}`);
            return transcripts;
        } catch (error) {
            // Enhanced error logging with video ID
            console.error(`YouTube transcript error for video ${videoId}:`, error.message);
            
            // Try alternative method if primary fails
            if (error.message.includes('Transcript is disabled') || 
                error.name === 'YoutubeTranscriptDisabledError') {
                try {
                    console.log(`Attempting alternative transcript fetch method for ${videoId}...`);
                    const alternateTranscripts = await this.attemptAlternateTranscriptFetch(videoId);
                    if (alternateTranscripts && alternateTranscripts.length > 0) {
                        console.log(`Successfully fetched transcript using alternative method for ${videoId}`);
                        return alternateTranscripts;
                    }
                } catch (altError) {
                    console.error(`Alternative transcript fetch failed for ${videoId}:`, altError.message);
                }
                throw new Error(`Transcript is disabled for video ${videoId}`);
            } else if (error.message.includes('private')) {
                throw new Error(`Video ${videoId} might be private or restricted`);
            } else {
                throw new Error(`Failed to fetch transcript: ${error.message}`);
            }
        }
    }

    // Alternative method to try fetching transcripts when primary method fails
    static async attemptAlternateTranscriptFetch(videoId) {
        // This is a placeholder for an alternative implementation
        // You could implement a different library or direct API call here
        
        // Example of a potential alternative approach:
        try {
            // Check if video info is accessible (this helps determine if it's a network issue)
            const response = await axios.get(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
            console.log(`Video info accessible: ${JSON.stringify(response.data.title)}`);
            
            // If we can access video info but not transcripts, it's likely a transcript availability issue
            // rather than a network/firewall issue
            return null;
        } catch (error) {
            console.error(`Cannot access video info: ${error.message}`);
            if (error.message.includes('403') || error.message.includes('network')) {
                throw new Error(`Network or access restrictions detected`);
            }
            return null;
        }
    }

    // Utility method to validate if a video ID is valid and accessible
    static async validateVideoAccessibility(videoId) {
        try {
            const response = await axios.get(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
            return {
                accessible: true,
                title: response.data.title,
                author: response.data.author_name
            };
        } catch (error) {
            console.error(`Video accessibility check failed for ${videoId}:`, error.message);
            return {
                accessible: false,
                error: error.message
            };
        }
    }
}

module.exports = YoutubeService;
