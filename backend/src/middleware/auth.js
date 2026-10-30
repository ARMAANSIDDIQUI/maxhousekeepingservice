import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Short-lived in-memory user cache (60 seconds TTL) for instant token validity checks without repeated DB round-trips
const AUTH_USER_CACHE_TTL_MS = 60 * 1000;
const authUserCache = new Map();

export function invalidateAuthUserCache(userId) {
  if (!userId) return;
  authUserCache.delete(String(userId));
}

async function resolveAuthenticatedUser(userId) {
  const key = String(userId);
  const now = Date.now();
  const cached = authUserCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const user = await User.findById(userId).select('-passwordHash -otpSecret');
  if (user && user.isActive !== false) {
    authUserCache.set(key, { user, expiresAt: now + AUTH_USER_CACHE_TTL_MS });
  } else {
    authUserCache.delete(key);
  }
  return user;
}

/**
 * Verify JWT token from cookie or Authorization header
 */
export async function verifyAuth(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'max_housekeeping_super_secret_jwt_key_2026');
    const user = await resolveAuthenticatedUser(decoded.id);

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Account not found, deactivated, or session expired.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
}

/**
 * Optional authentication: populates req.user if valid token exists, but doesn't block guests
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'max_housekeeping_super_secret_jwt_key_2026');
      const user = await resolveAuthenticatedUser(decoded.id);
      if (user && user.isActive !== false) {
        req.user = user;
      }
    }
  } catch {
    // Ignore error for optional auth
  }
  next();
}

/**
 * Role-based access control guard
 * @param  {...string} roles - e.g. 'admin', 'customer'
 */
export function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user || req.user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${roles.join(' or ')} accounts.`
      });
    }

    next();
  };
}

export default {
  verifyAuth,
  optionalAuth,
  roleGuard
};
