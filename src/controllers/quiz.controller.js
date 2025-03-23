const Question = require('../models/quiz.model');
const Answer = require('../models/answer.model');
const { File } = require('../models/file.model'); // Updated import
const ollamaService = require('../services/ollama.service');
const { v4: uuidv4 } = require('uuid');
const Quiz = require('../models/quiz.model');
const QuizSession = require('../models/quiz.session.model'); // Add this import

// Function to create a new question
exports.createQuestion = async (req, res) => {
  try {
    const { quiz_id, questions } = req.body;
    
    // Find the existing quiz
    const quiz = await Quiz.findOne({ quiz_id });
    
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Add new questions to the existing questions array
    quiz.questions.push(...questions);
    
    // Save the updated quiz
    await quiz.save();

    // Format the response
    const formattedQuestions = quiz.questions.map((q, index) => ({
      questionIndex: index,
      question: q.question,
      options: q.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        isCorrect: opt.isCorrect
      }))
    }));

    res.status(201).send({
      quizId: quiz.quiz_id,
      title: quiz.quiz_title,
      totalQuestions: quiz.questions.length,
      questions: formattedQuestions
    });
  } catch (error) {
    res.status(400).send({ message: 'Error creating questions', error: error.message });
  }
};



// Function to generate quiz questions from extracted text using Ollama
exports.generateQuiz = async (req, res) => {
  try {
    // Check if request is properly formatted
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send({ 
        message: 'Request body is missing or empty',
        hint: 'Make sure you\'re sending a POST request with Content-Type: application/json and the fileOcrId in the request body' 
      });
    }
    
    const { fileOcrId } = req.body;
    if (!fileOcrId) {
      return res.status(400).send({ message: 'FileOcrId is required' });
    }

    // Fetch the File document
    const fileOcr = await File.findById(fileOcrId);
    if (!fileOcr) {
      return res.status(404).send({ message: 'File not found' });
    }

    // Check if the file belongs to the requesting user
    if (fileOcr.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized access to this file' });
    }

    // Use the data field from the file document
    if (!fileOcr.data) {
      return res.status(400).send({ message: 'No text content found in file' });
    }

    const generatedQuiz = await ollamaService.generateQuiz(fileOcr.data);

    const quizId = uuidv4();

    // Create a single quiz document with all questions
    const quiz = new Quiz({
      quiz_id: quizId,
      quiz_title: generatedQuiz.title || 'Generated Quiz',
      source: {
        fileOcrId,
        extractedTextSegment: fileOcr.data
      },
      questions: generatedQuiz.questions,
      created_by: req.user._id
    });

    await quiz.save();

    // Create a new quiz session
    const quizSession = new QuizSession({
      _id: quizId,
      user: {
        _id: req.user._id,
        name: req.user.username
      },
      source: {
        fileOcrId: fileOcr._id,
        fileName: fileOcr.metadata?.originalFileName,
        fileType: fileOcr.type
      },
      quiz: {
        totalQuestions: generatedQuiz.questions.length,
        answeredCount: 0,
        correctCount: 0,
        score: 0
      },
      status: 'not_started'
    });

    await quizSession.save();

    // Check for test mode (either development or explicitly requested)
    const isTestMode = process.env.NODE_ENV === 'development' || req.query.testMode === 'true';

    // Format questions for response
    const formattedQuestions = quiz.questions.map((q, index) => ({
      questionIndex: index,
      question: q.question,
      options: q.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        ...(isTestMode && { isCorrect: opt.isCorrect })
      }))
    }));

    res.status(201).send({
      quizId,
      title: quiz.quiz_title,
      questionCount: quiz.questions.length,
      fileType: fileOcr.type,
      fileName: fileOcr.metadata?.originalFileName,
      questions: formattedQuestions,
      session: {
        status: quizSession.status,
        progress: quizSession.progress,
        startedAt: quizSession.startedAt
      }
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).send({ message: 'Failed to generate quiz', error: error.message });
  }
};

// Function to get questions by quizId
exports.getQuestionsByQuizId = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findOne({ quiz_id: quizId });
    
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Check for test mode (either development or explicitly requested)
    const isTestMode = process.env.NODE_ENV === 'development' || req.query.testMode === 'true';

    const formattedQuestions = quiz.questions.map((q, index) => ({
      questionIndex: index,
      question: q.question,
      options: q.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        // Only send isCorrect in development environment or test mode
        ...(isTestMode && { isCorrect: opt.isCorrect })
      }))
    }));

    res.status(200).send({
      quizId: quiz.quiz_id,
      title: quiz.quiz_title,
      totalQuestions: quiz.questions.length,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Error fetching questions', error: error.message });
  }
};

// Function to get user's quiz sessions
exports.getUserQuizSessions = async (req, res) => {
  try {
    const { status, sort = '-startedAt' } = req.query;
    
    let query = { 'user._id': req.user._id };
    if (status) {
      query.status = status;
    }

    const sessions = await QuizSession.find(query)
      .sort(sort)
      .select('-progress.answers');

    res.status(200).send({
      count: sessions.length,
      sessions: sessions
    });
  } catch (error) {
    res.status(500).send({ 
      message: 'Error fetching quiz sessions', 
      error: error.message 
    });
  }
};

// Function to get specific quiz session
exports.getQuizSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await QuizSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).send({ message: 'Quiz session not found' });
    }

    // Ensure user can only access their own sessions
    if (session.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized access to this quiz session' });
    }

    res.status(200).send(session);
  } catch (error) {
    res.status(500).send({ 
      message: 'Error fetching quiz session', 
      error: error.message 
    });
  }
};


// Add this with other controller functions

exports.submitAnswer = async (req, res) => {
  try {
    const { quiz_id, question_index, selected_option } = req.body;
    
    // Find the quiz
    const quiz = await Quiz.findOne({ quiz_id });
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Get the question
    const question = quiz.questions[question_index];
    if (!question) {
      return res.status(404).send({ message: 'Question not found' });
    }

    // Check if the selected option is correct
    const selectedOptionObj = question.options.find(opt => opt._id.toString() === selected_option);
    if (!selectedOptionObj) {
      return res.status(400).send({ message: 'Invalid option selected' });
    }

    // Find or create quiz session
    let quizSession = await QuizSession.findById(quiz_id);
    if (!quizSession) {
      return res.status(404).send({ message: 'Quiz session not found' });
    }

    // Update quiz session progress
    quizSession.updateProgress(
      question_index, 
      selected_option, 
      selectedOptionObj.isCorrect
    );

    // Calculate new score
    quizSession.quiz.score = (quizSession.quiz.correctCount / quizSession.quiz.totalQuestions) * 100;

    // Update status if all questions are answered
    if (quizSession.quiz.answeredCount === quizSession.quiz.totalQuestions) {
      quizSession.status = 'completed';
      quizSession.completedAt = new Date();
    } else {
      quizSession.status = 'in_progress';
    }

    await quizSession.save();

    // Create answer record
    const answer = new Answer({
      user_id: req.user._id,
      quiz_id: quiz_id,
      question_index: question_index,
      selected_options: [selected_option],
      is_correct: selectedOptionObj.isCorrect
    });

    await answer.save();

    // Check for test mode (either development or explicitly requested)
    const isTestMode = process.env.NODE_ENV === 'development' || req.query.testMode === 'true';

    res.status(200).send({
      success: true,
      isCorrect: selectedOptionObj.isCorrect,
      correctOption: isTestMode ? question.options.find(opt => opt.isCorrect)._id : undefined,
      progress: {
        answeredCount: quizSession.quiz.answeredCount,
        correctCount: quizSession.quiz.correctCount,
        score: quizSession.quiz.score,
        status: quizSession.status
      }
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).send({ 
      message: 'Error submitting answer', 
      error: error.message 
    });
  }
};

// Function to get quiz answers
exports.getQuizAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Find all answers for this quiz
    const answers = await Answer.find({ 
      quiz_id: quizId,
      user_id: req.user._id 
    }).sort({ question_index: 1 });

    // Get the quiz for additional context
    const quiz = await Quiz.findOne({ quiz_id: quizId });
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Format the response
    const formattedAnswers = answers.map(answer => ({
      questionIndex: answer.question_index,
      question: quiz.questions[answer.question_index].question,
      selectedOptions: answer.selected_options,
      isCorrect: answer.is_correct,
      submittedAt: answer.createdAt
    }));

    res.status(200).send({
      quizId,
      title: quiz.quiz_title,
      totalQuestions: quiz.questions.length,
      answeredQuestions: answers.length,
      correctAnswers: answers.filter(a => a.is_correct).length,
      answers: formattedAnswers
    });

  } catch (error) {
    console.error('Get quiz answers error:', error);
    res.status(500).send({ 
      message: 'Error fetching quiz answers', 
      error: error.message 
    });
  }
};

// Function to update a question

exports.updateQuestion = async (req, res) => {
  try {
    const { quizId, questionIndex } = req.params;
    const { question, options } = req.body;
    
    // Find the quiz
    const quiz = await Quiz.findOne({ quiz_id: quizId });
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Check if user owns the quiz
    if (quiz.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized to edit this quiz' });
    }

    // Validate question index
    if (questionIndex >= quiz.questions.length) {
      return res.status(404).send({ message: 'Question not found' });
    }

    // Validate options format
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).send({ message: 'Must provide exactly 4 options' });
    }

    if (!options.some(opt => opt.isCorrect)) {
      return res.status(400).send({ message: 'Must have exactly one correct option' });
    }

    // Update the question
    quiz.questions[questionIndex] = {
      question,
      options: options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect
      }))
    };

    await quiz.save();

    // Check for test mode (either development or explicitly requested)
    const isTestMode = process.env.NODE_ENV === 'development' || req.query.testMode === 'true';

    // Format response
    const updatedQuestion = {
      questionIndex: parseInt(questionIndex),
      question: quiz.questions[questionIndex].question,
      options: quiz.questions[questionIndex].options.map(opt => ({
        id: opt._id,
        text: opt.text,
        ...(isTestMode && { isCorrect: opt.isCorrect })
      }))
    };

    res.status(200).send({
      success: true,
      question: updatedQuestion
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).send({ 
      message: 'Error updating question', 
      error: error.message 
    });
  }
};

//Update quiz title
exports.updateQuizTitle = async (req, res) => {
  try {
    // Get quizId from URL params and new title from request body
    const { quizId } = req.params;
    const { title } = req.body;

    // Title validation
    if (!title || title.trim().length === 0) {
      return res.status(400).send({ 
        message: 'Quiz title cannot be empty' 
      });
    }

    // Find quiz by ID
    const quiz = await Quiz.findOne({ quiz_id: quizId });
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Authorization check
    if (quiz.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).send({ 
        message: 'Unauthorized to edit this quiz' 
      });
    }

    // Update title and save
    quiz.quiz_title = title;
    await quiz.save();

    // Send success response
    res.status(200).send({
      success: true,
      quiz: {
        quizId: quiz.quiz_id,
        title: quiz.quiz_title
      }
    });

  } catch (error) {
    // Error handling
    console.error('Update quiz title error:', error);
    res.status(500).send({ 
      message: 'Error updating quiz title', 
      error: error.message 
    });
  }
};
// Function to get quiz review
exports.getQuizReview = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Get the quiz
    const quiz = await Quiz.findOne({ quiz_id: quizId });
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Get user's answers for this quiz
    const answers = await Answer.find({ 
      quiz_id: quizId,
      user_id: req.user._id 
    }).sort({ question_index: 1 });

    // Get quiz session for progress info
    const quizSession = await QuizSession.findById(quizId);
    if (!quizSession) {
      return res.status(404).send({ message: 'Quiz session not found' });
    }

    // Map questions with user answers
    const reviewData = quiz.questions.map((question, index) => {
      const userAnswer = answers.find(a => a.question_index === index);
      
      return {
        questionIndex: index,
        question: question.question,
        options: question.options.map(opt => ({
          id: opt._id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          isSelected: userAnswer?.selected_options.includes(opt._id.toString())
        })),
        isAnswered: !!userAnswer,
        isCorrect: userAnswer?.is_correct || false,
        submittedAt: userAnswer?.createdAt
      };
    });

    res.status(200).send({
      quizId,
      title: quiz.quiz_title,
      progress: {
        totalQuestions: quiz.questions.length,
        answeredQuestions: quizSession.quiz.answeredCount,
        correctAnswers: quizSession.quiz.correctCount,
        score: quizSession.quiz.score,
        status: quizSession.status,
        startedAt: quizSession.startedAt,
        completedAt: quizSession.completedAt
      },
      questions: reviewData
    });
  } catch (error) {
    console.error('Get quiz review error:', error);
    res.status(500).send({ 
      message: 'Error fetching quiz review', 
      error: error.message 
    });
  }
};

// Function to get a quiz with all answers (for development/testing)
exports.getQuizWithAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findOne({ quiz_id: quizId });
    
    if (!quiz) {
      return res.status(404).send({ message: 'Quiz not found' });
    }

    // Format questions with correct answers always visible
    const formattedQuestions = quiz.questions.map((q, index) => ({
      questionIndex: index,
      question: q.question,
      options: q.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        isCorrect: opt.isCorrect
      }))
    }));

    res.status(200).send({
      quizId: quiz.quiz_id,
      title: quiz.quiz_title,
      totalQuestions: quiz.questions.length,
      questions: formattedQuestions,
      note: "This endpoint is for development and testing purposes only"
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Error fetching questions with answers', error: error.message });
  }
};