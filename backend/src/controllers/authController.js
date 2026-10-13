import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OtpVerification from '../models/OtpVerification.js';
import { sendOtpEmail } from '../config/email.js';
import { sendWelcomeEmail } from '../services/emailService.js';

// Helper to sign JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'max_housekeeping_super_secret_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

// Helper to attach cookie
function sendTokenResponse(user, statusCode, res) {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  const userSafe = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    addresses: user.addresses || []
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    user: userSafe
  });
}

/**
 * Send 6-Digit Email OTP for New User Registration
 * POST /api/v1/auth/signup-otp
 */
export async function sendSignupOtp(req, res, next) {
  try {
    const { email, phone, name } = req.body;

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim().replace(/\D/g, '') : '';

    // Check if user already exists with this email or phone
    const existing = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(cleanPhone.length >= 10 ? [{ phone: cleanPhone }] : [])
      ]
    });

    if (existing) {
      const matchType = existing.email === cleanEmail ? 'Email address' : 'Mobile number';
      return res.status(400).json({
        success: false,
        message: `${matchType} is already registered. Please sign in or use different credentials.`
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpVerification.findOneAndUpdate(
      { email: cleanEmail },
      { code: otp, attempts: 0, expiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(cleanEmail, otp, name || 'Customer');

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Register / Create New User Account in MongoDB Atlas with Email OTP Verification
 * POST /api/v1/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, mobile number, and password.'
      });
    }

    if (!otp || !otp.trim() || otp.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the 6-digit email verification code.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Verify 6-digit Email OTP from OtpVerification
    const otpRecord = await OtpVerification.findOne({ email: cleanEmail });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification code found. Please request a new verification code.'
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (otpRecord.code !== otp.trim()) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email inbox and try again.'
      });
    }

    // OTP verified! Delete OTP record
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // Check if user already exists with this email or phone
    const existing = await User.findOne({
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone }
      ]
    });

    if (existing) {
      const matchType = existing.email === cleanEmail ? 'Email address' : 'Mobile number';
      return res.status(400).json({
        success: false,
        message: `${matchType} is already registered. Please sign in or use different credentials.`
      });
    }

    // Create user document in MongoDB Atlas
    const avatarUrl = User.generateDefaultAvatar(name);
    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: password,
      role: 'customer',
      authProvider: 'local',
      avatarUrl,
      emailVerified: true
    });

    await user.save();

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user).catch(err => {
      console.warn('Welcome email error:', err.message);
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
}

/**
 * Unified Login with Email/Phone & Password
 * POST /api/v1/auth/login
 */
export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/phone and password.'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: identifier.trim() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with these details.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
}

/**
 * Request 6-digit Email OTP
 * POST /api/v1/auth/request-otp
 */
export async function requestOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Create user placeholder for OTP signup
      const defaultAvatar = User.generateDefaultAvatar(cleanEmail);
      user = new User({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: `otp_${Date.now()}_${Math.floor(Math.random() * 1000)}`, // temporary until phone set
        role: 'customer',
        authProvider: 'local',
        avatarUrl: defaultAvatar
      });
    }

    user.otpSecret = {
      code: otp,
      expiresAt,
      attempts: 0
    };
    await user.save();

    // Send email via Nodemailer
    await sendOtpEmail(cleanEmail, otp);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify Email OTP & Login / Register
 * POST /api/v1/auth/verify-otp
 */
export async function verifyOtp(req, res, next) {
  try {
    const { email, code, name, phone } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.otpSecret || !user.otpSecret.code) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification found. Please request a new code.'
      });
    }

    if (new Date() > new Date(user.otpSecret.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    if (user.otpSecret.code !== code.trim()) {
      user.otpSecret.attempts = (user.otpSecret.attempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check and try again.'
      });
    }

    // OTP is valid
    user.otpSecret = { code: null, expiresAt: null, attempts: 0 };
    user.emailVerified = true;

    if (name && name.trim()) user.name = name.trim();
    if (phone && phone.trim() && user.phone.startsWith('otp_')) {
      user.phone = phone.trim();
    }

    if (!user.avatarUrl) {
      user.avatarUrl = User.generateDefaultAvatar(user.name || user.email);
    }

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
}

/**
 * Google OAuth Login / Sync
 * POST /api/v1/auth/google
 */
export async function googleLogin(req, res, next) {
  try {
    let { email, name, avatarUrl, googleId, credential } = req.body;

    // Decode Google JWT ID token if credential is provided by Google Identity Services
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          // Google JWT payload uses RFC 7519 base64url encoding
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
          const googleUser = JSON.parse(payloadJson);
          email = googleUser.email || email;
          name = googleUser.name || name;
          avatarUrl = googleUser.picture || avatarUrl;
          googleId = googleUser.sub || googleId;
        }
      } catch (err) {
        console.warn('[Google Auth] Could not decode credential payload:', err.message);
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required from Google sign-in.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = new User({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: `g_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        role: 'customer',
        authProvider: 'google',
        avatarUrl: avatarUrl || User.generateDefaultAvatar(name || cleanEmail),
        emailVerified: true
      });
    } else {
      // Sync Google profile photo if user was created or logged in via Google
      if (avatarUrl && (!user.avatarUrl || user.authProvider === 'google')) {
        user.avatarUrl = avatarUrl;
      }
      user.authProvider = 'google';
      user.emailVerified = true;
    }

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
}

/**
 * Get Current User Profile + Saved Addresses
 * GET /api/v1/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -otpSecret');
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout
 * POST /api/v1/auth/logout
 */
export async function logout(req, res) {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}

/**
 * Add or Update Saved Address
 * POST /api/v1/auth/addresses
 */
export async function addAddress(req, res, next) {
  try {
    const { label, line1, landmark, city, state, pincode, isDefault } = req.body;

    if (!line1 || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Street address, city, and pincode are required.'
      });
    }

    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    const newAddress = {
      label: label || 'Home',
      line1: line1.trim(),
      landmark: landmark ? landmark.trim() : '',
      city: city.trim(),
      state: state ? state.trim() : 'Uttar Pradesh',
      pincode: pincode.trim(),
      isDefault: Boolean(isDefault) || user.addresses.length === 0
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Saved Address
 * DELETE /api/v1/auth/addresses/:id
 */
export async function deleteAddress(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address removed successfully.',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Forgot Password - Send OTP to email
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpSecret = {
      code: otp,
      expiresAt,
      attempts: 0
    };
    await user.save();

    await sendOtpEmail(cleanEmail, otp, user.name);

    res.status(200).json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${cleanEmail}.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset Password using 6-Digit OTP
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code, and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.otpSecret || !user.otpSecret.code) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found. Please request a new code.'
      });
    }

    if (new Date() > new Date(user.otpSecret.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (user.otpSecret.code !== code.trim()) {
      user.otpSecret.attempts = (user.otpSecret.attempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check and try again.'
      });
    }

    // Code is valid: set new password
    user.passwordHash = newPassword; // Pre-save hook will hash it with bcrypt
    user.otpSecret = { code: null, expiresAt: null, attempts: 0 };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Change Password (for logged in user)
 * PUT /api/v1/auth/change-password
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // If user has an existing passwordHash, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your current password.'
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }
    }

    user.passwordHash = newPassword; // Pre-save hook will hash it
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export default {
  sendSignupOtp,
  register,
  login,
  requestOtp,
  verifyOtp,
  googleLogin,
  getMe,
  logout,
  addAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
  changePassword
};
