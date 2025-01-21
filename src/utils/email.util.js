const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'owlmingo.official@gmail.com',
    pass: 'ahmp sssb bskx tnej'
  }
});

exports.sendOtpEmail = async (to, otp) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to Owlmingo! 🦉</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #3498db; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr>
      <p style="color: #7f8c8d; font-size: 12px;">This is an automated message, please do not reply.</p>
    </div>
  `;

  await transporter.sendMail({
    from: '"Owlmingo" <owlmingo.official@gmail.com>',
    to,
    subject: 'Verify Your Owlmingo Account',
    html: htmlContent,
    text: `Your verification code is: ${otp}. Valid for 10 minutes.`
  });
};