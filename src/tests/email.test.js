require('dotenv').config();
const { sendOtpEmail } = require('../utils/email.util');
const config = require('../config/app.config');

async function testEmailConfiguration() {
  try {
    console.log('Testing email configuration...');
    console.log('Config:', {
      email_user: config.email_user,
      email_pass_exists: !!config.email_pass
    });
    
    if (!config.email_user || !config.email_pass) {
      throw new Error('Email configuration is missing in .env file');
    }

    await sendOtpEmail(config.email_user, '123456');
    console.log('Email test successful!');
  } catch (error) {
    console.error('Email test failed:', error.message);
    process.exit(1);
  }
}

testEmailConfiguration();
