import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LuMail, LuLock, LuPhone, LuShieldCheck, LuArrowRight, LuKey } from 'react-icons/lu';
import { FaGoogle } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'otp'
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  
  // OTP State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpName, setOtpName] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, requestOtp, verifyOtp, googleLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handlePostLoginRedirect = (userRole) => {
    if (userRole === 'admin') {
      navigate('/admin');
    } else {
      const from = location.state?.from || '/';
      navigate(from);
    }
  };

  // 1. Password Login Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error('Please enter your email/phone and password.');
      return;
    }

    setLoading(true);
    const res = await login(identifier.trim(), password);
    setLoading(false);

    if (res.success && res.user) {
      handlePostLoginRedirect(res.user.role);
    }
  };

  // 2. Request 6-digit Email OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await requestOtp(otpEmail.trim());
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
    }
  };

  // 3. Verify OTP & Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(otpEmail.trim(), otpCode.trim(), otpName, otpPhone);
    setLoading(false);

    if (res.success && res.user) {
      handlePostLoginRedirect(res.user.role);
    }
  };

  // 4. Google OAuth Sim
  const handleGoogleSignIn = async () => {
    setLoading(true);
    // Simulates standard Google OAuth response profile
    const dummyGoogleProfile = {
      email: 'client.google@gmail.com',
      name: 'Google Verified User',
      avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
    };
    const res = await googleLogin(dummyGoogleProfile);
    setLoading(false);

    if (res.success && res.user) {
      handlePostLoginRedirect(res.user.role);
    }
  };

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#ECE5D8] p-8 rounded-3xl border-2 border-[#10231D] shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Max House Keeping Service"
            className="w-14 h-14 object-contain mx-auto mb-3"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#10231D]">
            Single Unified Portal
          </h1>
          <p className="text-xs text-[#6B8077] mt-1 font-medium">
            Customer Bookings & Administrative Portal
          </p>
        </div>

        {/* Auth Method Tabs */}
        <div className="flex rounded-xl bg-[#F4EFE6] p-1 border border-[#E2D9C8] mb-6">
          <button
            type="button"
            onClick={() => setAuthMethod('password')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              authMethod === 'password'
                ? 'bg-[#10231D] text-[#F4EFE6] shadow-sm'
                : 'text-[#10231D] hover:bg-[#ECE5D8]'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('otp')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              authMethod === 'otp'
                ? 'bg-[#10231D] text-[#F4EFE6] shadow-sm'
                : 'text-[#10231D] hover:bg-[#ECE5D8]'
            }`}
          >
            Email 6-Digit OTP
          </button>
        </div>

        {/* 1. PASSWORD LOGIN FORM */}
        {authMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#10231D] mb-1">
                Email or Mobile Number:
              </label>
              <div className="relative">
                <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                <input
                  type="text"
                  placeholder="admin@maxhousekeepingservice.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10231D] mb-1">
                Password:
              </label>
              <div className="relative">
                <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-sm transition-transform active:scale-95 shadow-md mt-2 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <LuArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. EMAIL 6-DIGIT OTP FORM */}
        {authMethod === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Enter Your Email for Verification:
                  </label>
                  <div className="relative">
                    <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#6B8077] mt-1.5">
                    We will send a 6-digit one-time code to your inbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] disabled:opacity-50 text-[#F4EFE6] font-bold text-sm transition-colors shadow-md mt-2"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-[#DDEBE4] text-[#10231D] text-xs font-medium border border-[#BED6CC]">
                  Verification code sent to <strong>{otpEmail}</strong>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Enter 6-Digit Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-center font-mono text-2xl tracking-[0.3em] font-bold text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={otpName}
                    onChange={(e) => setOtpName(e.target.value)}
                    className="p-2.5 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile (optional)"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    className="p-2.5 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-3 py-3 rounded-xl border border-[#E2D9C8] text-xs font-bold text-[#6B8077] hover:bg-[#F4EFE6]"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-bold text-sm shadow-md"
                  >
                    {loading ? 'Verifying...' : 'Verify & Log In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2D9C8]" />
          </div>
          <span className="relative px-3 bg-[#ECE5D8] text-xs text-[#6B8077] font-semibold">
            OR SIGN IN WITH
          </span>
        </div>

        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-[#F4EFE6] hover:bg-[#E2D9C8] border border-[#E2D9C8] text-[#10231D] font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-xs"
        >
          <FaGoogle className="w-4 h-4 text-[#C2512D]" />
          <span>Continue with Google Account</span>
        </button>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-[#E2D9C8] flex items-center justify-center gap-1.5 text-[11px] text-[#6B8077]">
          <LuShieldCheck className="w-4 h-4 text-[#10231D]" />
          <span>End-to-end encrypted session · Role-based access</span>
        </div>
      </div>
    </div>
  );
}
