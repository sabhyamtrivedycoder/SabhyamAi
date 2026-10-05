/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, UserMeasurements } from '../types';
import {
  XIcon,
  UserIcon,
  CheckIcon,
  GoogleIcon,
  AppleIcon,
  MicrosoftIcon,
  MailIcon,
  RotateCcwIcon,
} from './icons';
import { SabhyamIcon } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  currentMeasurements?: UserMeasurements;
}

type AuthStep = 'social_or_email' | 'enter_otp' | 'complete';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentMeasurements,
}) => {
  const [step, setStep] = useState<AuthStep>('social_or_email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpCountdown, setOtpCountdown] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  // Timer for OTP countdown
  useEffect(() => {
    let timer: any;
    if (step === 'enter_otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  if (!isOpen) return null;

  const defaultMeasurements: UserMeasurements = currentMeasurements || {
    height: "5'8\" (173 cm)",
    weight: '155 lbs (70 kg)',
    bodyType: 'Average',
    gender: 'Unisex',
    styleVibe: 'Classic Minimalist',
  };

  // Generate and send 6-digit OTP
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpCountdown(60);
    setOtpInput(['', '', '', '', '', '']);
    setStep('enter_otp');

    // Simulate real mail delivery notification toast
    setOtpNotification(
      `Sabhyam Ai Verification Code sent to ${trimmedEmail}: [ ${code} ]`
    );
  };

  const handleOtpBoxChange = (val: string, index: number) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const updated = [...otpInput];
    updated[index] = val;
    setOtpInput(updated);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpInput.join('');

    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (enteredCode !== generatedOtp) {
      setError('Invalid OTP code. Please check the code sent to your email.');
      return;
    }

    // Successful OTP verification!
    const normalizedEmail = email.toLowerCase().trim();
    const storedUsersJson = localStorage.getItem('sabhyam_users') || '{}';
    const usersMap = JSON.parse(storedUsersJson);

    let profile: UserProfile = usersMap[normalizedEmail];
    if (!profile) {
      profile = {
        id: `user-${Date.now()}`,
        name: name.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        measurements: defaultMeasurements,
        savedLooks: [],
        favoriteGarmentIds: [],
        createdAt: new Date().toISOString(),
      };
      usersMap[normalizedEmail] = profile;
      localStorage.setItem('sabhyam_users', JSON.stringify(usersMap));
    }

    localStorage.setItem('sabhyam_active_user', JSON.stringify(profile));
    onAuthSuccess(profile);
    onClose();
  };

  // Social Sign In Handlers (Google, Apple, Microsoft)
  const handleSocialSignIn = (provider: 'Google' | 'Apple' | 'Microsoft') => {
    setError(null);
    const mockEmail = `user.${provider.toLowerCase()}@sabhyam.ai`;
    const mockName = `${provider} User`;

    const storedUsersJson = localStorage.getItem('sabhyam_users') || '{}';
    const usersMap = JSON.parse(storedUsersJson);

    let profile: UserProfile = usersMap[mockEmail];
    if (!profile) {
      profile = {
        id: `${provider.toLowerCase()}-${Date.now()}`,
        name: mockName,
        email: mockEmail,
        measurements: defaultMeasurements,
        savedLooks: [],
        favoriteGarmentIds: [],
        createdAt: new Date().toISOString(),
      };
      usersMap[mockEmail] = profile;
      localStorage.setItem('sabhyam_users', JSON.stringify(usersMap));
    }

    localStorage.setItem('sabhyam_active_user', JSON.stringify(profile));
    onAuthSuccess(profile);
    onClose();
  };

  const handleGuestContinue = () => {
    const guestProfile: UserProfile = {
      id: `guest-${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@sabhyam.ai',
      measurements: defaultMeasurements,
      savedLooks: [],
      favoriteGarmentIds: [],
      createdAt: new Date().toISOString(),
    };
    onAuthSuccess(guestProfile);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-7">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <SabhyamIcon sizeClass="w-12 h-14" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-900">
                {step === 'enter_otp' ? 'Verify Email Code' : 'Sign in to Sabhyamai'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                {step === 'enter_otp'
                  ? `Enter the 6-digit security code sent to ${email}`
                  : 'Save your measurements, face profile, and favorite looks.'}
              </p>
            </div>

            {/* In-app OTP Email Dispatch Notification */}
            {otpNotification && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl flex items-start gap-2 shadow-xs">
                <MailIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <p className="font-semibold text-amber-950">Email Code Dispatched</p>
                  <p className="mt-0.5 font-mono font-bold text-sm tracking-widest text-amber-900">
                    {generatedOtp}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = generatedOtp.split('');
                      setOtpInput(digits);
                    }}
                    className="mt-1 text-[11px] underline text-amber-800 hover:text-black font-semibold"
                  >
                    Auto-fill Code
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            {step === 'social_or_email' ? (
              <div className="space-y-4">
                {/* Social Sign-in Options */}
                <div className="space-y-2.5">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('Google')}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-xs font-semibold rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs transition-all active:scale-98"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>Continue with Google</span>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('Apple')}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-xs font-semibold rounded-xl bg-black text-white hover:bg-gray-800 shadow-xs transition-all active:scale-98"
                  >
                    <AppleIcon className="w-4 h-4" />
                    <span>Continue with Apple</span>
                  </button>

                  {/* Microsoft */}
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('Microsoft')}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-xs font-semibold rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs transition-all active:scale-98"
                  >
                    <MicrosoftIcon className="w-4 h-4" />
                    <span>Continue with Microsoft</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400 font-semibold tracking-wider text-[10px]">
                      Or with Email OTP
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Shailesh Trivedy"
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MailIcon className="w-4 h-4" />
                    <span>Send Verification Code (OTP) &rarr;</span>
                  </button>
                </form>
              </div>
            ) : (
              /* OTP Verification Step */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex justify-center gap-2">
                  {otpInput.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-box-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(e.target.value, i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && i > 0) {
                          document.getElementById(`otp-box-${i - 1}`)?.focus();
                        }
                      }}
                      className="w-11 h-12 text-center text-lg font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50/50"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>
                    {otpCountdown > 0 ? (
                      `Resend code in ${otpCountdown}s`
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('social_or_email');
                      setError(null);
                    }}
                    className="underline hover:text-gray-800"
                  >
                    Change email
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-98 transition-all shadow-md"
                >
                  Verify Code & Enter Studio
                </button>
              </form>
            )}

            {/* Guest fallback */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={handleGuestContinue}
                className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                Continue as Guest &rarr;
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
