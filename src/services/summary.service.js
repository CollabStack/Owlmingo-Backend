const axios = require('axios');
const Summary = require('../models/summary.model');
const { File } = require('../models/file.model');

const OLLAMA_API_URL = 'https://llm-system-product-name.tail973907.ts.net/api/generate';
const OLLAMA_TIMEOUT = 30000; // 30 seconds timeout

class SummaryService {
    static async generateSummaryFromText(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }

            const requestData = {
                prompt: `Generate a concise summary of the following text. The summary should:
                1. Capture the main ideas and key points
                2. Be well-structured and coherent
                3. Be around 2-3 paragraphs
                4. Maintain factual accuracy
                5. Use clear, professional language

                Text to summarize:
                ${text}

                Important: You must respond with valid JSON in exactly this format:
                {
                    "title": "Brief descriptive title",
                    "content": "Generated summary text"
                }`,
                model: 'llama3.2:latest',  // Fixed model name
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

    // ... other existing methods ...
}

module.exports = SummaryService;
