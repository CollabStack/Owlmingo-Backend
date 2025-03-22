const YOUTUBE_CONSTANTS = {
    // List of videos known to have good transcripts for testing
    TEST_VIDEOS: [
        { 
            id: 'TQMbvJNRpLE',
            title: 'Big Buck Bunny - Test Video with Captions'
        },
        { 
            id: 'zV14FtCz-eM',
            title: 'NASA Video with Captions'
        }
    ],
    // Message to show users when transcripts cannot be fetched
    TRANSCRIPT_FALLBACK_MESSAGE: `
        Unable to process this video. Please try a video with captions enabled.
        
        Recommended test video: https://www.youtube.com/watch?v=TQMbvJNRpLE
    `
};

module.exports = { YOUTUBE_CONSTANTS };
