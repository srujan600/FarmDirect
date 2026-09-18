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
  const [step, setStep] = useState<'input' | 'otp'>('input');

  // Input Form State
  const [email, setEmail] = useState('');
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
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full name (minimum 2 characters).');
        return;
      }
      if (phoneNumber && phoneNumber.trim().length < 10) {
        setErrorMessage('Phone number must be at least 10 digits.');
        return;
      }
    }

    setIsLoading(true);

    const metadata: RegisterMetadata | undefined =
      mode === 'register'
        ? {
            full_name: fullName.trim(),
            role,
            phone_number: phoneNumber.trim() || undefined,
            preferred_language: preferredLanguage,
          }
        : undefined;

    const { error } = await AuthService.sendOtp(trimmedEmail, metadata);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    // Success: transition to OTP step and set 60s cooldown
    setStep('otp');
    setResendCooldown(60);
    showToast(`Verification code sent to ${trimmedEmail}`, 'info');
  };

  // Step 2: Handle Individual Digit Inputs
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric character
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setErrorMessage(null);

    // Auto-advance to next input if digit entered
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste
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

  // Step 3: Verify OTP Code
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

    // Successful OTP verification!
    // Fetch or create profile record linked to auth user
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
      // Fallback local simulation
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

  // Resend OTP handler
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);

    const metadata: RegisterMetadata | undefined =
      mode === 'register'
        ? {
            full_name: fullName.trim(),
            role,
            phone_number: phoneNumber.trim() || undefined,
            preferred_language: preferredLanguage,
          }
        : undefined;

    const { error } = await AuthService.resendOtp(email, metadata);
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
                  ? 'Sign In with Email OTP'
                  : 'Register for AgriDirect'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {step === 'otp'
                  ? `Enter code sent to ${email}`
                  : 'Passwordless, sovereign email verification'}
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

        {/* Tab Switcher (Visible only in input step) */}
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
            <form onSubmit={handleSendOtp} className="space-y-4">
              {mode === 'register' && (
                <>
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
                </>
              )}

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
                <p className="text-[11px] text-on-surface-variant mt-1">
                  We will send a 6-digit one-time code to this address for instant login.
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
                    <span>{mode === 'login' ? 'Send Login OTP' : 'Send Registration OTP'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP VERIFICATION STEP */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">
                  A verification code has been dispatched to:
                </p>
                <div className="font-bold text-sm text-primary mt-0.5">{email}</div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-[11px] text-secondary underline mt-1 hover:text-primary transition-colors"
                >
                  Change email address
                </button>
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
