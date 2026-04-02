import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('发送超时，请重试'));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const lastRequestTime = useRef(0);

  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isValidOtp = (val: string) => /^\d{6}$/.test(val);

  const validateEmail = (val: string) => {
    if (!val) return 'Email is required';
    if (!isEmail(val)) return 'Invalid email format';
    return '';
  };

  const validateOtp = (val: string) => {
    if (!val) return 'Verification code is required';
    if (!isValidOtp(val)) return 'Code must be 6 digits';
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let error = '';
    if (field === 'email') error = validateEmail(value);
    if (field === 'otp') error = validateOtp(value);
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSendCode = async () => {
    const now = Date.now();
    // 防抖：2秒内不允许重复点击
    if (now - lastRequestTime.current < 2000) return;
    
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }
    
    if (!isSupabaseConfigured) {
      setErrors(prev => ({ ...prev, email: 'Supabase is not configured. Please add your credentials to the environment variables.' }));
      return;
    }
    
    lastRequestTime.current = now;
    setIsSendingCode(true);
    setErrors(prev => ({ ...prev, email: '', otp: '' }));
    setTouched(prev => ({ ...prev, otp: false }));
    
    try {
      const response = await withTimeout(
        fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }),
        10000 // 10秒超时
      );
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '发送验证码失败');
      }
      
      setSuccessMsg('验证码已发送，请查收邮件');
      setCountdown(60); // 发送成功才开始倒计时
      setTimeout(() => setSuccessMsg(''), 10000);
    } catch (error: any) {
      console.error('OTP Error:', error);
      let errorMessage = error.message || '发送验证码失败，请重试';
      
      if (errorMessage === '发送超时，请重试') {
        errorMessage = '请求超时。可能是网络问题或服务端响应慢。';
      } else if (errorMessage.toLowerCase().includes('smtp') || errorMessage.toLowerCase().includes('auth')) {
        errorMessage = '邮件发送失败，请检查 SMTP 配置是否正确。';
      }
      
      setErrors(prev => ({ ...prev, email: errorMessage }));
      setCountdown(0); // 发送失败，确保倒计时重置
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const emailError = validateEmail(email);
    const otpError = validateOtp(otp);
    
    setErrors({
      email: emailError,
      otp: otpError
    });
    setTouched({
      email: true,
      otp: true
    });
    
    if (emailError || otpError) return;
    
    if (!isSupabaseConfigured) {
      setErrors(prev => ({ ...prev, otp: 'Supabase is not configured.' }));
      return;
    }
    
    setIsSigningIn(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      
      if (error) throw error;
      if (!data.session) throw new Error('Verification failed. Please try again.');

      setSuccessMsg('Login successful!');
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (error: any) {
      setErrors(prev => ({ ...prev, otp: error.message || 'Verification code is incorrect or expired' }));
    } finally {
      setIsSigningIn(false);
    }
  };

  const isEmailValid = !validateEmail(email) && email.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md card-container p-8"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold text-[var(--title)]">Welcome back</h1>
          <p className="text-[var(--muted)] mt-2">Enter your email to receive a login code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--body)] mb-1.5">Email</label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted)] z-10">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) handleBlur('email', e.target.value);
                }}
                onBlur={(e) => handleBlur('email', e.target.value)}
                className={cn(
                  "input-field w-full pl-10",
                  errors.email && touched.email ? "border-red-500 focus:ring-red-500" : ""
                )}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && touched.email && (
              <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* OTP Input */}
          <div className="overflow-hidden">
            <label className="block text-sm font-medium text-[var(--body)] mb-1.5">Verification Code</label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <KeyRound size={18} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    if (touched.otp) handleBlur('otp', val);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    handleBlur('otp', val);
                  }}
                  className={cn(
                    "input-field w-full pl-10",
                    errors.otp && touched.otp ? "border-red-500 focus:ring-red-500" : ""
                  )}
                  placeholder="6-digit code"
                />
              </div>
              <button
                type="button"
                disabled={!isEmailValid || countdown > 0 || isSendingCode || isSigningIn}
                onClick={handleSendCode}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--title)] bg-[var(--background)] hover:bg-[var(--sidebar-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isSendingCode ? 'Sending...' : countdown > 0 ? `${countdown}s` : 'Get Code'}
              </button>
            </div>
            {errors.otp && touched.otp && (
              <p className="mt-1.5 text-xs text-red-500">{errors.otp}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSigningIn || isSendingCode}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-colors mt-6 disabled:opacity-70"
          >
            {isSigningIn ? 'Signing in...' : 'Sign in'}
            {!isSigningIn && <ArrowRight size={18} />}
          </button>
          
          <AnimatePresence>
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm text-center font-medium"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
