import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail } from '../config/email.js';

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
    const { email, name, avatarUrl, googleId } = req.body;

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

export default {
  login,
  requestOtp,
  verifyOtp,
  googleLogin,
  getMe,
  logout,
  addAddress,
  deleteAddress
};
