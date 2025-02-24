const { successResponse, errorResponse } = require('../../baseAPI.controller');
const FlashCardSessionService = require('../../../../services/user/flash_card_session.service');

class FlashCardSessionController {
    static async createSession(req, res) {
        try {
            const userId = req.user._id;
            const { title, category, cardIds } = req.body;

            if (!title || !cardIds || !cardIds.length) {
                return errorResponse(res, 'Title and card IDs are required', 400);
            }

            const session = await FlashCardSessionService.createSession(userId, {
                title, category, cardIds
            });

            return successResponse(res, session, 'Study session created successfully');
        } catch (error) {
            console.error('Create session error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async getSessions(req, res) {
        try {
            const userId = req.user._id;
            const sessions = await FlashCardSessionService.getUserSessions(userId);
            return successResponse(res, sessions, 'Sessions retrieved successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    static async getSession(req, res) {
        try {
            const { globalId } = req.params;
            const session = await FlashCardSessionService.getSessionWithCards(globalId);
            if (!session) {
                return errorResponse(res, 'Session not found', 404);
            }
            return successResponse(res, session, 'Session retrieved successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    static async updateCardReview(req, res) {
        try {
            const userId = req.user._id;
            const { sessionId, cardId } = req.params;
            const reviewData = req.body;

            const updatedSession = await FlashCardSessionService.updateCardReview(
                userId, 
                sessionId, 
                cardId, 
                reviewData
            );

            return successResponse(res, updatedSession, 'Review updated successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

module.exports = FlashCardSessionController;
