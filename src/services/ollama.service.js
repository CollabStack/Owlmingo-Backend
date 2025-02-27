const axios = require('axios');

const OLLAMA_API_URL = 'https://llm-system.tail973907.ts.net/api/generate';

exports.generateQuiz = async (extractedText) => {
  try {
    const requestData = {
      prompt: `You are a professional quiz generator. Create a quiz with a title and multiple-choice questions based on the provided text.

Rules:
1. Generate a descriptive and engaging quiz title
2. Generate 5-10 meaningful questions
3. Each question must have exactly 4 options
4. Only one option should be correct
5. Questions should test understanding, not just memory
6. Use clear, concise language
7. Options should be plausible and related to the topic
8. Distribute correct answers randomly among options

Example of expected JSON format:
{
  "title": "Engaging Quiz Title Related to Content",
  "questions": [
    {
      "question": "Clear, specific question text?",
      "options": [
        {"text": "Correct answer", "isCorrect": true},
        {"text": "Plausible wrong answer", "isCorrect": false},
        {"text": "Another wrong but reasonable option", "isCorrect": false},
        {"text": "Different but related wrong answer", "isCorrect": false}
      ]
    }
  ]
}

Content to create quiz from:
${extractedText}

Return ONLY valid JSON in the specified format, no other text or explanation.`,
      model: 'llama3.2:latest',
      stream: false,
      temperature: 0.7, // Add some creativity but maintain coherence
      top_p: 0.9, // Maintain good quality while allowing some variation
      format: 'json'
    };

    const response = await axios.post(OLLAMA_API_URL, requestData, {
      headers: { 'Content-Type': 'application/json' }
    });

    let quizData;
    try {
      // First try to parse the direct response
      quizData = JSON.parse(response.data.response);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from response');
      }
    }

    // Validate the quiz data structure
    if (!quizData || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz data structure');
    }

    // Ensure each question has the required format
    quizData.questions = quizData.questions.map(q => ({
      question: q.question,
      options: Array.isArray(q.options) ? q.options : []
    })).filter(q => q.question && q.options.length > 0);

    if (quizData.questions.length === 0) {
      throw new Error('No valid questions generated');
    }

    // Add title validation
    if (!quizData.title) {
      quizData.title = 'Generated Quiz'; // Default title if none provided
    }

    return quizData;
  } catch (error) {
    console.error('Ollama service error:', error);
    throw new Error('Error generating quiz: ' + (error.response?.data || error.message));
  }
};
