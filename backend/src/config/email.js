import nodemailer from 'nodemailer';

let transporter = null;

// Defensive resolver for createTransport across ESM, CommonJS, and bundled environments
const resolveCreateTransport = () => {
  if (typeof nodemailer?.createTransport === 'function') {
    return nodemailer.createTransport.bind(nodemailer);
  }
  if (typeof nodemailer?.default?.createTransport === 'function') {
    return nodemailer.default.createTransport.bind(nodemailer.default);
  }
  if (typeof nodemailer === 'function') {
    return nodemailer;
  }
  return null;
};

export const getEmailTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Email Warning] EMAIL_USER or EMAIL_APP_PASSWORD not set. Emails will log to console in development mode.');
    return null;
  }

  const createTransportFn = resolveCreateTransport();
  if (!createTransportFn) {
    console.error('[Email Error] nodemailer.createTransport is not available.');
    return null;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const isSecure = process.env.SMTP_SECURE === 'true' || port == 465;

  const transportConfig = host
    ? {
        host,
        port: port ? parseInt(port, 10) : 587,
        secure: isSecure,
        auth: { user, pass }
      }
    : {
        service: 'gmail',
        auth: {
          user,
          pass // 16-character Gmail App Password
        }
      };

  try {
    transporter = createTransportFn(transportConfig);
    return transporter;
  } catch (err) {
    console.error('[Email Error] Failed to initialize email transporter:', err.message);
    return null;
  }
};

export const sendOTPVerificationEmail = async ({ toEmail, otpCode, userName, purpose = 'verification' }) => {
  const mailer = getEmailTransporter();
  
  const isForgot = purpose === 'password_reset' || purpose === 'forgot';
  const isSignup = purpose === 'signup';
  
  let actionTitle = 'Account Verification Code';
  let actionDescription = 'complete your login or account verification:';
  let subject = `Your Max Housekeeping Verification Code: ${otpCode}`;

  if (isForgot) {
    actionTitle = 'Password Reset Code';
    actionDescription = 'reset your Max Housekeeping account password:';
    subject = `Your Max Housekeeping Password Reset Code: ${otpCode}`;
  } else if (isSignup) {
    actionTitle = 'Confirm Your Registration';
    actionDescription = 'verify your email address and activate your customer account:';
    subject = `Your Max Housekeeping Sign Up Code: ${otpCode}`;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #F4EFE6; border-radius: 16px; color: #10231D;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #10231D;">Max Housekeeping Service</h2>
        <p style="margin: 4px 0 0; font-size: 14px; color: #3D524A;">Professional Cleaning Across Western Uttar Pradesh</p>
      </div>
      <div style="background-color: #FFFFFF; border-radius: 12px; padding: 28px; box-shadow: 0 4px 12px rgba(16, 35, 29, 0.05); text-align: center;">
        <span style="display: inline-block; padding: 4px 12px; background-color: #F4EFE6; border-radius: 999px; font-size: 12px; font-weight: 700; color: #10231D; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${actionTitle}
        </span>
        <p style="margin: 0 0 16px; font-size: 16px; color: #10231D;">Hello ${userName || 'there'},</p>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #3D524A;">Use the following single-use verification code to ${actionDescription}</p>
        <div style="display: inline-block; padding: 14px 28px; background-color: #DDEBE4; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #10231D; margin-bottom: 24px;">
          ${otpCode}
        </div>
        <p style="margin: 0; font-size: 13px; color: #6B8077;">This code is valid for 10 minutes. ${isForgot ? 'If you did not request a password reset, you can safely ignore this email.' : 'Please do not share this code with anyone.'}</p>
      </div>
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #6B8077;">
        &copy; ${new Date().getFullYear()} Max Housekeeping Service. All rights reserved.
      </div>
    </div>
  `;

  if (!mailer) {
    console.log(`[Email OTP Simulator] (${purpose.toUpperCase()}) To: ${toEmail} | Code: ${otpCode}`);
    return { success: true, simulated: true };
  }

  try {
    const sender = process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `"Max Housekeeping Service" <${process.env.EMAIL_USER}>` : '"Max Housekeeping Service" <contactmaxhousekeepingservice@gmail.com>');
    const info = await mailer.sendMail({
      from: sender,
      to: toEmail,
      subject,
      html
    });
    console.log(`[Email] OTP sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed sending OTP to ${toEmail}:`, err.message);
    throw new Error(`Failed to deliver verification email. Please verify SMTP credentials or try again.`);
  }
};

export const sendOtpEmail = async (toEmail, otpCode, userName, purpose = 'verification') => {
  return sendOTPVerificationEmail({ toEmail, otpCode, userName, purpose });
};

export default {
  getEmailTransporter,
  sendOTPVerificationEmail,
  sendOtpEmail
};
