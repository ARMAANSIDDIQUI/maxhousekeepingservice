import dotenv from 'dotenv';
dotenv.config();

import { getEmailTransporter, sendOTPVerificationEmail, sendOtpEmail } from '../src/config/email.js';
import {
  sendContactConfirmationToUser,
  sendContactNotificationToAdmin,
  sendPasswordResetSuccessEmail,
  sendWelcomeEmail
} from '../src/services/emailService.js';

async function runTests() {
  console.log('--- 1. Testing Transporter Initialization ---');
  const transporter = getEmailTransporter();
  console.log('Transporter initialized:', transporter ? 'REAL TRANSPORTER READY' : 'SIMULATION MODE (Credentials not set or dev)');

  console.log('\n--- 2. Testing OTP Verification Email (Sign Up) ---');
  const signupResult = await sendOTPVerificationEmail({
    toEmail: 'test_user@example.com',
    otpCode: '123456',
    userName: 'Test User',
    purpose: 'signup'
  });
  console.log('Signup OTP Email Result:', signupResult);

  console.log('\n--- 3. Testing OTP Verification Email (Forgot Password) ---');
  const forgotResult = await sendOTPVerificationEmail({
    toEmail: 'test_user@example.com',
    otpCode: '654321',
    userName: 'Test User',
    purpose: 'password_reset'
  });
  console.log('Forgot Password OTP Email Result:', forgotResult);

  console.log('\n--- 4. Testing Password Reset Success Security Notification ---');
  const resetSuccessResult = await sendPasswordResetSuccessEmail({
    toEmail: 'test_user@example.com',
    userName: 'Test User'
  });
  console.log('Password Reset Success Notice Result:', resetSuccessResult);

  console.log('\n--- 5. Testing Contact Form Inquiries (2 Mails: Admin & Inquirer) ---');
  const mockContact = {
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya.sharma@example.com',
    subject: '3 BHK Deep Cleaning Query',
    message: 'I need deep cleaning for my 3 BHK apartment in Moradabad next Saturday.'
  };

  const adminNoticeResult = await sendContactNotificationToAdmin({ contact: mockContact });
  console.log('1. Admin Notification Mail Result:', adminNoticeResult);

  const userConfirmationResult = await sendContactConfirmationToUser({ contact: mockContact });
  console.log('2. User Confirmation Mail Result:', userConfirmationResult);

  console.log('\n--- 6. Testing Contact Form Inquiry without Email (Fallback) ---');
  const mockPhoneOnlyContact = {
    name: 'Amit Kumar',
    phone: '9897766002',
    email: '',
    subject: 'Commercial Office Cleaning',
    message: 'Need quote for 2500 sqft office.'
  };

  const phoneOnlyAdminResult = await sendContactNotificationToAdmin({ contact: mockPhoneOnlyContact });
  console.log('Admin Notification (Phone-only) Result:', phoneOnlyAdminResult);

  const phoneOnlyUserResult = await sendContactConfirmationToUser({ contact: mockPhoneOnlyContact });
  console.log('User Confirmation (Phone-only) Result:', phoneOnlyUserResult);

  console.log('\nALL UNIT / FUNCTIONAL TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
