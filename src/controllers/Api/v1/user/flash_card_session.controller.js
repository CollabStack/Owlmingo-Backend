const { successResponse, errorResponse } = require('../../baseAPI.controller');
const FlashCardSessionService = require('../../../../services/user/flash_card_session.service');

class FlashCardSessionController {
    static async createSession(req, res) {
        try {
            const userId = req.user._id;
            const sessionData = req.body;

            if (!sessionData.title || !sessionData.cardIds || !sessionData.cardIds.length) {
                return errorResponse(res, 'Title and card IDs are required', 400);
            }

            const session = await FlashCardSessionService.createSession(userId, sessionData);
            return successResponse(res, session, 'Session created successfully');
        } catch (error) {
            console.error('Create session error:', error);
            return errorResponse(res, error.message || 'Failed to create session');
        }
    }

    static async getSessions(req, res) {
        try {
            const userId = req.user._id;
            const sessions = await FlashCardSessionService.getUserSessions(userId);
            return successResponse(res, {
                count: sessions.length,
                sessions: sessions
            }, 'Sessions retrieved successfully');
        } catch (error) {
            console.error('Get sessions error:', error);
            return errorResponse(res, error.message || 'Failed to retrieve sessions');
        }
    }

    static async getSession(req, res) {
        try {
            const { globalId } = req.params;
            if (!globalId) {
                return errorResponse(res, 'Session ID is required', 400);
            }

            const session = await FlashCardSessionService.getSessionWithCards(globalId);
            if (!session) {
                return errorResponse(res, 'Session not found', 404);
            }

            return successResponse(res, session, 'Session retrieved successfully');
        } catch (error) {
            console.error('Get session error:', error);
            return errorResponse(res, error.message || 'Failed to retrieve session', 
                error.message.includes('not found') ? 404 : 500);
        }
    }

    static async updateCardReview(req, res) {
        try {
            const userId = req.user._id;
            const { sessionId, cardId } = req.params;
            const reviewData = req.body;

            if (!sessionId || !cardId) {
                return errorResponse(res, 'Session ID and Card ID are required', 400);
            }

            if (!reviewData.confidence || !reviewData.timeSpent) {
                return errorResponse(res, 'Confidence and timeSpent are required', 400);
            }

            const updatedSession = await FlashCardSessionService.updateCardReview(
                userId, 
                sessionId, 
                cardId, 
                reviewData
            );

            return successResponse(res, updatedSession, 'Card review updated successfully');
        } catch (error) {
            console.error('Update card review error:', error);
            return errorResponse(res, error.message || 'Failed to update card review',
                error.message.includes('not found') ? 404 : 500);
        }
    }
}

module.exports = FlashCardSessionController;
