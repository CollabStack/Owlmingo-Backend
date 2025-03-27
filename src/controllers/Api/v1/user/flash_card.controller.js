const { successResponse, errorResponse } = require('../../baseAPI.controller');
const FlashCardService = require('../../../../services/user/flash_card.service');
const { uploadFile } = require('../../../../services/upload_file.service');

class FlashCardController {
    static async createFlashCard(req, res) {
        try {
            const userId = req.user._id;
            const { flashCardId } = req.params;  // Get from URL params instead of body
            const { front, back, category, difficulty } = req.body;

            if (!front || !back) {
                return errorResponse(res, 'Front and back content are required', 400);
            }

            const flashCard = await FlashCardService.addCardToFlashCard(userId, flashCardId, {
                front, back, category, difficulty
            });

            return successResponse(res, flashCard, 'Card added to flash card successfully');
        } catch (error) {
            console.error('Add card error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async getAllFlashCards(req, res) {
        try {
            const userId = req.user._id;
            const { category, difficulty, search, sortBy, sortOrder } = req.query;

            const flashCards = await FlashCardService.getAllFlashCards(userId, {
                category, difficulty, search, sortBy, sortOrder
            });

            return successResponse(res, {
                count: flashCards.length,
                flashCards
            }, 'Flash cards retrieved successfully');
        } catch (error) {
            console.error('Get flash cards error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async getAllFlashCard(req, res) {
        try {
            const userId = req.user._id;
            const { globalId } = req.params;

            const flashCard = await FlashCardService.getFlashCardById(userId, globalId);
            if (!flashCard) {
                return errorResponse(res, 'Flash card not found', 404);
            }

            return successResponse(res, flashCard, 'Flash card retrieved successfully');
        } catch (error) {
            console.error('Get flash card error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async updateFlashCard(req, res) {
        try {
            const userId = req.user._id;
            const idParam = req.params.globalId;
            const updateData = {
                cardId: req.body._id,
                front: req.body.front,
                back: req.body.back,
                category: req.body.category,
                difficulty: req.body.difficulty,
                status: req.body.status,
                nextReviewDate: req.body.nextReviewDate
            };
            
            // Modify the service call to accept either _id or globalId
            const flashCard = await FlashCardService.updateFlashCardFlexible(userId, idParam, updateData);
            if (!flashCard) {
                return errorResponse(res, 'Flash card not found', 404);
            }

            return successResponse(res, flashCard, 'Flash card updated successfully');
        } catch (error) {
            console.error('Update flash card error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async deleteFlashCard(req, res) {
        try {
            const userId = req.user._id;
            const { globalId } = req.params;

            const flashCard = await FlashCardService.deleteFlashCard(userId, globalId);
            if (!flashCard) {
                return errorResponse(res, 'Flash card not found', 404);
            }

            return successResponse(res, null, 'Flash card deleted successfully');
        } catch (error) {
            console.error('Delete flash card error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async deleteSpecificCard(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;

            const flashCard = await FlashCardService.deleteSpecificCard(userId, globalId, cardId);
            
            // If flashCard is null, it means the last card was deleted and the flash card was removed
            if (flashCard === null) {
                return successResponse(res, null, 'Last card deleted and flash card removed successfully');
            }

            return successResponse(res, flashCard, 'Card deleted successfully');
        } catch (error) {
            console.error('Delete specific card error:', error);
            return errorResponse(res, error.message, 404);
        }
    }

    static async generateFromText(req, res) {
        try {
            const userId = req.user._id;
            const { text, fileOcrId } = req.body;

            let flashCards;

            if (fileOcrId) {
                // If fileOcrId is provided, generate from FileOcr
                flashCards = await FlashCardService.createFlashCardsFromFileOcr(userId, fileOcrId);
            } else if (text) {
                // If text is provided directly, use that
                if (text.length < 10) {
                    return errorResponse(res, 'Text content is too short', 400);
                }
                if (text.length > 10000) {
                    return errorResponse(res, 'Text content is too long (max 10000 characters)', 400);
                }
                flashCards = await FlashCardService.createFlashCardsFromText(userId, text);
            } else {
                return errorResponse(res, 'Either text or fileOcrId is required', 400);
            }
            
            if (!flashCards || !flashCards.cards || flashCards.cards.length === 0) {
                return errorResponse(res, 'Failed to generate flash cards', 400);
            }

            return successResponse(res, flashCards, 'Flash cards generated successfully');
        } catch (error) {
            console.error('Generate flash cards error:', error);
            return errorResponse(res, `Failed to generate flash cards: ${error.message}`, 500);
        }
    }

    static async updateCardStatus(req, res) {
        try {
            const userId = req.user._id;
            const { flashCardId, cardIndex } = req.params;
            const { status, nextReviewDate } = req.body;

            const flashCard = await FlashCardService.updateCardStatus(
                userId, 
                flashCardId, 
                cardIndex, 
                status, 
                nextReviewDate
            );

            return successResponse(res, flashCard, 'Card status updated successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    static async getSpecificCard(req, res) {
        try {
            const userId = req.user._id;
            const { flashCardId, cardId } = req.params;

            const flashCard = await FlashCardService.getSpecificCard(userId, flashCardId, cardId);
            if (!flashCard) {
                return errorResponse(res, 'Flash card or specific card not found', 404);
            }

            return successResponse(res, flashCard, 'Specific card retrieved successfully');
        } catch (error) {
            console.error('Get specific card error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async getAllFlashCards(req, res) {
        try {
            const userId = req.user._id;
            const flashCards = await FlashCardService.getAllFlashCards(userId);

            return successResponse(res, {
                count: flashCards.length,
                flashCards
            }, 'All flash cards retrieved successfully');
        } catch (error) {
            console.error('Get all flash cards error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async uploadCardImages(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;
            const imageUrls = {};

            if (req.files) {
                if (req.files.frontImage) {
                    const frontImageFile = req.files.frontImage[0];
                    const frontImageName = `flashcards/${userId}/${Date.now()}-front-${frontImageFile.originalname}`;
                    imageUrls.frontImage = await uploadFile(frontImageFile.buffer, frontImageName);
                }
                
                if (req.files.backImage) {
                    const backImageFile = req.files.backImage[0];
                    const backImageName = `flashcards/${userId}/${Date.now()}-back-${backImageFile.originalname}`;
                    imageUrls.backImage = await uploadFile(backImageFile.buffer, backImageName);
                }
            }

            if (Object.keys(imageUrls).length === 0) {
                return errorResponse(res, 'No images provided', 400);
            }

            const flashCard = await FlashCardService.updateCardImages(userId, globalId, cardId, imageUrls);
            return successResponse(res, flashCard, 'Card images updated successfully');
        } catch (error) {
            console.error('Upload card images error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async uploadFrontImage(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;
            const imageUrls = {};

            if (!req.file) {
                return errorResponse(res, 'No image provided', 400);
            }

            const frontImageName = `flashcards/${userId}/${Date.now()}-front-${req.file.originalname}`;
            imageUrls.frontImage = await uploadFile(req.file.buffer, frontImageName);

            const flashCard = await FlashCardService.updateCardImages(userId, globalId, cardId, imageUrls);
            return successResponse(res, flashCard, 'Front image updated successfully');
        } catch (error) {
            console.error('Upload front image error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async uploadBackImage(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;
            const imageUrls = {};

            if (!req.file) {
                return errorResponse(res, 'No image provided', 400);
            }

            const backImageName = `flashcards/${userId}/${Date.now()}-back-${req.file.originalname}`;
            imageUrls.backImage = await uploadFile(req.file.buffer, backImageName);

            const flashCard = await FlashCardService.updateCardImages(userId, globalId, cardId, imageUrls);
            return successResponse(res, flashCard, 'Back image updated successfully');
        } catch (error) {
            console.error('Upload back image error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async removeFrontImage(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;

            const flashCard = await FlashCardService.removeCardImage(userId, globalId, cardId, 'front');
            return successResponse(res, flashCard, 'Front image removed successfully');
        } catch (error) {
            console.error('Remove front image error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async removeBackImage(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;

            const flashCard = await FlashCardService.removeCardImage(userId, globalId, cardId, 'back');
            return successResponse(res, flashCard, 'Back image removed successfully');
        } catch (error) {
            console.error('Remove back image error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async examCard(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;
            const { userAnswer } = req.body;

            if (!userAnswer) {
                return errorResponse(res, 'Answer is required', 400);
            }

            const result = await FlashCardService.evaluateAnswer(
                userId,
                globalId,
                cardId,
                userAnswer
            );

            return successResponse(res, result, 'Answer evaluated successfully');
        } catch (error) {
            console.error('Exam answer evaluation error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async toggleShareFlashCard(req, res) {
        try {
            const userId = req.user._id;
            const { globalId } = req.params;
            const { isPublic } = req.body;

            const flashCard = await FlashCardService.toggleShareFlashCard(userId, globalId, isPublic);
            if (!flashCard) {
                return errorResponse(res, 'Flash card not found', 404);
            }

            return successResponse(res, { 
                isPublic: flashCard.isPublic,
                shareUrl: flashCard.isPublic ? `/shared/flashcards/${flashCard.globalId}` : null
            }, `Flash card ${flashCard.isPublic ? 'shared' : 'unshared'} successfully`);
        } catch (error) {
            console.error('Toggle share flash card error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async getSharedFlashCard(req, res) {
        try {
            const { globalId } = req.params;
            
            const flashCard = await FlashCardService.getSharedFlashCard(globalId);
            if (!flashCard) {
                return errorResponse(res, 'Shared flash card not found', 404);
            }

            return successResponse(res, flashCard, 'Shared flash card retrieved successfully');
        } catch (error) {
            console.error('Get shared flash card error:', error);
            return errorResponse(res, error.message);
        }
    }

    static async updateCard(req, res) {
        try {
            const userId = req.user._id;
            const { globalId, cardId } = req.params;
            const { front, back, category, difficulty, status, nextReviewDate } = req.body;

            // Validate required fields
            if (!front && !back && !category && !difficulty && !status) {
                return errorResponse(res, 'At least one field to update is required', 400);
            }

            const updateData = {
                cardId,
                ...(front && { front }),
                ...(back && { back }),
                ...(category && { category }),
                ...(difficulty && { difficulty }),
                ...(status && { status }),
                ...(nextReviewDate && { nextReviewDate })
            };

            const flashCard = await FlashCardService.updateFlashCardFlexible(userId, globalId, updateData);
            
            if (!flashCard) {
                return errorResponse(res, 'Flash card or specific card not found', 404);
            }

            // Find the updated card in the response
            const updatedCard = flashCard.cards.find(c => c._id.toString() === cardId);
            
            return successResponse(res, updatedCard, 'Card updated successfully');
        } catch (error) {
            console.error('Update card error:', error);
            return errorResponse(res, error.message);
        }
    }
}

module.exports = FlashCardController;
