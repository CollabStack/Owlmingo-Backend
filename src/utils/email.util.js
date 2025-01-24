const nodemailer = require('nodemailer');
const config = require('../config/app.config');

// Create reusable transporter
const createTransporter = () => {
  if (!config.email_user || !config.email_pass) {
    console.error('Email Config:', {
      user: config.email_user,
      passExists: !!config.email_pass
    });
    throw new Error('Email credentials are not configured');
  }

  return nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: config.email_user,
      pass: config.email_pass // This should be an app password
    },
    debug: true // Enable debug logging
  });
};

exports.sendOtpEmail = async (to, otp) => {
  try {
    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions = {
      from: `Owlmingo <${config.email_user}>`,
      to,
      subject: 'Verify Your Owlmingo Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Owlmingo! 🦉</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #3498db; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr>
          <p style="color: #7f8c8d; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
      text: `Your verification code is: ${otp}. Valid for 10 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Detailed email error:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};