// app/[locale]/(auth)/verify-email/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSignUp } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Loader2, CheckCircle, Mail } from "lucide-react";

interface VerifyEmailPageProps {
  params: Promise<{ locale: string }>;
}

// Define translation strings interface for type safety
interface TranslationStrings {
  title: string;
  subtitle: string;
  verificationCode: string;
  codePlaceholder: string;
  verifyButton: string;
  verifying: string;
  resendCode: string;
  resending: string;
  backToSignUp: string;
  emailVerified: string;
  errorGeneral: string;
  errorInvalidCode: string;
  codeSent: string;
  welcome: string;
  description: string;
}

// Define error type for better type safety
interface AuthError {
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
  message?: string;
}

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ locale: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentImage, setCurrentImage] = useState(1);

  // Localization - memoized for performance (always call, regardless of resolvedParams)
  const translations = useMemo(() => ({
    tr: {
      title: 'E-postanızı Doğrulayın',
      subtitle: 'E-posta adresinize gönderilen doğrulama kodunu girin',
      verificationCode: 'Doğrulama Kodu',
      codePlaceholder: '6 haneli kodu girin',
      verifyButton: 'Doğrula',
      verifying: 'Doğrulanıyor...',
      resendCode: 'Kodu Tekrar Gönder',
      resending: 'Tekrar gönderiliyor...',
      backToSignUp: 'Kayıt Sayfasına Dön',
      emailVerified: 'E-postanız başarıyla doğrulandı! Yönlendiriliyorsunuz...',
      errorGeneral: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      errorInvalidCode: 'Geçersiz doğrulama kodu.',
      codeSent: 'Doğrulama kodu tekrar gönderildi.',
      welcome: 'MyUNI\'ye Hoş Geldin!',
      description: 'Hesabınızı doğrulayarak MyUNI deneyiminizi başlatın.'
    } as TranslationStrings,
    en: {
      title: 'Verify Your Email',
      subtitle: 'Enter the verification code sent to your email address',
      verificationCode: 'Verification Code',
      codePlaceholder: 'Enter 6-digit code',
      verifyButton: 'Verify',
      verifying: 'Verifying...',
      resendCode: 'Resend Code',
      resending: 'Resending...',
      backToSignUp: 'Back to Sign Up',
      emailVerified: 'Your email has been successfully verified! Redirecting...',
      errorGeneral: 'An error occurred. Please try again.',
      errorInvalidCode: 'Invalid verification code.',
      codeSent: 'Verification code has been resent.',
      welcome: 'Welcome to MyUNI!',
      description: 'Verify your account to begin your MyUNI experience.'
    } as TranslationStrings
  }), []);

  // Get locale from resolvedParams or fallback
  const locale = resolvedParams?.locale || 'en';
  const normalizedLocale = locale?.toLowerCase() === 'tr' ? 'tr' : 'en';
  const t = translations[normalizedLocale];

  // Resolve params
  useEffect(() => {
    if (params) {
      params.then(setResolvedParams);
    }
  }, [params]);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Image rotation effect
  useEffect(() => {
    if (!mounted) return;

    const imageInterval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage >= 5 ? 1 : prevImage + 1));
    }, 4000);

    return () => clearInterval(imageInterval);
  }, [mounted]);

  // Image Slider Component - Memoized to prevent unnecessary re-renders
  const ImageSlider = useMemo(() => {
    const ImageSliderComponent = () => (
      <div className="relative h-full w-full bg-white dark:bg-neutral-900 rounded-lg overflow-hidden group">
        {[1, 2, 3, 4, 5].map((imgNum) => (
          <div
            key={imgNum}
            className={`transition-opacity duration-1000 absolute inset-0 ${
              currentImage === imgNum ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={`/tr/images/myuni-egitim-platformu-${imgNum}.webp`}
              alt={`MyUNI Eğitim Platformu ${imgNum}`}
              fill
              className="object-cover transition-transform transform group-hover:scale-105 duration-700 ease-in-out"
              priority={imgNum === 1}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/5 via-transparent to-transparent pointer-events-none" />
      </div>
    );
    
    ImageSliderComponent.displayName = 'ImageSlider';
    return ImageSliderComponent;
  }, [currentImage]);

  // Mobile Welcome Image Component - Memoized separately
  const MobileWelcomeImage = useMemo(() => {
    const MobileWelcomeImageComponent = () => (
      <div className="lg:hidden mb-6">
        <div className="relative h-48 w-full bg-white dark:bg-neutral-900 rounded-lg overflow-hidden">
          <div className={`transition-opacity duration-1000 absolute inset-0`}>
            <Image
              src={`/tr/images/myuni-egitim-platformu-${currentImage}.webp`}
              alt={`MyUNI Eğitim Platformu ${currentImage}`}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute inset-0 flex items-end p-6">
            <div className="bg-white/90 dark:bg-neutral-800/90 rounded-lg p-4 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                {t.welcome}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
    
    MobileWelcomeImageComponent.displayName = 'MobileWelcomeImage';
    return MobileWelcomeImageComponent;
  }, [currentImage, t.welcome]);

  // Return null while not mounted or params not resolved
  if (!mounted || !resolvedParams) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-900">
      {/* Form Section - Left Side */}
      <div className="flex flex-1 lg:w-1/2 flex-col justify-center py-8 px-6 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="text-left mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {t.subtitle}
            </p>
          </div>

          {/* Mobile Welcome Image */}
          <MobileWelcomeImage />

          {/* Verify Email Form */}
          <VerifyEmailForm locale={locale} t={t} normalizedLocale={normalizedLocale} />
        </div>
      </div>

      {/* Image Section - Right Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 p-8">
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center">
          {/* Welcome Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white/90 dark:bg-neutral-800/90 rounded-xl p-8 backdrop-blur-sm shadow-lg max-w-xl transform transition-transform duration-300 hover:scale-105">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-neutral-100 sm:text-3xl">
                  {t.welcome}
                </h2>
                <p className="mt-4 leading-relaxed text-gray-800 dark:text-neutral-300">
                  {t.description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Background Image Slider */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <ImageSlider />
          </div>
        </div>
      </div>
    </div>
  );
}

interface VerifyEmailFormProps {
  locale: string;
  t: TranslationStrings;
  normalizedLocale: string;
}

function VerifyEmailForm({ locale, t, normalizedLocale }: VerifyEmailFormProps) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if verification is already complete on component mount
  useEffect(() => {
    console.log("=== VERIFY EMAIL MOUNT DEBUG ===");
    console.log("isLoaded:", isLoaded);
    console.log("signUp:", !!signUp);
    console.log("signUp status:", signUp?.status);
    console.log("signUp verifications:", signUp?.verifications);
    console.log("signUp createdSessionId:", !!signUp?.createdSessionId);
    console.log("================================");
    
    if (isLoaded && signUp) {
      // If signup is already complete, redirect to complete profile
      if (signUp.status === "complete" && signUp.createdSessionId) {
        console.log("✅ SignUp already complete with session ID, setting session...");
        setActive({ session: signUp.createdSessionId }).then(() => {
          console.log("Session set successfully, redirecting to complete-profile");
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/complete-profile`;
          }, 1000);
        }).catch((err: unknown) => {
          console.error("❌ Failed to set session on mount:", err);
          // Even if session fails, try to redirect
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/complete-profile`;
          }, 1000);
        });
        return;
      }
      
      // If email is already verified
      if (signUp.verifications?.emailAddress?.status === "verified") {
        console.log("✅ Email already verified on mount");
        
        if (signUp.status === "complete") {
          // Signup is complete, set session and redirect
          if (signUp.createdSessionId) {
            setActive({ session: signUp.createdSessionId }).then(() => {
              setSuccess(t.emailVerified);
              setTimeout(() => {
                window.location.href = `/${normalizedLocale}/complete-profile`;
              }, 1000);
            }).catch((err: unknown) => {
              console.error("Session setting failed:", err);
              setSuccess(t.emailVerified + " " + (normalizedLocale === 'tr' ? 
                'Lütfen giriş sayfasından devam edin.' : 
                'Please continue from the login page.'
              ));
              setTimeout(() => {
                window.location.href = `/${normalizedLocale}/login?tab=signin`;
              }, 3000);
            });
          } else {
            // No session ID, redirect to login
            setSuccess(normalizedLocale === 'tr' ? 
              'E-posta doğrulandı ancak oturum oluşturulamadı. Lütfen giriş yapın.' : 
              'Email verified but session could not be created. Please sign in.'
            );
            setTimeout(() => {
              window.location.href = `/${normalizedLocale}/login?tab=signin`;
            }, 3000);
          }
        } else {
          // Email verified but signup not complete - still show form
          setSuccess(normalizedLocale === 'tr' ? 
            'E-posta zaten doğrulanmış. Kodu tekrar girerek devam edebilirsiniz.' : 
            'Email already verified. You can continue by entering the code again.'
          );
        }
      }
    }
    
    // If no signUp instance, redirect to signup
    if (isLoaded && !signUp) {
      console.log("❌ No signUp instance found, redirecting to signup");
      
      // Show a message that email verification is no longer required
      setSuccess(normalizedLocale === 'tr' ? 
        'E-posta doğrulaması artık gerekli değil. Kayıt sayfasına yönlendiriliyorsunuz...' : 
        'Email verification is no longer required. Redirecting to signup page...'
      );
      
      setTimeout(() => {
        window.location.href = `/${normalizedLocale}/login?tab=signup`;
      }, 2000);
    }
  }, [isLoaded, signUp, normalizedLocale, t.emailVerified, setActive]);

  const handleVerifyEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isLoaded || !signUp) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      console.log("=== EMAIL VERIFICATION ATTEMPT ===");
      console.log("Code entered:", code);
      console.log("SignUp status before:", signUp.status);
      console.log("Email verification status before:", signUp.verifications?.emailAddress?.status);
      
      // Check if already verified before attempting
      if (signUp.verifications?.emailAddress?.status === "verified") {
        console.log("✅ Email already verified, attempting to complete signup...");
        
        // Email already verified, try to complete signup
        if (signUp.status === "complete") {
          console.log("SignUp already complete, setting session...");
          await setActive({ session: signUp.createdSessionId });
          setSuccess(t.emailVerified);
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/complete-profile`;
          }, 1000);
        } else {
          console.log("Email verified but signup not complete, redirecting anyway...");
          setSuccess(t.emailVerified);
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/complete-profile`;
          }, 1000);
        }
        return;
      }
      
      // Attempt email verification
      const result = await signUp.attemptEmailAddressVerification({
        code: code,
      });

      console.log("Verification result status:", result.status);
      console.log("Verification result:", result);
      console.log("Created session ID:", result.createdSessionId);

      if (result.status === "complete" && result.createdSessionId) {
        console.log("✅ Verification complete with session ID");
        
        // Debug: Save verification success
        localStorage.setItem('myuni_verification_success', JSON.stringify({
          sessionId: result.createdSessionId,
          userEmail: signUp.emailAddress,
          timestamp: new Date().toISOString()
        }));
        
        // Set the session first
        try {
          await setActive({ session: result.createdSessionId });
          console.log("✅ Session set successfully");
          
          // Debug: Save session success
          localStorage.setItem('myuni_session_success', JSON.stringify({
            sessionId: result.createdSessionId,
            timestamp: new Date().toISOString()
          }));
          
          setSuccess(t.emailVerified);
          
          // Force a user data refresh before redirect
          setTimeout(async () => {
            console.log("Checking user data before redirect...");
            
            // Manual check if user is loaded
            try {
              const response = await fetch('/api/auth/user-check', {
                method: 'GET',
                credentials: 'include'
              });
              
              if (response.ok) {
                console.log("User data confirmed, redirecting...");
                window.location.href = `/${normalizedLocale}/complete-profile`;
              } else {
                throw new Error('User data not confirmed');
              }
            } catch (userCheckError: unknown) {
              console.warn("User check failed, forcing redirect anyway:", userCheckError);
              
              // Show message to user and redirect to login with success message
              setSuccess(t.emailVerified + " " + (normalizedLocale === 'tr' ? 
                'Hesabınız oluşturuldu! Giriş sayfasından devam edebilirsiniz.' : 
                'Your account has been created! You can continue from the login page.'
              ));
              
              setTimeout(() => {
                window.location.href = `/${normalizedLocale}/login?tab=signin&message=account_created&email=${encodeURIComponent(signUp.emailAddress || '')}`;
              }, 3000);
            }
          }, 2000);
          
        } catch (sessionError: unknown) {
          console.error("❌ Failed to set session:", sessionError);
          
          const authError = sessionError as AuthError;
          // Debug: Save session error
          localStorage.setItem('myuni_session_error', JSON.stringify({
            error: authError?.message || 'Unknown session error',
            sessionId: result.createdSessionId,
            timestamp: new Date().toISOString()
          }));
          
          // Account created but session failed - redirect to login
          setSuccess(t.emailVerified + " " + (normalizedLocale === 'tr' ? 
            'Hesabınız başarıyla oluşturuldu! Lütfen giriş sayfasından email ve şifrenizle giriş yapın.' : 
            'Your account has been successfully created! Please sign in using your email and password.'
          ));
          
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/login?tab=signin&message=account_created&email=${encodeURIComponent(signUp.emailAddress || '')}`;
          }, 4000);
        }
        
      } else if (result.status === "complete" && !result.createdSessionId) {
        console.log("⚠️ Verification complete but no session ID");
        
        setSuccess(t.emailVerified + " " + (normalizedLocale === 'tr' ? 
          'Ancak oturum oluşturulamadı. Lütfen giriş yapın.' : 
          'But session could not be created. Please sign in.'
        ));
        
        setTimeout(() => {
          window.location.href = `/${normalizedLocale}/login?tab=signin`;
        }, 3000);
        
      } else if (result.status === "missing_requirements") {
        console.log("⚠️ Email verified but other requirements missing");
        console.log("Missing requirements - verifications:", result.verifications);
        
        // Email verification successful but other things needed
        const emailVerified = result.verifications?.emailAddress?.status === "verified";
        
        if (emailVerified) {
          setSuccess(normalizedLocale === 'tr' ? 
            'E-posta doğrulandı! Hesap kurulumu tamamlanıyor...' : 
            'Email verified! Completing account setup...'
          );
          
          // Try to complete signup anyway
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/complete-profile`;
          }, 2000);
        } else {
          setError(normalizedLocale === 'tr' ? 
            'E-posta doğrulaması tamamlanamadı.' : 
            'Email verification could not be completed.'
          );
        }
        
      } else {
        // Handle incomplete verification
        console.log("❌ Verification incomplete, status:", result.status);
        setError(normalizedLocale === 'tr' ? 
          'E-posta doğrulaması tamamlanamadı. Lütfen tekrar deneyin.' : 
          'Email verification could not be completed. Please try again.'
        );
      }
      
    } catch (err: unknown) {
      console.error("❌ Email verification error:", err);
      
      const authError = err as AuthError;
      console.error("Error details:", authError.errors);
      
      // Handle specific error cases
      if (authError.errors?.[0]?.code === "verification_failed") {
        setError(t.errorInvalidCode);
      } else if (authError.errors?.[0]?.code === "verification_expired") {
        setError(normalizedLocale === 'tr' ? 'Doğrulama kodu süresi dolmuş. Yeni kod talep edin.' : 'Verification code has expired. Please request a new code.');
      } else if (authError.errors?.[0]?.message?.includes("already been verified") || 
                 authError.errors?.[0]?.code === "verification_already_verified") {
        console.log("✅ Email already verified (from error), attempting completion...");
        
        // Already verified - try to complete signup
        try {
          if (signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId });
          }
          setSuccess(t.emailVerified);
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/complete-profile`;
          }, 1000);
        } catch (sessionErr: unknown) {
          console.error("Session error after verification:", sessionErr);
          setSuccess(t.emailVerified + " " + (normalizedLocale === 'tr' ? 
            'Lütfen giriş sayfasından devam edin.' : 
            'Please continue from the login page.'
          ));
          setTimeout(() => {
            window.location.href = `/${normalizedLocale}/login?tab=signin`;
          }, 3000);
        }
      } else {
        setError(t.errorGeneral + " " + (authError.errors?.[0]?.message || authError.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      // Check if already verified
      if (signUp.verifications?.emailAddress?.status === "verified") {
        setSuccess(t.emailVerified);
        setTimeout(() => {
          window.location.href = `/${normalizedLocale}/complete-profile`;
        }, 1000);
        return;
      }
      
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setSuccess(t.codeSent);
    } catch (err: unknown) {
      console.error("Resend code error:", err);
      const authError = err as AuthError;
      if (authError.errors?.[0]?.message?.includes("already been verified")) {
        setSuccess(t.emailVerified);
        setTimeout(() => {
          window.location.href = `/${normalizedLocale}/complete-profile`;
        }, 1000);
      } else {
        setError(t.errorGeneral);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading if signup status is being checked
  if (!isLoaded || !signUp) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <div>
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

      <form onSubmit={handleVerifyEmail} className="space-y-6">
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
              className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-lg tracking-widest text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500"
              placeholder={t.codePlaceholder}
              disabled={loading || !!success}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || code.length !== 6 || !!success}
            className="flex w-full justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.verifying}
              </>
            ) : (
              t.verifyButton
            )}
          </button>
        </div>

        {/* Resend Code Button */}
        {!success && (
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
        )}
      </form>

      {/* Navigation Links */}
      <div className="mt-8 space-y-4">
        {/* Back to Sign Up */}
        {!success && (
          <div className="text-center">
            <Link
              href={`/${locale}/login?tab=signup`}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {t.backToSignUp}
            </Link>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            {normalizedLocale === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}