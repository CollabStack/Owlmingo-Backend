const FlashCardSession = require('../../models/flash_card_session.model');
const FlashCard = require('../../models/flash_card.model');

class FlashCardSessionService {
    static async createSession(userId, { title, category, cardIds }) {
        try {
            // Validate card IDs exist
            const cardCount = await FlashCard.countDocuments({
                _id: { $in: cardIds },
                created_by: userId
            });

            if (cardCount !== cardIds.length) {
                throw new Error('One or more card IDs are invalid');
            }

            const cards = cardIds.map(cardId => ({
                cardId,
                status: 'Unreviewed',
                nextReviewDate: new Date()
            }));

            const session = await FlashCardSession.create({
                userId,
                title,
                category,
                cards,
                progress: {
                    mastered: 0,
                    learning: 0,
                    toReview: cardIds.length
                }
            });

            return await this.getSessionWithCards(session.globalId);
        } catch (error) {
            console.error('Error in createSession:', error);
            throw error;
        }
    }

    static async getUserSessions(userId) {
        try {
            const sessions = await FlashCardSession.find({
                userId,
                isActive: true
            })
            .select('-reviewHistory') // Exclude review history for list view
            .sort({ updatedAt: -1 })
            .populate({
                path: 'cards.cardId',
                match: { created_by: userId }, // Add this to filter cards by user
                select: 'front back category difficulty'
            })
            .lean();

            // Filter out sessions with no valid cards
            const validSessions = sessions.filter(session => 
                session.cards.some(card => card.cardId)
            );

            return validSessions.map(session => ({
                ...session,
                cardCount: session.cards.length,
                progress: {
                    mastered: session.progress.mastered,
                    learning: session.progress.learning,
                    toReview: session.progress.toReview,
                    total: session.cards.length
                }
            }));
        } catch (error) {
            console.error('Error in getUserSessions:', error);
            throw new Error('Failed to fetch user sessions');
        }
    }

    static async getSessionWithCards(globalId) {
        try {
            const session = await FlashCardSession.findOne({ globalId })
                .populate({
                    path: 'cards.cardId',
                    select: 'front back category difficulty'
                })
                .lean();

            if (!session) {
                throw new Error('Session not found');
            }

            return {
                ...session,
                progress: {
                    ...session.progress,
                    total: session.cards.length
                }
            };
        } catch (error) {
            console.error('Error in getSessionWithCards:', error);
            throw error;
        }
    }

    static async updateCardReview(userId, sessionId, cardId, reviewData) {
        try {
            const { confidence, timeSpent } = reviewData;
            if (!confidence || !timeSpent) {
                throw new Error('Confidence and timeSpent are required');
            }

            const session = await FlashCardSession.findOne({ 
                globalId: sessionId, 
                userId,
                isActive: true
            });
            
            if (!session) throw new Error('Session not found');

            const cardIndex = session.cards.findIndex(c => c.cardId.toString() === cardId);
            if (cardIndex === -1) throw new Error('Card not found in session');

            const card = session.cards[cardIndex];
            const newStatus = this.calculateNewStatus(confidence, card.status);
            const nextReview = this.calculateNextReviewDate(confidence);

            // Update card review data
            card.status = newStatus;
            card.confidence = confidence;
            card.nextReviewDate = nextReview;
            card.reviewHistory.push({
                date: new Date(),
                confidence,
                timeSpent: parseInt(timeSpent)
            });

            // Update session progress
            this.updateSessionProgress(session);
            session.lastStudied = new Date();
            await session.save();

            // Return updated session with populated cards
            return await this.getSessionWithCards(sessionId);
        } catch (error) {
            console.error('Error in updateCardReview:', error);
            throw error;
        }
    }

    static calculateNewStatus(confidence, currentStatus) {
        switch(confidence) {
            case 'Easy':
                return 'Mastered';
            case 'Good':
                return currentStatus === 'Learning' ? 'Review' : 'Learning';
            case 'Hard':
                return 'Learning';
            case 'Again':
                return 'Learning';
            default:
                return currentStatus;
        }
    }

    static calculateNextReviewDate(confidence) {
        const now = new Date();
        switch(confidence) {
            case 'Easy':
                return new Date(now.setDate(now.getDate() + 7));
            case 'Good':
                return new Date(now.setDate(now.getDate() + 3));
            case 'Hard':
                return new Date(now.setDate(now.getDate() + 1));
            case 'Again':
                return new Date(now.setHours(now.getHours() + 4));
            default:
                return now;
        }
    }

    static updateSessionProgress(session) {
        const progress = {
            mastered: 0,
            learning: 0,
            toReview: 0
        };

        session.cards.forEach(card => {
            switch(card.status) {
                case 'Mastered':
                    progress.mastered++;
                    break;
                case 'Learning':
                    progress.learning++;
                    break;
                default:
                    progress.toReview++;
            }
        });

        session.progress = progress;
    }

    static async getSessionsByFlashCard(userId, flashCardId) {
        try {
            const sessions = await FlashCardSession.find({
                userId,
                'cards.cardId': flashCardId,
                isActive: true
            })
            .populate({
                path: 'cards.cardId',
                select: 'front back category difficulty'
            })
            .lean();

            return sessions || [];
        } catch (error) {
            console.error('Error in getSessionsByFlashCard:', error);
            throw error;
        }
    }
}

module.exports = FlashCardSessionService;
