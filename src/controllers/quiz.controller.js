const Question = require('../models/quiz.model');
const Answer = require('../models/answer.model');
const { FileOcr } = require('../models/user/file_ocr.model');
const ollamaService = require('../services/ollama.service');
const { v4: uuidv4 } = require('uuid');
const Quiz = require('../models/quiz.model');

// Function to create a new question
exports.createQuestion = async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).send(question);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Function to get all questions
exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).send(questions);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Function to generate quiz questions from extracted text using Ollama
exports.generateQuiz = async (req, res) => {
  try {
    const { fileOcrId } = req.body;
    if (!fileOcrId) {
      return res.status(400).send({ message: 'FileOcrId is required' });
    }

    // Fetch the FileOcr document
    const fileOcr = await FileOcr.findById(fileOcrId);
    if (!fileOcr) {
      return res.status(404).send({ message: 'FileOcr not found' });
    }

    // Check if the file belongs to the requesting user
    if (fileOcr.userId.toString() !== req.user._id.toString()) {
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
      questions: formattedQuestions
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
    const questions = await Question.find({ quiz_id: quizId });
    
    if (!questions || questions.length === 0) {
      return res.status(404).send({ message: 'No questions found for this quiz' });
    }

    const formattedQuestions = questions.map(q => ({
      questionId: q._id,
      question: q.question,
      options: q.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        // Only send isCorrect in development environment
        ...(process.env.NODE_ENV === 'development' && { isCorrect: opt.isCorrect })
      }))
    }));

    res.status(200).send({
      quizId,
      title: questions[0]?.quiz_title || 'Generated Quiz',
      totalQuestions: questions.length,
      questions: formattedQuestions
    });
  } catch (error) {
    res.status(500).send({ message: 'Error fetching questions', error: error.message });
  }
};

// Function to create a new answer
exports.createAnswer = async (req, res) => {
  try {
    const answer = new Answer(req.body);
    await answer.save();
    res.status(201).send(answer);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Function to get all answers
exports.getAnswers = async (req, res) => {
  try {
    const answers = await Answer.find();
    res.status(200).send(answers);
  } catch (error) {
    res.status(500).send(error);
  }
};
