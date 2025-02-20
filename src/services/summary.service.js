const axios = require('axios');
const Summary = require('../models/summary.model');
const { File } = require('../models/file.model');

const OLLAMA_API_URL = 'https://llm-system-product-name.tail973907.ts.net/api/generate';
const OLLAMA_TIMEOUT = 100000;

class SummaryService {
    static async generateSummaryFromText(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }

            const requestData = {
                prompt: `Please generate a concise, objective summary of the text provided below. Follow these guidelines closely:
              1. **Identify and capture the main ideas:** Extract key arguments, main points, and conclusions without adding personal opinions.
              2. **Structure your summary:** Write a coherent summary in 4-5  paragraphs ensuring logical flow and clarity.
              3. **Use professional language:** Ensure that the tone is clear, factual, and avoids unnecessary embellishments.
              4. **Maintain factual accuracy:** Only include information that is explicitly present in the text.
              5. **Be succinct but comprehensive:** Your summary should be detailed enough to cover the essence of the text without being verbose.
              6. **Strictly adhere to the JSON format:** Return your response solely in valid JSON, using exactly these keys:
                 - "title": A brief, descriptive title (preferably under 8 words).
                 - "content": The generated summary text.
              
              Text to summarize:
              ${text}
              
              Important: Your entire response must be valid JSON exactly in this format:
              {
                "title": "Brief descriptive title",
                "content": "Generated summary text"
              }`,
                model: 'llama3.2:latest',
                stream: false,
                temperature: 0.7
              };
              

            const response = await axios.post(OLLAMA_API_URL, requestData, {
                timeout: OLLAMA_TIMEOUT,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data || !response.data.response) {
                console.error('Invalid Ollama response:', response.data);
                throw new Error('Invalid response from Ollama API');
            }

            let result;
            const rawResponse = response.data.response;
            try {
                // Try to extract JSON if it's embedded in other text
                const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
                
                result = JSON.parse(jsonStr);

                if (!result.title || !result.content) {
                    // If parsing succeeded but missing required fields, create a basic structure
                    console.warn('Parsed response missing required fields:', result);
                    result = {
                        title: result.title || "Generated Summary",
                        content: result.content || rawResponse
                    };
                }
            } catch (parseError) {
                console.error('Parse error:', parseError);
                console.error('Raw response:', rawResponse);
                
                // Fallback: Create a basic structure from the raw response
                result = {
                    title: "Generated Summary",
                    content: rawResponse
                };
            }

            return result;
        } catch (error) {
            console.error('Summary generation error:', error);
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Unable to connect to Ollama API. Please ensure Ollama is running.');
            }
            if (error.response?.status === 404) {
                throw new Error('Ollama API endpoint not found. Please check if Ollama is properly installed.');
            }
            throw new Error(`Summary generation failed: ${error.message}`);
        }
    }

    static async createSummaryFromFile(userId, fileId) {
        try {
            // Find the file and verify ownership
            const file = await File.findOne({ 
                _id: fileId,
                user_id: userId,
            });

            if (!file) {
                throw new Error('File not found or unauthorized');
            }

            // Generate summary from file data
            const generatedSummary = await this.generateSummaryFromText(file.data);

            // Create summary record
            const summary = await Summary.create({
                user_id: userId,
                title: generatedSummary.title,
                content: generatedSummary.content,
                original_text: file.data,
                file_id: file._id
            });

            return {
                summary,
                file: {
                    metadata: file.metadata,
                    type: file.type,
                    url: file.url
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async createSummary(userId, title, content, originalText, fileId = null) {
        try {
            const summary = await Summary.create({
                user_id: userId,
                title,
                content,
                original_text: originalText,
                file_id: fileId
            });
            return summary;
        } catch (error) {
            throw error;
        }
    }

    static async getSummaries(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const summaries = await Summary.find({ user_id: userId })
                .sort({ createdAt: -1 })
                .lean();
            
            return summaries || [];
        } catch (error) {
            console.error('Error in SummaryService.getSummaries:', error);
            throw error;
        }
    }

    static async getSummaryById(userId, globalId) {
        try {
            if (!userId || !globalId) {
                throw new Error('User ID and Summary ID are required');
            }

            const summary = await Summary.findOne({
                _id: globalId,
                user_id: userId
            }).lean();

            if (!summary) {
                return null;
            }

            // If there's an associated file, get its info
            if (summary.file_id) {
                const file = await File.findOne({ _id: summary.file_id });
                if (file) {
                    summary.fileInfo = {
                        fileName: file.metadata?.originalFileName,
                        fileType: file.type,
                        url: file.url
                    };
                }
            }

            return summary;
        } catch (error) {
            console.error('Error in SummaryService.getSummaryById:', error);
            throw error;
        }
    }

    static async updateSummary(userId, globalId, title, content) {
        try {
            if (!userId || !globalId) {
                throw new Error('User ID and Summary ID are required');
            }

            if (!title || !content) {
                throw new Error('Title and content are required');
            }

            const updatedSummary = await Summary.findOneAndUpdate(
                {
                    _id: globalId,
                    user_id: userId
                },
                {
                    $set: {
                        title,
                        content,
                        updatedAt: new Date()
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            ).lean();

            if (!updatedSummary) {
                return null;
            }

            // If there's an associated file, include its info
            if (updatedSummary.file_id) {
                const file = await File.findOne({ _id: updatedSummary.file_id });
                if (file) {
                    updatedSummary.fileInfo = {
                        fileName: file.metadata?.originalFileName,
                        fileType: file.type,
                        url: file.url
                    };
                }
            }

            return updatedSummary;
        } catch (error) {
            console.error('Error in SummaryService.updateSummary:', error);
            throw error;
        }
    }

    static async deleteSummary(userId, globalId) {
        try {
            if (!userId || !globalId) {
                throw new Error('User ID and Summary ID are required');
            }

            const summary = await Summary.findOneAndDelete({
                _id: globalId,
                user_id: userId
            });

            if (!summary) {
                return null;
            }

            // If there was an associated file, you might want to delete it too
            if (summary.file_id) {
                await File.findOneAndDelete({ _id: summary.file_id });
            }

            return summary;
        } catch (error) {
            console.error('Error in SummaryService.deleteSummary:', error);
            throw error;
        }
    }
}

module.exports = SummaryService;
