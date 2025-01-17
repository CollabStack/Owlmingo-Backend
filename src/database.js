const mongoose = require('mongoose');
const {mongoUri} = require('./config/app.config');

const connectDB = async () => {
  try {
    // Using MONGO_URI from the .env file
    await mongoose.connect(mongoUri);

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the process if DB connection fails
  }
};

module.exports = connectDB;
