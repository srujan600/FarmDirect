import React, { useState, useEffect, useRef } from 'react';
import { AuthService, RegisterMetadata } from '../services/authService';
import { ProfileService } from '../services/profileService';
import { useAgriStore } from '../context/useAgriStore';
import type { UserRole, PreferredLanguage, User } from '@types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { setAuthenticatedUser, showToast } = useAgriStore();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [step, setStep] = useState<'input' | 'otp'>('input');

  // Input Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('RETAIL_CONSUMER');
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('hi');

  // OTP State (6 Digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown & Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode if initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setStep('input');
    setErrorMessage(null);
  }, [initialMode, isOpen]);

  // Handle 60s cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep('input');
    setPassword('');
    setShowPassword(false);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 1. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    const { session, error } = await AuthService.signInWithPassword(trimmedEmail, password);

    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      return;
    }

    const userId = session?.user?.id || crypto.randomUUID();
    let profile: User | null = null;

    if (session?.user?.id) {
      profile = await ProfileService.getProfile(session.user.id);
      if (!profile) {
        profile = await ProfileService.upsertProfile({
          id: session.user.id,
          email: session.user.email || trimmedEmail,
          full_name: session.user.user_metadata?.full_name || trimmedEmail.split('@')[0],
          role: (session.user.user_metadata?.role as UserRole) || 'RETAIL_CONSUMER',
          phone_number: session.user.user_metadata?.phone_number,
          preferred_language: (session.user.user_metadata?.preferred_language as PreferredLanguage) || 'hi',
        });
      }
    } else {
      // Local simulation fallback
      profile = {
        id: userId,
        phone_number: '+919823014289',
        full_name: trimmedEmail.split('@')[0],
        role: 'RETAIL_CONSUMER',
        preferred_language: 'hi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    setIsLoading(false);
    if (profile) {
      setAuthenticatedUser(profile, session?.access_token || 'demo-token');
      showToast(`Welcome back, ${profile.full_name}! (${profile.role})`, 'success');
      handleClose();
    }
  };

  // 2. Email OTP Request
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await AuthService.sendOtp(trimmedEmail);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStep('otp');
    setResendCooldown(60);
    showToast(`6-Digit OTP sent to ${trimmedEmail}`, 'info');
  };

  // 3. User Registration (Email + Password + Metadata)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (phoneNumber && phoneNumber.trim().length < 10) {
      setErrorMessage('Phone number must be at least 10 digits.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    const metadata: RegisterMetadata = {
      full_name: fullName.trim(),
      role,
      phone_number: phoneNumber.trim() || undefined,
      preferred_language: preferredLanguage,
    };

    const { session, error } = await AuthService.signUpWithPassword(trimmedEmail, password, metadata);

    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      return;
    }

    if (session) {
      let profile = await ProfileService.getProfile(session.user.id);
      if (!profile) {
        profile = await ProfileService.upsertProfile({
          id: session.user.id,
          email: session.user.email || trimmedEmail,
          full_name: fullName.trim(),
          role,
          phone_number: phoneNumber.trim() || undefined,
          preferred_language: preferredLanguage,
        });
      }
      setIsLoading(false);
      if (profile) {
        setAuthenticatedUser(profile, session.access_token);
        showToast(`Registration complete! Welcome, ${profile.full_name}`, 'success');
        handleClose();
      }
    } else {
      setIsLoading(false);
      setStep('otp');
      setResendCooldown(60);
      showToast(`Account created! Enter the 6-digit confirmation code sent to ${trimmedEmail}`, 'info');
    }
  };

  // Handle OTP Individual Digits
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setErrorMessage(null);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
      setErrorMessage(null);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullToken = otpDigits.join('');

    if (fullToken.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { session, error } = await AuthService.verifyOtp(email, fullToken);

    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      return;
    }

    const userId = session?.user?.id || crypto.randomUUID();
    let profile: User | null = null;

    if (session?.user?.id) {
      profile = await ProfileService.getProfile(session.user.id);
      if (!profile) {
        profile = await ProfileService.upsertProfile({
          id: session.user.id,
          email: session.user.email || email,
          full_name: fullName || session.user.user_metadata?.full_name || email.split('@')[0],
          role: (session.user.user_metadata?.role as UserRole) || role,
          phone_number: phoneNumber || session.user.user_metadata?.phone_number,
          preferred_language: preferredLanguage || (session.user.user_metadata?.preferred_language as PreferredLanguage) || 'hi',
        });
      }
    } else {
      profile = {
        id: userId,
        phone_number: phoneNumber || '+919823014289',
        full_name: fullName || (mode === 'login' ? 'Verified User' : fullName),
        role,
        preferred_language: preferredLanguage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    setIsLoading(false);

    if (profile) {
      setAuthenticatedUser(profile, session?.access_token || 'demo-token');
      showToast(`Welcome back, ${profile.full_name}! (${profile.role})`, 'success');
      handleClose();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await AuthService.sendOtp(email);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      showToast('A new 6-digit verification code has been dispatched.', 'info');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-elevation-3 border border-outline-variant max-w-md w-full overflow-hidden flex flex-col transition-all">
        {/* Modal Header */}
        <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">
                {step === 'otp' ? 'lock' : mode === 'login' ? 'login' : 'person_add'}
              </span>
            </div>
            <div>
              <h3 id="auth-modal-title" className="font-bold text-lg text-primary leading-tight">
                {step === 'otp'
                  ? 'Verify 6-Digit OTP'
                  : mode === 'login'
                  ? loginMethod === 'password' ? 'Sign In with Password' : 'Sign In with Email OTP'
                  : 'Register for AgriDirect'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {step === 'otp'
                  ? `Enter code sent to ${email}`
                  : mode === 'login'
                  ? 'Access your Kisan, Grahak, or Mandi account'
                  : 'Create your sovereign agricultural identity'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            type="button"
            aria-label="Close authentication dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher (Sign In vs Register) */}
        {step === 'input' && (
          <div className="flex border-b border-outline-variant bg-surface-container">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                mode === 'login'
                  ? 'border-primary text-primary bg-surface-container-lowest'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                mode === 'register'
                  ? 'border-primary text-primary bg-surface-container-lowest'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Method Switcher inside Login (Password vs OTP) */}
        {step === 'input' && mode === 'login' && (
          <div className="px-5 pt-4">
            <div className="flex rounded-xl bg-surface-container p-1 border border-outline-variant/60">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'password'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">key</span>
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'otp'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span>Email OTP</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-error-container text-on-error-container border border-error/30 text-xs flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] shrink-0 text-error">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5">
          {step === 'input' ? (
            mode === 'login' ? (
              loginMethod === 'password' ? (
                /* 1A. PASSWORD LOGIN FORM */
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[48px] mt-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In with Password</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('otp');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-secondary hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">mail</span>
                      <span>Forgot password or prefer Email OTP? Sign in with OTP</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* 1B. EMAIL OTP LOGIN FORM */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-start gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary shrink-0 mt-0.5">info</span>
                      <span>We will send a 6-digit one-time code to your email inbox for passwordless login.</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[48px] mt-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-secondary hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">key</span>
                      <span>Know your password? Sign in with password</span>
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* 2. REGISTRATION FORM (With Full Details & Password) */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Balasaheb Shinde"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Select Persona Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <option value="FARMER">🌱 Kisan (Farmer)</option>
                      <option value="RETAIL_CONSUMER">🛒 Grahak (Consumer)</option>
                      <option value="BULK_BUYER">🏢 B2B HoReCa</option>
                      <option value="LOGISTICS_DRIVER">🚚 Logistics Driver</option>
                      <option value="FPO_ADMIN">🌾 FPO Executive</option>
                      <option value="GOVT_ADMIN">🏛️ Mandi Inspector</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98230 14289"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    You can log in with this password or with Email OTP anytime.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] mt-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* 3. OTP VERIFICATION STEP */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">
                  Enter the 6-digit verification code sent to:
                </p>
                <div className="font-bold text-sm text-primary mt-0.5">{email}</div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-[11px] text-secondary underline mt-1 hover:text-primary transition-colors cursor-pointer"
                >
                  Change email address
                </button>
              </div>

              {/* Helpful Hint on Email Content */}
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">info</span>
                  <span className="text-[11px] leading-relaxed">
                    Check your email inbox. If your email contains a magic login link, you can click that link directly or enter the 6-digit code below.
                  </span>
                </div>
              </div>

              {/* 6 Individual Numeric Digits */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isLoading}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border border-outline-variant bg-surface-container-lowest text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm disabled:opacity-60"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Verify &amp; Continue</span>
                  </>
                )}
              </button>

              {/* Resend with Cooldown Timer */}
              <div className="text-center pt-2">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-on-surface-variant font-medium flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Resend code in <strong className="font-mono text-primary">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-xs font-bold text-secondary hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>Didn't receive code? Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
