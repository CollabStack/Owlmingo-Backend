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
    await transporter.verify();
    
    const mailOptions = {
      from: `Owlmingo <${config.email_user}>`,
      to,
      subject: '🦉 Welcome to Owlmingo - Verify Your Email',
      html: `
        <div style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #2D3748; background-color: #F0F9FF;">
          <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0284C7; margin: 0 0 16px; font-size: 28px; font-weight: 700;">Welcome to Your Learning Journey! 🎓</h1>
              <div style="width: 80px; height: 4px; background: linear-gradient(90deg, #0EA5E9 0%, #38BDF8 100%); margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center; color: #475569;">
              We're excited to have you join the Owlmingo community!
            </p>

            <div style="background: linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%); border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
              <p style="color: white; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; opacity: 0.9;">Your Verification Code</p>
              <h2 style="color: white; font-size: 36px; letter-spacing: 6px; margin: 0; font-weight: 700;">${otp}</h2>
              <p style="color: white; font-size: 14px; margin: 12px 0 0; opacity: 0.9;">⏳ Code expires in 3 minutes</p>
            </div>

            <div style="background-color: #F0F9FF; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <p style="color: #0284C7; font-weight: 600; margin: 0 0 12px;">Quick Steps:</p>
              <ol style="color: #475569; margin: 0; padding-left: 24px;">
                <li style="margin-bottom: 8px;">Copy your verification code</li>
                <li style="margin-bottom: 8px;">Return to Owlmingo</li>
                <li style="margin-bottom: 0;">Paste the code to verify your account</li>
              </ol>
            </div>

            <div style="border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 32px; text-align: center;">
              <p style="color: #64748B; font-size: 13px; margin-bottom: 16px;">
                🔒 This is a secure, automated message.<br>
                For security, please don't forward this email.
              </p>
              <p style="color: #64748B; font-size: 13px; margin-bottom: 16px;">
                © ${new Date().getFullYear()} Owlmingo. All rights reserved.
              </p>
              <div>
                <a href="#" style="color: #0284C7; text-decoration: none; font-size: 13px; margin: 0 12px;">Help Center</a>
                <a href="#" style="color: #0284C7; text-decoration: none; font-size: 13px; margin: 0 12px;">Privacy</a>
                <a href="#" style="color: #0284C7; text-decoration: none; font-size: 13px; margin: 0 12px;">Terms</a>
              </div>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to Your Learning Journey! 🎓

We're excited to have you join the Owlmingo community! Just one more step to unlock a world of knowledge.

Your Verification Code: ${otp}
⏳ Code expires in 10 minutes

Quick Steps:
1. Copy your verification code
2. Return to Owlmingo
3. Paste the code to verify your account

🔒 This is a secure, automated message.
For security, please don't forward this email.

© ${new Date().getFullYear()} Owlmingo. All rights reserved.

Help Center Privacy Terms`
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

exports.sendResetPasswordEmail = async (to, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `Owlmingo <${config.email_user}>`,
      to,
      subject: 'Owlmingo Password Reset Request',
      html: `
        <div style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #2D3748; background-color: #F0F9FF;">
          <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0284C7; margin: 0 0 16px; font-size: 28px; font-weight: 700;">Reset Your Password 🍀</h1>
              <div style="width: 80px; height: 4px; background: linear-gradient(90deg, #0EA5E9 0%, #38BDF8 100%); margin: 0 auto;"></div>
            </div>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center; color: #475569;">
              We received a request to reset your password. Use the code below to proceed securely.
            </p>

            <div style="background: linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%); border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
              <p style="color: white; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; opacity: 0.9;">Password Reset Code</p>
              <h2 style="color: white; font-size: 36px; letter-spacing: 6px; margin: 0; font-weight: 700;">${otp}</h2>
              <p style="color: white; font-size: 14px; margin: 12px 0 0; opacity: 0.9;">⏳ Code expires in 3 minutes</p>
            </div>

            <div style="background-color: #FEF2F2; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #EF4444;">
              <p style="color: #991B1B; margin: 0; font-size: 14px;">
                ⚠️ If you didn't request this password reset, please contact our support team immediately.
              </p>
            </div>

            <div style="background-color: #F0F9FF; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <p style="color: #0284C7; font-weight: 600; margin: 0 0 12px;">To Reset Your Password:</p>
              <ol style="color: #475569; margin: 0; padding-left: 24px;">
                <li style="margin-bottom: 8px;">Copy the reset code above</li>
                <li style="margin-bottom: 8px;">Return to the password reset page</li>
                <li style="margin-bottom: 0;">Enter the code and create your new password</li>
              </ol>
            </div>

            <div style="border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 32px; text-align: center;">
              <p style="color: #64748B; font-size: 13px; margin-bottom: 16px;">
                🔒 This is a secure, automated message.<br>
                For security, please don't forward this email.
              </p>
              <p style="color: #64748B; font-size: 13px; margin-bottom: 16px;">
                © ${new Date().getFullYear()} Owlmingo. All rights reserved.
              </p>
              <div>
                <a href="#" style="color: #0284C7; text-decoration: none; font-size: 13px; margin: 0 12px;">Help Center</a>
                <a href="#" style="color: #0284C7; text-decoration: none; font-size: 13px; margin: 0 12px;">Privacy</a>
                <a href="#" style="color: #0284C7; text-decoration: none; font-size: 13px; margin: 0 12px;">Terms</a>
              </div>
            </div>
          </div>
        </div>
      `,
      text: `Reset Your Password

No worries! We'll help you get back into your account.

Your Password Reset Code: ${otp}
⏳ Code expires in 10 minutes

To Reset Your Password:
1. Copy the reset code above
2. Return to the password reset page
3. Enter the code and create your new password

⚠️ If you didn't request this reset, please contact support immediately.

🔒 For security, please don't forward this email.

© ${new Date().getFullYear()} Owlmingo. All rights reserved.

Help Center Privacy Terms`
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw new Error(`Failed to send reset password email: ${error.message}`);
  }
};