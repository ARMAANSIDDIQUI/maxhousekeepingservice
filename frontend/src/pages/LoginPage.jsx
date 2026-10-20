import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LuMail,
  LuLock,
  LuPhone,
  LuShieldCheck,
  LuArrowRight,
  LuArrowLeft,
  LuKey,
  LuUser,
  LuUserPlus,
  LuEye,
  LuEyeOff,
  LuCheck,
  LuRotateCcw
} from 'react-icons/lu';
import { FaGoogle } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'otp'

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // Sign In States
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');

  // Sign Up Multi-Step Verification States
  const [signupStep, setSignupStep] = useState(1); // 1: Info Form, 2: Email OTP
  const [signupOtp, setSignupOtp] = useState('');
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Email OTP Login State (Passwordless Sign In)
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpName, setOtpName] = useState('');
  const [otpPhone, setOtpPhone] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);

  const {
    login,
    sendSignupOtp,
    register,
    requestOtp,
    verifyOtp,
    googleLogin,
    forgotPassword,
    resetPassword
  } = useAuth();

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    document.title =
      mode === 'signin'
        ? 'Login Page | Max Housekeeping Service'
        : mode === 'signup'
        ? 'Create Account | Max Housekeeping Service'
        : 'Reset Password | Max Housekeeping Service';
  }, [mode]);

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

    if (res?.success && res?.user) {
      handlePostLoginRedirect(res.user.role);
    }
  };

  // 2. Sign Up Step 1: Validate Details and Send Email OTP
  const handleSignupSendOtp = async (e) => {
    e.preventDefault();
    const { name, phone, email, password: pw, confirmPassword: cpw } = signupForm;

    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (pw.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (pw !== cpw) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const res = await sendSignupOtp({
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim().toLowerCase()
    });
    setLoading(false);

    if (res?.success) {
      setSignupStep(2);
      setSignupOtpSent(true);
    }
  };

  // 3. Sign Up Step 2: Verify Email OTP and Create Verified User in DB
  const handleSignupFinalSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, email, password: pw } = signupForm;

    if (!signupOtp.trim() || signupOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');

    setLoading(true);
    const res = await register({
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim().toLowerCase(),
      password: pw,
      otp: signupOtp.trim()
    });
    setLoading(false);

    if (res?.success && res?.user) {
      handlePostLoginRedirect(res.user.role);
    }
  };

  // 4. Request 6-digit Email OTP for Direct Passwordless Login
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await requestOtp(otpEmail.trim());
    setLoading(false);

    if (res?.success) {
      setOtpSent(true);
    }
  };

  // 5. Verify OTP & Direct Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(otpEmail.trim(), otpCode.trim(), otpName, otpPhone);
    setLoading(false);

    if (res?.success && res?.user) {
      handlePostLoginRedirect(res.user.role);
    }
  };

  // 6. Forgot Password - Request Reset Code
  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    const res = await forgotPassword(forgotEmail.trim());
    setLoading(false);

    if (res?.success) {
      setForgotOtpSent(true);
    }
  };

  // 7. Reset Password Submit with OTP
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotCode.trim() || forgotCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(
      forgotEmail.trim(),
      forgotCode.trim(),
      forgotNewPassword
    );
    setLoading(false);

    if (res?.success) {
      setIdentifier(forgotEmail.trim());
      setForgotOtpSent(false);
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setMode('signin');
      setAuthMethod('password');
    }
  };

  // Google OAuth Client ID from Environment with verified fallback
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '672677706855-2gii7cnf1qim21jllnl8ffvjid61b3eh.apps.googleusercontent.com';
  const [googleStatus, setGoogleStatus] = useState('loading'); // 'loading' | 'ready' | 'blocked'
  const googleButtonRef = React.useRef(null);

  // Initialize Google Identity Services with polling and fallback detection
  React.useEffect(() => {
    if (!googleClientId) {
      setGoogleStatus('blocked');
      return;
    }

    let intervalId = null;
    let attempts = 0;
    const maxAttempts = 15; // 15 * 200ms = 3.0s

    const checkAndInit = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        if (intervalId) clearInterval(intervalId);
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response?.credential) {
                setLoading(true);
                const res = await googleLogin({ credential: response.credential });
                setLoading(false);
                if (res?.success && res?.user) {
                  handlePostLoginRedirect(res.user.role);
                }
              }
            }
          });
          setGoogleStatus('ready');
        } catch (err) {
          console.warn('Google Identity initialization error:', err);
          setGoogleStatus('blocked');
        }
        return true;
      }
      return false;
    };

    if (!checkAndInit()) {
      intervalId = setInterval(() => {
        attempts++;
        if (checkAndInit()) {
          // Successfully initialized
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          // Script was blocked by ad-blocker / Brave Shields or network is offline
          setGoogleStatus('blocked');
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [googleClientId]);

  // Render official Google button when container is mounted and Google is ready
  React.useEffect(() => {
    if (googleStatus === 'ready' && window.google?.accounts?.id && googleButtonRef.current) {
      try {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 384
        });
      } catch (err) {
        console.warn('Google renderButton error:', err);
      }
    }
  }, [googleStatus, mode, signupStep]);

  // Google OAuth button handler
  const handleGoogleSignIn = () => {
    if (!googleClientId) {
      toast.info('Google Sign-In is enabled. Please enter your VITE_GOOGLE_CLIENT_ID in the frontend .env file.');
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            toast.info('Google popup was skipped or blocked by browser. Please use the Google button above or check popup settings.');
          }
        });
      } catch (e) {
        toast.info('Please click the Google button directly.');
      }
    } else if (googleStatus === 'loading') {
      toast.info('Google Identity Services is loading. Please wait a moment...');
    } else {
      toast.warn('Google Sign-In is blocked by your browser ad-blocker (e.g. uBlock Origin, Brave Shields) or an offline connection. Please allow accounts.google.com, or sign in using Email OTP / Password above.');
    }
  };

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#ECE5D8] p-8 rounded-3xl border-2 border-[#10231D] shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Max House Keeping Service"
            className="w-14 h-14 object-contain mx-auto mb-3"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#10231D]">
            {mode === 'signin'
              ? 'Login Page'
              : mode === 'signup'
              ? 'Create Account'
              : 'Reset Password'}
          </h1>
          <p className="text-xs text-[#6B8077] mt-1 font-medium">
            {mode === 'signin'
              ? 'Sign in to your account'
              : mode === 'signup'
              ? (signupStep === 1
                ? 'Fill details and verify with email OTP'
                : 'Enter verification code to complete sign up')
              : 'Enter your email to receive a password reset code'}
          </p>
        </div>

        {/* Mode Navigation Bar */}
        {mode === 'forgot' ? (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setForgotOtpSent(false);
              }}
              className="text-xs font-bold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1.5 transition-colors"
            >
              <LuArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 rounded-2xl bg-[#F4EFE6] p-1 border border-[#E2D9C8] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setSignupStep(1);
              }}
              className={`py-2.5 text-xs font-black rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                  : 'text-[#10231D] hover:bg-[#ECE5D8]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-[#E9A23B] text-[#10231D] shadow'
                  : 'text-[#10231D] hover:bg-[#ECE5D8]'
              }`}
            >
              <LuUserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* ========================================================
            MODE A: SIGN IN (Password & Google OAuth)
        ======================================================== */}
        {mode === 'signin' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#10231D] mb-1">
                Email or Mobile Number:
              </label>
              <div className="relative">
                <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                <input
                  type="text"
                  placeholder="admin@maxhousekeepingservice.com or mobile"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#10231D]">
                  Password:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (identifier.includes('@')) {
                      setForgotEmail(identifier.trim());
                    }
                    setMode('forgot');
                    setForgotOtpSent(false);
                  }}
                  className="text-xs font-bold text-[#E9A23B] hover:text-[#D48E28] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <LuEyeOff className="w-4 h-4" />
                  ) : (
                    <LuEye className="w-4 h-4" />
                  )}
                </button>
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

        {/* ========================================================
            MODE B: CREATE ACCOUNT (WITH EMAIL OTP VERIFICATION STEPS)
        ======================================================== */}
        {mode === 'signup' && (
          <div>
            {/* Visual Step Indicator Alongside Form */}
            <div className="flex items-center justify-between mb-5 px-1">
              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  signupStep === 1 ? 'text-[#10231D]' : 'text-[#6B8077] hover:text-[#10231D]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    signupStep === 1
                      ? 'bg-[#10231D] text-[#F4EFE6]'
                      : 'bg-[#DDEBE4] text-[#10231D]'
                  }`}
                >
                  {signupStep > 1 ? <LuCheck className="w-3 h-3" /> : '1'}
                </span>
                <span>Account Info</span>
              </button>

              <div className="flex-1 h-0.5 bg-[#E2D9C8] mx-3" />

              <div
                className={`flex items-center gap-1.5 text-xs font-bold ${
                  signupStep === 2 ? 'text-[#10231D]' : 'text-[#6B8077]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    signupStep === 2
                      ? 'bg-[#E9A23B] text-[#10231D]'
                      : 'bg-[#E2D9C8] text-[#6B8077]'
                  }`}
                >
                  2
                </span>
                <span>Email OTP</span>
              </div>
            </div>

            {/* STEP 1: FILL DETAILS & SEND OTP */}
            {signupStep === 1 && (
              <form onSubmit={handleSignupSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Full Name:
                  </label>
                  <div className="relative">
                    <LuUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      10-Digit Mobile:
                    </label>
                    <div className="relative">
                      <LuPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      Email Address:
                    </label>
                    <div className="relative">
                      <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                      <input
                        type="email"
                        placeholder="you@gmail.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Create Password (min 6 characters):
                  </label>
                  <div className="relative">
                    <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                      title={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? (
                        <LuEyeOff className="w-4 h-4" />
                      ) : (
                        <LuEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Confirm Password:
                  </label>
                  <div className="relative">
                    <LuKey className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                      title={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupConfirmPassword ? (
                        <LuEyeOff className="w-4 h-4" />
                      ) : (
                        <LuEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Sending Code...' : 'Verify Email & Continue'}</span>
                    <LuArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: ENTER EMAIL OTP & COMPLETE SIGNUP */}
            {signupStep === 2 && (
              <form onSubmit={handleSignupFinalSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#DDEBE4] text-[#10231D] text-xs font-medium border border-[#BED6CC] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Verification code sent to:</span>
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="font-bold text-[#10231D] hover:underline flex items-center gap-1"
                    >
                      <span>Edit Details</span>
                    </button>
                  </div>
                  <div className="font-mono font-bold text-sm text-[#10231D]">
                    {signupForm.email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Enter 6-Digit Verification Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-center font-mono text-2xl tracking-[0.3em] font-bold text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-[#6B8077] mt-1.5 text-center">
                    Check your email inbox or spam folder for the one-time code.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSignupSendOtp}
                    disabled={loading}
                    className="px-3.5 py-3 rounded-xl border border-[#E2D9C8] text-xs font-bold text-[#6B8077] hover:bg-[#F4EFE6] flex items-center gap-1"
                  >
                    <LuRotateCcw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                  >
                    <LuShieldCheck className="w-4 h-4 text-[#10231D]" />
                    <span>{loading ? 'Verifying...' : 'Verify & Create Account'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================
            MODE C: FORGOT / RESET PASSWORD (WITH EMAIL OTP VERIFICATION)
        ======================================================== */}
        {mode === 'forgot' && (
          <div>
            {!forgotOtpSent ? (
              <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Your Registered Email Address:
                  </label>
                  <div className="relative">
                    <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#6B8077] mt-1.5">
                    We will send a 6-digit one-time verification code to this email to reset your password.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Sending Code...' : 'Send Reset Code'}</span>
                  <LuArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setForgotOtpSent(false);
                    }}
                    className="text-xs font-bold text-[#6B8077] hover:text-[#10231D] transition-colors"
                  >
                    Remember your password? Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-[#DDEBE4] text-[#10231D] text-xs font-medium border border-[#BED6CC]">
                  Verification code sent to <strong>{forgotEmail}</strong>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Enter 6-Digit Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-center font-mono text-2xl tracking-[0.3em] font-bold text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    New Password (min 6 characters):
                  </label>
                  <div className="relative">
                    <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                      title={showForgotNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotNewPassword ? (
                        <LuEyeOff className="w-4 h-4" />
                      ) : (
                        <LuEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Confirm New Password:
                  </label>
                  <div className="relative">
                    <LuKey className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                      title={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotConfirmPassword ? (
                        <LuEyeOff className="w-4 h-4" />
                      ) : (
                        <LuEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotOtpSent(false)}
                    className="px-3 py-3 rounded-xl border border-[#E2D9C8] text-xs font-bold text-[#6B8077] hover:bg-[#F4EFE6]"
                  >
                    Resend Code
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-sm shadow-md"
                  >
                    {loading ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Divider & Google OAuth (hidden in forgot password mode, step 2, or if Google Client ID is not configured) */}
        {mode !== 'forgot' && signupStep === 1 && Boolean(googleClientId) && (
          <>
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D2C8B8]" />
              </div>
              <span className="relative px-3.5 bg-[#ECE5D8] text-[11px] font-bold uppercase tracking-wider text-[#6B8077]">
                or continue with
              </span>
            </div>

            <div className="w-full">
              {/* Native Google Sign-In button container (Full 384px card width with rounded corners) */}
              <div
                ref={googleButtonRef}
                className={googleStatus === 'ready' ? 'w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full [&_iframe]:!rounded-xl shadow-xs' : 'hidden'}
              />

              {/* High-End Custom Styled Google Button (Shown when loading, blocked, or as fallback) */}
              {googleStatus !== 'ready' && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-[#FBF9F5] border-2 border-[#D2C8B8] hover:border-[#10231D]/40 text-[#10231D] font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] group cursor-pointer"
                >
                  {/* Official 4-Color Google "G" Vector SVG */}
                  <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {googleStatus === 'loading'
                      ? 'Connecting Google Account...'
                      : 'Sign in with Google'}
                  </span>
                </button>
              )}

              {googleStatus === 'blocked' && (
                <p className="text-[10px] text-[#8C7A6B] text-center mt-2 leading-tight">
                  Third-party cookies or ad-blocker detected. You can also sign in with your email/phone and password above.
                </p>
              )}
            </div>
          </>
        )}

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-[#E2D9C8] flex items-center justify-center gap-1.5 text-[11px] text-[#6B8077]">
          <LuShieldCheck className="w-4 h-4 text-[#10231D]" />
          <span>Safe & Secure</span>
        </div>
      </div>
    </div>
  );
}
