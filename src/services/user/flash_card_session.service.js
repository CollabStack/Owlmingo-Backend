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

    static async getSessionWithCards(globalId) {
        return await FlashCardSession.findOne({ globalId })
            .populate('cards.cardId')
            .lean();
    }

    static async getUserSessions(userId) {
        return await FlashCardSession.find({
            userId,
            isActive: true
        })
        .sort({ lastStudied: -1 })
        .lean();
    }

    static async updateCardReview(userId, sessionId, cardId, reviewData) {
        const { confidence, timeSpent } = reviewData;
        const session = await FlashCardSession.findOne({ globalId: sessionId, userId });
        
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
            timeSpent
        });

        // Update session progress
        this.updateSessionProgress(session);
        
        session.lastStudied = new Date();
        await session.save();

        return await this.getSessionWithCards(sessionId);
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
}

module.exports = FlashCardSessionService;
