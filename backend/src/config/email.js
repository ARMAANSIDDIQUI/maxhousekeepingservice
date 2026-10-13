import nodemailer from 'nodemailer';

let transporter = null;

export const getEmailTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Email Warning] EMAIL_USER or EMAIL_APP_PASSWORD not set. Emails will log to console in development mode.');
    return null;
  }

  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user,
      pass // 16-character Gmail App Password
    }
  });

  return transporter;
};

export const sendOTPVerificationEmail = async ({ toEmail, otpCode, userName }) => {
  const mailer = getEmailTransporter();
  const subject = `Your Max Housekeeping Verification Code: ${otpCode}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #F4EFE6; border-radius: 16px; color: #10231D;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #10231D;">Max House Keeping Service</h2>
        <p style="margin: 4px 0 0; font-size: 14px; color: #3D524A;">Professional Cleaning Across Western Uttar Pradesh</p>
      </div>
      <div style="background-color: #FFFFFF; border-radius: 12px; padding: 28px; box-shadow: 0 4px 12px rgba(16, 35, 29, 0.05); text-align: center;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #10231D;">Hello ${userName || 'there'},</p>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #3D524A;">Use the following single-use verification code to complete your login or account verification:</p>
        <div style="display: inline-block; padding: 14px 28px; background-color: #DDEBE4; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #10231D; margin-bottom: 24px;">
          ${otpCode}
        </div>
        <p style="margin: 0; font-size: 13px; color: #6B8077;">This code is valid for 10 minutes. Please do not share it with anyone.</p>
      </div>
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #6B8077;">
        &copy; ${new Date().getFullYear()} Max Housekeeping Service. All rights reserved.
      </div>
    </div>
  `;

  if (!mailer) {
    console.log(`[Email OTP Simulator] To: ${toEmail} | Code: ${otpCode}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"Max Housekeeping Service" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html
    });
    console.log(`[Email] OTP sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed sending OTP to ${toEmail}:`, err.message);
  }
};

export const sendOtpEmail = async (toEmail, otpCode, userName) => {
  return sendOTPVerificationEmail({ toEmail, otpCode, userName });
};

export default {
  getEmailTransporter,
  sendOTPVerificationEmail,
  sendOtpEmail
};
