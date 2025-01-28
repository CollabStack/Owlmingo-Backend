const { test, expect } = require('@jest/globals');
const { sendOtpEmail } = require('../../src/utils/email.util');
const config = require('../../src/config/app.config');

test('Email configuration should be valid', async () => {
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
  expect(true).toBe(true);
});