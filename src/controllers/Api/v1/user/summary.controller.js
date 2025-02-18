const { successResponse, errorResponse } = require('../../baseAPI.controller');
const SummaryService = require('../../../../services/summary.service');

class SummaryController {
    static async createSummary(req, res) {
        try {
            const { fileId, title, content, original_text } = req.body;
            const userId = req.user._id;

            let summary;
            if (fileId) {
                // Use AI to generate summary from file
                const result = await SummaryService.createSummaryFromFile(userId, fileId);
                return successResponse(res, {
                    ...result.summary.toObject(),
                    file_info: {
                        fileName: result.file.metadata?.originalFileName,
                        fileType: result.file.type,
                        url: result.file.url
                    }
                }, 'Summary generated successfully');
            } else {
                if (!original_text) {
                    return errorResponse(res, 'Original text is required when no file is provided', 400);
                }
                // Generate summary from provided text
                const generatedSummary = await SummaryService.generateSummaryFromText(original_text);
                summary = await SummaryService.createSummary(
                    userId,
                    generatedSummary.title,
                    generatedSummary.content,
                    original_text
                );
                return successResponse(res, summary, 'Summary created successfully');
            }
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
    
    static async getSummary(req, res) {
        try {
            const userId = req.user._id;
            const { globalId } = req.params;
            const summary = await SummaryService.getSummaryById(userId, globalId);

            if (!summary) {
                return errorResponse(res, 'Summary not found', 404);
            }

            return successResponse(res, summary, 'Summary retrieved successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    static async getSummariesTitle(req, res) {
        try {
            console.log('Getting summaries for user:', req.user._id);
            const userId = req.user._id;
            
            if (!userId) {
                console.error('User ID is missing');
                return errorResponse(res, 'User ID is required', 400);
            }

            const summaries = await SummaryService.getSummaries(userId);
            console.log('Retrieved summaries:', summaries ? summaries.length : 0);
            
            if (!summaries) {
                return successResponse(res, [], 'No summaries available');
            }

            const summaryTitles = summaries.map(summary => ({
                id: summary._id,
                title: summary.title,
                createdAt: summary.createdAt,
                updatedAt: summary.updatedAt
            }));

            return successResponse(res, summaryTitles, 'Summary titles retrieved successfully');
        } catch (error) {
            console.error('Error in getSummariesTitle:', error);
            return errorResponse(res, 'Failed to retrieve summary titles: ' + error.message);
        }
    }

    static async getAllSummaries(req, res) {
        try {
            const userId = req.user._id;
            const summaries = await SummaryService.getSummaries(userId);
            
            if (!summaries || summaries.length === 0) {
                return successResponse(res, [], 'No summaries found');
            }

            const formattedSummaries = summaries.map(summary => ({
                id: summary._id,
                title: summary.title,
                content: summary.content,
                originalText: summary.original_text,
                createdAt: summary.createdAt,
                updatedAt: summary.updatedAt,
                fileInfo: summary.fileInfo || null
            }));

            return successResponse(res, formattedSummaries, 'All summaries retrieved successfully');
        } catch (error) {
            console.error('Error in getAllSummaries:', error);
            return errorResponse(res, 'Failed to retrieve summaries');
        }
    }

    static async updateSummary(req, res) {
        try {
            const userId = req.user._id;
            const { globalId } = req.params;
            const { title, content } = req.body;

            if (!title || !content) {
                return errorResponse(res, 'Title and content are required', 400);
            }

            const summary = await SummaryService.updateSummary(
                userId,
                globalId,
                title,
                content
            );

            if (!summary) {
                return errorResponse(res, 'Summary not found', 404);
            }

            return successResponse(res, summary, 'Summary updated successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    static async deleteSummary(req, res) {
        try {
            const userId = req.user._id;
            const { globalId } = req.params;

            const summary = await SummaryService.deleteSummary(userId, globalId);

            if (!summary) {
                return errorResponse(res, 'Summary not found', 404);
            }

            return successResponse(res, null, 'Summary deleted successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

module.exports = SummaryController;