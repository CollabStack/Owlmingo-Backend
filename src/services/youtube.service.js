const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');
// Import additional transcript libraries as fallbacks
const ytCaptionScraper = require('youtube-captions-scraper');
const { getSubtitles } = require('youtube-transcript-api');

class YoutubeService {
    static async getTranscript(videoId) {
        try {
            console.log(`Attempting to fetch transcript for video ${videoId} using primary method...`);
            const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
            console.log(`Successfully fetched transcript for video ${videoId}`);
            return transcripts;
        } catch (error) {
            // Enhanced error logging with video ID
            console.error(`YouTube transcript error for video ${videoId}:`, error.message);
            
            // Try alternative methods if primary fails
            if (error.message.includes('Transcript is disabled') || 
                error.name === 'YoutubeTranscriptDisabledError') {
                try {
                    console.log(`Attempting alternative transcript fetch methods for ${videoId}...`);
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
        // Try multiple methods to get transcripts
        const methods = [
            this.tryYoutubeCaptionScraper,
            this.tryYoutubeTranscriptApi,
            this.tryDirectApiRequest
        ];

        for (const method of methods) {
            try {
                console.log(`Trying alternate method: ${method.name} for video ${videoId}`);
                const transcripts = await method(videoId);
                if (transcripts && transcripts.length > 0) {
                    console.log(`Success with ${method.name} for video ${videoId}`);
                    return transcripts;
                }
            } catch (error) {
                console.error(`Failed with ${method.name}: ${error.message}`);
                // Continue to next method
            }
        }
        
        // Check if the video is at least accessible
        try {
            const videoInfo = await this.validateVideoAccessibility(videoId);
            if (videoInfo.accessible) {
                console.log(`Video is accessible but no transcripts found: "${videoInfo.title}"`);
                throw new Error(`No transcripts available for "${videoInfo.title}" despite the video being accessible`);
            }
        } catch (error) {
            console.error(`Cannot access video: ${error.message}`);
        }
        
        return [];
    }

    // Method 1: Try youtube-captions-scraper
    static async tryYoutubeCaptionScraper(videoId) {
        try {
            // This library can sometimes get auto-generated captions
            const captions = await ytCaptionScraper.getSubtitles({
                videoID: videoId,
                lang: 'en'  // Try English first
            });
            
            if (!captions || captions.length === 0) {
                // Try auto-generated captions if available
                return await ytCaptionScraper.getSubtitles({
                    videoID: videoId,
                    lang: 'en', 
                    auto: true
                });
            }
            
            // Convert to our expected format
            return captions.map(caption => ({
                text: caption.text,
                offset: caption.start * 1000, // Convert to ms
                duration: caption.dur * 1000
            }));
        } catch (error) {
            console.error(`Caption scraper error: ${error.message}`);
            throw error;
        }
    }

    // Method 2: Try youtube-transcript-api (different implementation)
    static async tryYoutubeTranscriptApi(videoId) {
        try {
            const subtitles = await getSubtitles({
                videoID: videoId,
                lang: 'en'
            });
            
            // Convert to our expected format
            return subtitles.map(subtitle => ({
                text: subtitle.text,
                offset: subtitle.start * 1000, // Convert to ms
                duration: subtitle.dur * 1000
            }));
        } catch (error) {
            console.error(`Transcript API error: ${error.message}`);
            throw error;
        }
    }

    // Method 3: Try direct API request to YouTube
    static async tryDirectApiRequest(videoId) {
        try {
            // This is a more direct approach that might work in some cases
            // Note: This is example code and may need adjustment
            const response = await axios.get(
                `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
                { responseType: 'text' }
            );
            
            // If we get XML back, it contains captions
            if (response.data && response.data.includes('<text')) {
                // Very simple XML parsing - in production you'd use a proper XML parser
                const texts = response.data.match(/<text[^>]*>(.*?)<\/text>/g) || [];
                const timestamps = response.data.match(/start="([^"]+)"/g) || [];
                
                return texts.map((text, index) => {
                    const content = text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                    const startTime = parseFloat(timestamps[index]?.match(/\d+\.?\d*/)?.[0] || "0") * 1000;
                    
                    return {
                        text: content,
                        offset: startTime,
                        duration: 2000 // Assuming 2 seconds per caption
                    };
                });
            }
            console.warn('Direct API returned data but no captions found');
            return [];
        } catch (error) {
            console.error(`Direct API request error: ${error.message}`);
            throw error;
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
