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
    const { fileOcrId } = req.body;
    if (!fileOcrId) {
      return res.status(400).send({ message: 'FileOcrId is required' });
    }

    // Fetch the File document (correct model import)
    const fileOcr = await File.findById(fileOcrId);
    if (!fileOcr) {
      return res.status(404).send({ message: 'File not found' });
    }

    // Check if the file belongs to the requesting user using correct field name
    if (fileOcr.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized access to this file' });
    }

    const generatedQuiz = await ollamaService.generateQuiz(fileOcr.extractedText);
    const quizId = uuidv4();

    // Create a single quiz document with all questions
    const quiz = new Quiz({
      quiz_id: quizId,
      quiz_title: generatedQuiz.title || 'Generated Quiz',
      source: {
        fileOcrId,
        extractedTextSegment: fileOcr.extractedText
      },
      questions: generatedQuiz.questions,
      created_by: req.user._id
    });

    await quiz.save();

    // Create a new quiz session
    const quizSession = new QuizSession({
      _id: quizId, // Use the same UUID as the quiz
      user: {
        _id: req.user._id,
        name: req.user.username
      },
      source: {
        fileOcrId: fileOcr._id,
        fileName: fileOcr.metadata?.originalFileName,
        fileType: fileOcr.fileType
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

    // Format questions for response
    const formattedQuestions = quiz.questions.map((q, index) => ({
      questionIndex: index,
      question: q.question,
      options: q.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        ...(process.env.NODE_ENV === 'development' && { isCorrect: opt.isCorrect })
      }))
    }));

    res.status(201).send({
      quizId,
      title: quiz.quiz_title,
      questionCount: quiz.questions.length,
      fileType: fileOcr.fileType,
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

    const formattedQuestions = quiz.questions.map((q, index) => ({
      questionIndex: index,
      question: q.question,
      options: q.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        // Only send isCorrect in development environment
        ...(process.env.NODE_ENV === 'development' && { isCorrect: opt.isCorrect })
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

    res.status(200).send({
      success: true,
      isCorrect: selectedOptionObj.isCorrect,
      correctOption: process.env.NODE_ENV === 'development' ? 
        question.options.find(opt => opt.isCorrect)._id : undefined,
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