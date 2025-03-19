const axios = require('axios');
const FlashCard = require('../../models/flash_card.model');
const { File } = require('../../models/file.model');  // Update this line to use the correct model
const FlashCardSessionService = require('./flash_card_session.service'); // Add this line

const OLLAMA_API_URL = 'https://llm-system.tail973907.ts.net/api/generate';
const OLLAMA_TIMEOUT = 300000;

class FlashCardService {
    static async generateFlashCardsFromText(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }

            const requestData = {
                prompt: `Generate flash cards from this text. Format your response as detailed questions and answers.
                Follow these guidelines:
                1. Create 10-15 specific questions and detailed answers
                2. Focus on key concepts, definitions, and important details
                3. Make questions clear and unambiguous
                4. If information is not provided in the text, answer with "Not specified"
                5. Use "General" as the category and "Medium" as the default difficulty
                
                Return ONLY valid JSON in this exact format:
                {
                    "flash_card_title": "Brief topic title",
                    "cards": [
                        {
                            "front": "Question text",
                            "back": "Answer text",
                            "category": "General",
                            "difficulty": "Medium",
                            "status": "New"
                        }
                    ]
                }
                
                Text to process:
                ${text}`,
                model: 'llama3.2:latest',
                stream: false,
                temperature: 0.7
            };

            const response = await axios.post(OLLAMA_API_URL, requestData, {
                timeout: OLLAMA_TIMEOUT,
                headers: {
                    'Content-Type': 'application/json'
                },
                maxRetries: 3,
                retryDelay: 1000,
                httpAgent: new require('http').Agent({ keepAlive: true }),
                httpsAgent: new require('https').Agent({ keepAlive: true })
            });

            if (!response.data || !response.data.response) {
                throw new Error('Invalid response from Ollama API');
            }

            let result;
            const rawResponse = response.data.response;
            try {
                // Enhanced JSON extraction
                const jsonMatches = rawResponse.match(/(\{[\s\S]*\})/g);
                if (!jsonMatches) {
                    throw new Error('No JSON found in response');
                }

                // Try each matched JSON object
                for (const match of jsonMatches) {
                    try {
                        const parsed = JSON.parse(match);
                        if (parsed.flash_card_title && Array.isArray(parsed.cards)) {
                            result = parsed;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }

                if (!result) {
                    // Fallback creation
                    result = {
                        flash_card_title: 'Fallback Title',
                        cards: [
                            {
                                front: 'No valid data',
                                back: `Raw: ${rawResponse}`,
                                category: 'General',
                                difficulty: 'Medium'
                            }
                        ]
                    };
                }

                // Validate cards structure
                result.cards = result.cards.map(card => ({
                    front: String(card.front || ''),
                    back: String(card.back || ''),
                    category: String(card.category || 'General'),
                    difficulty: ['Easy', 'Medium', 'Hard'].includes(card.difficulty) ? card.difficulty : 'Medium'
                }));

            } catch (parseError) {
                console.error('Parse error:', parseError);
                console.error('Raw response:', rawResponse);
                // Fallback creation
                return {
                    flash_card_title: 'Fallback Title',
                    cards: [
                        {
                            front: 'Failed to parse AI response',
                            back: `Raw: ${rawResponse}`,
                            category: 'General',
                            difficulty: 'Medium'
                        }
                    ]
                };
            }

            return result;
        } catch (error) {
            console.error('Flash cards generation error:', error);
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                throw new Error('Request timed out. Please try again with a shorter text or check if Ollama is running properly.');
            }
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Unable to connect to Ollama API. Please ensure Ollama is running on port 11434.');
            }
            if (error.response?.status === 404) {
                throw new Error('Ollama API endpoint not found. Please check if Ollama is properly installed.');
            }
            throw new Error(`Generation failed: ${error.message}`);
        }
    }

    static async createFlashCardsFromText(userId, text, fileOcrId = null) {
        try {
            const generated = await this.generateFlashCardsFromText(text);
            
            const flashCard = await FlashCard.create({
                flash_card_title: generated.flash_card_title,
                source: {
                    fileOcrId,
                    extractedTextSegment: text
                },
                cards: generated.cards,
                created_by: userId
            });

            // Create a study session automatically
            await FlashCardSessionService.createSession(userId, {
                title: `Study: ${generated.flash_card_title}`,
                category: generated.cards[0]?.category || 'General',
                cardIds: [flashCard._id]
            });

            return flashCard;
        } catch (error) {
            console.error('Error creating flash cards:', error);
            throw error;
        }
    }

    static async createFlashCardsFromFileOcr(userId, fileOcrId) {
        try {
            // Find the File document and verify ownership
            const file = await File.findOne({ 
                _id: fileOcrId,
                user_id: userId
            });

            if (!file) {
                throw new Error('File not found or unauthorized');
            }

            // Generate flash cards from the file's data
            const generated = await this.generateFlashCardsFromText(file.data);
            
            const flashCard = await FlashCard.create({
                flash_card_title: generated.flash_card_title,
                source: {
                    fileOcrId: file._id,
                    extractedTextSegment: file.data
                },
                cards: generated.cards,
                created_by: userId
            });

            // Create a study session automatically
            await FlashCardSessionService.createSession(userId, {
                title: `Study: ${generated.flash_card_title}`,
                category: generated.cards[0]?.category || 'General',
                cardIds: [flashCard._id]
            });

            return flashCard;
        } catch (error) {
            console.error('Error creating flash cards from File:', error);
            throw error;
        }
    }

    static async createFlashCard(userId, flashCardData) {
        try {
            const flashCard = await FlashCard.create({
                userId,
                ...flashCardData
            });
            return flashCard;
        } catch (error) {
            console.error('Error in createFlashCard:', error);
            throw error;
        }
    }

    static async getAllFlashCards(userId, query = {}) {
        try {
            // Change the filter to use created_by instead of userId
            const filter = { created_by: userId };
            
            if (query.category) {
                filter['cards.category'] = query.category;
            }
            if (query.difficulty) {
                filter['cards.difficulty'] = query.difficulty;
            }
            if (query.search) {
                filter.$or = [
                    { flash_card_title: { $regex: query.search, $options: 'i' } },
                    { 'cards.front': { $regex: query.search, $options: 'i' } },
                    { 'cards.back': { $regex: query.search, $options: 'i' } }
                ];
            }

            return await FlashCard.find(filter)
                .sort({ [query.sortBy || 'createdAt']: query.sortOrder || -1 });
        } catch (error) {
            console.error('Error in getAllFlashCards:', error);
            throw error;
        }
    }

    static async getFlashCardById(userId, globalId) {
        try {
            return await FlashCard.findOne({
                globalId,
                created_by: userId  // Changed from userId to created_by
                // Removed isActive since it's not in your schema
            });
        } catch (error) {
            console.error('Error in getFlashCardById:', error);
            throw error;
        }
    }

    static async updateFlashCard(userId, globalId, updateData) {
        try {
            const { cardId, front, back, category, difficulty, status, nextReviewDate } = updateData;
            
            // If updating a specific card within the flash card
            if (cardId) {
                return await FlashCard.findOneAndUpdate(
                    { 
                        globalId, 
                        created_by: userId,
                        'cards._id': cardId 
                    },
                    { 
                        $set: {
                            'cards.$.front': front,
                            'cards.$.back': back,
                            'cards.$.category': category,
                            'cards.$.difficulty': difficulty,
                            'cards.$.status': status,
                            'cards.$.nextReviewDate': nextReviewDate
                        }
                    },
                    { new: true }
                );
            }

            // Original code for updating the entire flash card
            return await FlashCard.findOneAndUpdate(
                { globalId, created_by: userId },
                { ...updateData },
                { new: true }
            );
        } catch (error) {
            console.error('Error in updateFlashCard:', error);
            throw error;
        }
    }

    static async updateFlashCardFlexible(userId, idParam, updateData) {
        try {
            const { cardId, front, back, category, difficulty, status, nextReviewDate } = updateData;
            
            // Create a query that can match either _id or globalId
            const query = {
                created_by: userId,
            };
            
            // Check if the id is a valid MongoDB ObjectId
            if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
                query._id = idParam;
            } else {
                query.globalId = idParam;
            }
            
            // If updating a specific card within the flash card
            if (cardId) {
                return await FlashCard.findOneAndUpdate(
                    { 
                        ...query,
                        'cards._id': cardId 
                    },
                    { 
                        $set: {
                            'cards.$.front': front,
                            'cards.$.back': back,
                            'cards.$.category': category,
                            'cards.$.difficulty': difficulty,
                            'cards.$.status': status,
                            'cards.$.nextReviewDate': nextReviewDate
                        }
                    },
                    { new: true }
                );
            }

            // Original code for updating the entire flash card
            return await FlashCard.findOneAndUpdate(
                query,
                { ...updateData },
                { new: true }
            );
        } catch (error) {
            console.error('Error in updateFlashCardFlexible:', error);
            throw error;
        }
    }

    static async deleteFlashCard(userId, globalId) {
        try {
            return await FlashCard.findOneAndDelete({
                globalId,
                created_by: userId
            });
        } catch (error) {
            console.error('Error in deleteFlashCard:', error);
            throw error;
        }
    }

    static async deleteSpecificCard(userId, globalId, cardId) {
        try {
            // Create a flexible query that can match either _id or globalId
            const query = {
                created_by: userId,
            };
            
            // Check if globalId is a valid MongoDB ObjectId
            if (globalId.match(/^[0-9a-fA-F]{24}$/)) {
                query._id = globalId;
            } else {
                query.globalId = globalId;
            }

            // First check if the flash card exists
            const existingCard = await FlashCard.findOne({
                ...query,
                'cards._id': cardId
            });

            if (!existingCard) {
                throw new Error('Flash card or specific card not found');
            }

            const flashCard = await FlashCard.findOneAndUpdate(
                query,
                { $pull: { cards: { _id: cardId } } },
                { new: true }
            );

            if (!flashCard) {
                throw new Error('Failed to delete card');
            }

            // Check if there are any cards left
            if (flashCard.cards.length === 0) {
                // If no cards left, delete the entire flash card
                await FlashCard.findByIdAndDelete(flashCard._id);
                return null;
            }

            return flashCard;
        } catch (error) {
            console.error('Error in deleteSpecificCard:', error);
            throw error;
        }
    }

    static async updateCardStatus(userId, flashCardId, cardIndex, status, nextReviewDate) {
        try {
            // Validate card index
            const flashCard = await FlashCard.findOne({ 
                flash_card_id: flashCardId,
                created_by: userId 
            });
            
            if (!flashCard) {
                throw new Error('Flash card not found');
            }
            
            if (cardIndex < 0 || cardIndex >= flashCard.cards.length) {
                throw new Error('Invalid card index');
            }

            return await FlashCard.findOneAndUpdate(
                { 
                    flash_card_id: flashCardId,
                    created_by: userId,
                    [`cards.${cardIndex}`]: { $exists: true }
                },
                { 
                    $set: {
                        [`cards.${cardIndex}.status`]: status,
                        [`cards.${cardIndex}.nextReviewDate`]: nextReviewDate
                    }
                },
                { new: true }
            );
        } catch (error) {
            console.error('Error updating card status:', error);
            throw error;
        }
    }

    static async addCardToFlashCard(userId, flashCardId, cardData) {
        try {
            const flashCard = await FlashCard.findOne({
                _id: flashCardId,  // Changed from flash_card_id to _id
                created_by: userId
            });

            if (!flashCard) {
                throw new Error('Flash card not found');
            }

            const newCard = {
                front: cardData.front,
                back: cardData.back,
                category: cardData.category || 'General',
                difficulty: cardData.difficulty || 'Medium',
                status: 'New',
                nextReviewDate: new Date()
            };

            flashCard.cards.push(newCard);
            await flashCard.save();

            return flashCard;
        } catch (error) {
            console.error('Error in addCardToFlashCard:', error);
            throw error;
        }
    }

    static async getSpecificCard(userId, flashCardId, cardId) {
        try {
            const flashCard = await FlashCard.findOne({
                _id: flashCardId,
                created_by: userId,
                'cards._id': cardId
            }, {
                'cards.$': 1
            });

            if (!flashCard) {
                throw new Error('Flash card or specific card not found');
            }

            return flashCard.cards[0];
        } catch (error) {
            console.error('Error in getSpecificCard:', error);
            throw error;
        }
    }

    static async getAllFlashCards(userId) {
        try {
            return await FlashCard.find({ created_by: userId });
        } catch (error) {
            console.error('Error in getAllFlashCards:', error);
            throw error;
        }
    }

    static async updateCardImages(userId, globalId, cardId, imageData) {
        try {
            const query = {
                created_by: userId,
                'cards._id': cardId
            };

            // Check if globalId is a valid MongoDB ObjectId
            if (globalId.match(/^[0-9a-fA-F]{24}$/)) {
                query._id = globalId;
            } else {
                query.globalId = globalId;
            }

            const updateFields = {};
            if (imageData.frontImage) {
                updateFields['cards.$.frontImage'] = imageData.frontImage;
            }
            if (imageData.backImage) {
                updateFields['cards.$.backImage'] = imageData.backImage;
            }

            const flashCard = await FlashCard.findOneAndUpdate(
                query,
                { $set: updateFields },
                { new: true }
            );

            if (!flashCard) {
                throw new Error('Flash card or card not found');
            }

            return flashCard;
        } catch (error) {
            console.error('Error in updateCardImages:', error);
            throw error;
        }
    }

    static async evaluateAnswer(userId, globalId, cardId, userAnswer) {
        try {
            const flashCard = await FlashCard.findOne({
                globalId,
                created_by: userId,
                'cards._id': cardId
            });

            if (!flashCard) {
                throw new Error('Flash card not found');
            }

            const card = flashCard.cards.find(c => c._id.toString() === cardId);

            const requestData = {
                prompt: `You are an expert educational evaluator. Analyze and provide detailed feedback on the student's answer.

Question: "${card.front}"
Correct Answer: "${card.back}"
Student's Answer: "${userAnswer}"

Instructions:
1. First, understand the key concepts and requirements from the correct answer
2. Compare the student's response with these key concepts
3. Pay attention to both factual accuracy and conceptual understanding
4. Consider partial credit for partially correct answers

Return a JSON response in this exact format - note that whatWasIncorrect and whatCouldBeIncluded must be strings, not arrays:
{
    "isCorrect": boolean (true if >= 90% accurate),
    "score": number (0-100),
    "feedback": {
        "whatWasIncorrect": "single string describing what was wrong",
        "whatCouldBeIncluded": "single string with suggestions",
        "keyPointsCovered": ["array of correct points mentioned"],
        "missingPoints": ["array of important points missed"]
    }
}

Ensure your response matches this format exactly.`,
                model: 'llama3.2:latest',
                stream: false,
                temperature: 0.3
            };

            const response = await axios.post(OLLAMA_API_URL, requestData, {
                timeout: OLLAMA_TIMEOUT,
                headers: { 'Content-Type': 'application/json' }
            });

            const evaluation = JSON.parse(response.data.response);

            // Format the exam history entry to match the schema
            const examEntry = {
                userAnswer: userAnswer,
                score: evaluation.score,
                feedback: {
                    whatWasIncorrect: evaluation.feedback.whatWasIncorrect,
                    whatCouldBeIncluded: evaluation.feedback.whatCouldBeIncluded,
                    keyPointsCovered: evaluation.feedback.keyPointsCovered || [],
                    missingPoints: evaluation.feedback.missingPoints || []
                },
                evaluatedAt: new Date()
            };

            // Update the document
            await FlashCard.updateOne(
                { 
                    globalId,
                    'cards._id': cardId 
                },
                { 
                    $push: {
                        'cards.$.examHistory': examEntry
                    }
                }
            );

            return evaluation;
        } catch (error) {
            console.error('Error in evaluateAnswer:', error);
            throw error;
        }
    }

    static async toggleShareFlashCard(userId, globalId, isPublic) {
        try {
            return await FlashCard.findOneAndUpdate(
                { globalId, created_by: userId },
                { isPublic: Boolean(isPublic) },
                { new: true }
            );
        } catch (error) {
            console.error('Error in toggleShareFlashCard:', error);
            throw error;
        }
    }

    static async getSharedFlashCard(globalId) {
        try {
            return await FlashCard.findOne({
                globalId,
                isPublic: true
            });
        } catch (error) {
            console.error('Error in getSharedFlashCard:', error);
            throw error;
        }
    }
}

module.exports = FlashCardService;
