import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Restore user session on initial mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await apiRequest('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch {
        // User not logged in, keep null
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Send 6-digit OTP for Signup Email Verification
  const sendSignupOtp = async (signupData) => {
    try {
      const data = await apiRequest('/auth/signup-otp', {
        method: 'POST',
        body: signupData
      });
      if (data.success) {
        toast.success(data.message || 'Verification code sent to your email.');
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      toast.error(err.message || 'Failed to send verification code.');
      return { success: false, error: err.message };
    }
  };

  // New User Registration / Sign Up
  const register = async (userData) => {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: userData
      });
      if (data.success && data.user) {
        setUser(data.user);
        toast.success(`Account created! Welcome, ${data.user.name}!`);
        return { success: true, user: data.user };
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check inputs.');
      return { success: false, error: err.message };
    }
  };

  // Unified Login (Email/Phone + Password)
  const login = async (identifier, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { identifier, password }
      });
      if (data.success && data.user) {
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        return { success: true, user: data.user };
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      return { success: false, error: err.message };
    }
  };

  // Request 6-digit Email OTP
  const requestOtp = async (email) => {
    try {
      const data = await apiRequest('/auth/request-otp', {
        method: 'POST',
        body: { email }
      });
      if (data.success) {
        toast.info(data.message || 'Verification code sent to your email.');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send verification code.');
      return { success: false, error: err.message };
    }
  };

  // Verify Email OTP
  const verifyOtp = async (email, code, name, phone) => {
    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: { email, code, name, phone }
      });
      if (data.success && data.user) {
        setUser(data.user);
        toast.success(`Verified! Welcome to Max Housekeeping, ${data.user.name}.`);
        return { success: true, user: data.user };
      }
    } catch (err) {
      toast.error(err.message || 'Invalid verification code.');
      return { success: false, error: err.message };
    }
  };

  // Google OAuth Login
  const googleLogin = async (googlePayload) => {
    try {
      const data = await apiRequest('/auth/google', {
        method: 'POST',
        body: googlePayload
      });
      if (data.success && data.user) {
        setUser(data.user);
        toast.success(`Signed in with Google as ${data.user.name}`);
        return { success: true, user: data.user };
      }
    } catch (err) {
      toast.error(err.message || 'Google sign in failed.');
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      setUser(null);
      toast.info('Logged out successfully.');
    }
  };

  // Add address to user address book
  const addAddress = async (addressData) => {
    try {
      const data = await apiRequest('/auth/addresses', {
        method: 'POST',
        body: addressData
      });
      if (data.success && data.addresses) {
        setUser((prev) => prev ? { ...prev, addresses: data.addresses } : null);
        toast.success('Address saved to your profile.');
        return { success: true, addresses: data.addresses };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save address.');
      return { success: false, error: err.message };
    }
  };

  // Delete saved address
  const deleteAddress = async (addressId) => {
    try {
      const data = await apiRequest(`/auth/addresses/${addressId}`, {
        method: 'DELETE'
      });
      if (data.success && data.addresses) {
        setUser((prev) => prev ? { ...prev, addresses: data.addresses } : null);
        toast.info('Address removed from profile.');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove address.');
      return { success: false, error: err.message };
    }
  };

  // Change Password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: { currentPassword, newPassword }
      });
      if (data.success) {
        toast.success(data.message || 'Password updated successfully.');
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
      return { success: false, error: err.message };
    }
  };

  // Forgot Password (send OTP)
  const forgotPassword = async (email) => {
    try {
      const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      if (data.success) {
        toast.success(data.message || 'Reset code sent to your email.');
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      toast.error(err.message || 'Failed to send reset code.');
      return { success: false, error: err.message };
    }
  };

  // Reset Password (with OTP)
  const resetPassword = async (email, code, newPassword) => {
    try {
      const data = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { email, code, newPassword }
      });
      if (data.success) {
        toast.success(data.message || 'Password reset successfully!');
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === 'admin',
        sendSignupOtp,
        register,
        login,
        requestOtp,
        verifyOtp,
        googleLogin,
        logout,
        addAddress,
        deleteAddress,
        changePassword,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
