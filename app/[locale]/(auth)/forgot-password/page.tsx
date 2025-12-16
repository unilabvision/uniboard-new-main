// app/[locale]/(auth)/forgot-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { AlertCircle, Loader2, CheckCircle, Mail } from "lucide-react";

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

// Define translation strings interface for type safety
interface TranslationStrings {
  title: string;
  subtitle: string;
  email: string;
  emailPlaceholder: string;
  sendCode: string;
  sending: string;
  verificationCode: string;
  codePlaceholder: string;
  newPassword: string;
  newPasswordPlaceholder: string;
  resetPassword: string;
  resetting: string;
  verifyCode: string;
  verifying: string;
  backToSignIn: string;
  codeDescription: string;
  resetDescription: string;
  emailSent: string;
  passwordReset: string;
  errorGeneral: string;
  errorInvalidEmail: string;
  errorInvalidCode: string;
  errorUserNotFound: string;
  resendCode: string;
  resending: string;
}

export default function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ locale: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Resolve params
  useEffect(() => {
    if (params) {
      params.then(setResolvedParams);
    }
  }, [params]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !resolvedParams) {
    return null;
  }

  const { locale } = resolvedParams;

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-900">
      <div className="flex flex-1 flex-col justify-center py-8 px-6 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <ForgotPasswordForm locale={locale} />
        </div>
      </div>
    </div>
  );
}

// ForgotPasswordForm Component
function ForgotPasswordForm({ locale }: { locale: string }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email');

  // Localization
  const translations: Record<string, TranslationStrings> = {
    tr: {
      title: 'Şifremi Unuttum',
      subtitle: 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim',
      email: 'E-posta Adresi',
      emailPlaceholder: 'E-posta adresinizi girin',
      sendCode: 'Kod Gönder',
      sending: 'Gönderiliyor...',
      verificationCode: 'Doğrulama Kodu',
      codePlaceholder: '6 haneli kodu girin',
      newPassword: 'Yeni Şifre',
      newPasswordPlaceholder: 'Yeni şifrenizi girin',
      resetPassword: 'Şifreyi Sıfırla',
      resetting: 'Sıfırlanıyor...',
      verifyCode: 'Kodu Doğrula',
      verifying: 'Doğrulanıyor...',
      backToSignIn: 'Giriş Sayfasına Dön',
      codeDescription: 'E-posta adresinize gönderilen 6 haneli kodu girin',
      resetDescription: 'Yeni şifrenizi belirleyin',
      emailSent: 'Doğrulama kodu e-posta adresinize gönderildi.',
      passwordReset: 'Şifreniz başarıyla sıfırlandı. Giriş sayfasına yönlendiriliyorsunuz...',
      errorGeneral: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      errorInvalidEmail: 'Geçerli bir e-posta adresi girin.',
      errorInvalidCode: 'Geçersiz doğrulama kodu.',
      errorUserNotFound: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.',
      resendCode: 'Kodu Tekrar Gönder',
      resending: 'Tekrar gönderiliyor...'
    },
    en: {
      title: 'Forgot Password',
      subtitle: 'Enter your email address and we\'ll send you a password reset link',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      sendCode: 'Send Code',
      sending: 'Sending...',
      verificationCode: 'Verification Code',
      codePlaceholder: 'Enter 6-digit code',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter your new password',
      resetPassword: 'Reset Password',
      resetting: 'Resetting...',
      verifyCode: 'Verify Code',
      verifying: 'Verifying...',
      backToSignIn: 'Back to Sign In',
      codeDescription: 'Enter the 6-digit code sent to your email address',
      resetDescription: 'Set your new password',
      emailSent: 'Verification code has been sent to your email address.',
      passwordReset: 'Your password has been successfully reset. Redirecting to sign in...',
      errorGeneral: 'An error occurred. Please try again.',
      errorInvalidEmail: 'Please enter a valid email address.',
      errorInvalidCode: 'Invalid verification code.',
      errorUserNotFound: 'No user found with this email address.',
      resendCode: 'Resend Code',
      resending: 'Resending...'
    }
  };

  const normalizedLocale = locale?.toLowerCase() === 'tr' ? 'tr' : 'en';
  const t = translations[normalizedLocale];

  // Step 1: Send reset code
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    try {
      setLoading(true);
      setError("");
      
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      
      setSuccess(t.emailSent);
      setStep('code');
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ code?: string }> };
      if (error.errors?.[0]?.code === "form_identifier_not_found") {
        setError(t.errorUserNotFound);
      } else {
        setError(t.errorGeneral);
      }
      console.error("Send code error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and reset password
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    try {
      setLoading(true);
      setError("");
      
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code,
        password: newPassword,
      });

      if (result.status === "complete") {
        // Set the session to automatically sign in the user
        await setActive({ session: result.createdSessionId });
        
        setSuccess(t.passwordReset);
        
        // Wait a bit for the success message to be visible
        setTimeout(() => {
          // Force reload and redirect to homepage
          window.location.href = `/${normalizedLocale}`;
        }, 2000);
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ code?: string }> };
      if (error.errors?.[0]?.code === "form_code_incorrect") {
        setError(t.errorInvalidCode);
      } else {
        setError(t.errorGeneral);
      }
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      setError("");
      
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      
      setSuccess(t.emailSent);
    } catch (err: unknown) {
      setError(t.errorGeneral);
      console.error("Resend code error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {t.title}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {step === 'email' && t.subtitle}
          {step === 'code' && t.codeDescription}
          {step === 'reset' && t.resetDescription}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 flex items-center rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
          <CheckCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Email Input */}
      {step === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.email}
            </label>
            <div className="mt-1 relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 pl-10 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500 sm:text-sm"
                placeholder={t.emailPlaceholder}
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.sending}
                </>
              ) : (
                t.sendCode
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Code and New Password */}
      {(step === 'code' || step === 'reset') && (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.verificationCode}
            </label>
            <div className="mt-1">
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500 sm:text-sm"
                placeholder={t.codePlaceholder}
              />
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.newPassword}
            </label>
            <div className="mt-1">
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500 sm:text-sm"
                placeholder={t.newPasswordPlaceholder}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !code || !newPassword}
              className="flex w-full justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.resetting}
                </>
              ) : (
                t.resetPassword
              )}
            </button>
          </div>

          {/* Resend Code Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-70"
            >
              {loading ? t.resending : t.resendCode}
            </button>
          </div>
        </form>
      )}

      {/* Back to Sign In */}
      <div className="mt-8 text-center">
        <Link
          href={`/${locale}/login?tab=signin`}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {t.backToSignIn}
        </Link>
      </div>
    </div>
  );
}