'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Loader2, Mail, Lock, User } from 'lucide-react';

interface AuthPageContentProps {
  locale: string;
}

interface ClerkAPIError {
  status: number;
  message?: string;
  code?: string;
  errors?: Array<{
    code: string;
    message: string;
    longMessage?: string;
    meta?: Record<string, unknown>;
  }>;
}

export default function AuthPageContent({ locale }: AuthPageContentProps) {
  // State management
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(1);
  
  // Clerk hooks
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

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

  // Redirect if already signed in
  useEffect(() => {
    if (mounted && (signInLoaded || signUpLoaded) && isSignedIn) {
      router.push(`/${locale}`);
    }
  }, [mounted, signInLoaded, signUpLoaded, isSignedIn, router, locale]);

  // Localization content
  const t = {
    title: locale === 'tr' ? 'MyUNI\'ye Hoşgeldiniz' : 'Welcome to MyUNI',
    subtitle: locale === 'tr' 
      ? 'Eğitim yolculuğunuza başlamak için giriş yapın veya hesap oluşturun'
      : 'Sign in to your account or create a new one to start your learning journey',
    
    tabs: {
      signin: locale === 'tr' ? 'Giriş Yap' : 'Sign In',
      signup: locale === 'tr' ? 'Hesap Oluştur' : 'Sign Up'
    },
    
    signin: {
      title: locale === 'tr' ? 'Hesabınıza Giriş Yapın' : 'Sign In to Your Account',
      description: locale === 'tr' ? 'Giriş yaparak özel içeriklere erişin' : 'Sign in to access exclusive content'
    },
    
    signup: {
      title: locale === 'tr' ? 'Yeni Hesap Oluşturun' : 'Create New Account',
      description: locale === 'tr' ? 'Ücretsiz hesap oluşturun ve öğrenmeye başlayın' : 'Create a free account and start learning'
    },
    
    form: {
      firstName: locale === 'tr' ? 'Ad' : 'First Name',
      firstNamePlaceholder: locale === 'tr' ? 'Adınızı girin' : 'Enter your first name',
      lastName: locale === 'tr' ? 'Soyad' : 'Last Name',
      lastNamePlaceholder: locale === 'tr' ? 'Soyadınızı girin' : 'Enter your last name',
      email: locale === 'tr' ? 'E-posta Adresi' : 'Email Address',
      emailPlaceholder: locale === 'tr' ? 'E-posta adresinizi girin' : 'Enter your email address',
      password: locale === 'tr' ? 'Şifre' : 'Password',
      passwordPlaceholder: locale === 'tr' ? 'Şifrenizi girin' : 'Enter your password',
      rememberMe: locale === 'tr' ? 'Beni Hatırla' : 'Remember Me',
      forgotPassword: locale === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password?',
      signinButton: locale === 'tr' ? 'Giriş Yap' : 'Sign In',
      signupButton: locale === 'tr' ? 'Hesap Oluştur' : 'Create Account',
      loading: locale === 'tr' ? 'İşlem yapılıyor...' : 'Processing...',
      orDivider: locale === 'tr' ? 'veya' : 'or',
      continueWithGoogle: locale === 'tr' ? 'Google ile Devam Et' : 'Continue with Google',
      continueWithMicrosoft: locale === 'tr' ? 'Microsoft ile Devam Et' : 'Continue with Microsoft',
      continueWithApple: locale === 'tr' ? 'Apple ile Devam Et' : 'Continue with Apple'
    },
    
    footer: {
      text: locale === 'tr' ? 'Hesap oluşturarak' : 'By creating an account, you agree to our',
      terms: locale === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service',
      and: locale === 'tr' ? 've' : 'and',
      privacy: locale === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy',
      accept: locale === 'tr' ? '\'nı kabul etmiş olursunuz.' : '.'
    },
    
    urls: {
      terms: locale === 'tr' ? '/tr/kullanim-kosullari' : '/en/terms-of-service',
      privacy: locale === 'tr' ? '/tr/gizlilik-politikasi' : '/en/privacy-policy'
    },

    imageOverlays: locale === 'tr' 
      ? [
          "Eğitimde Kalite ve Yenilik",
          "Hedefinize Adım Adım Ulaşın",
          "Uzman Eğitmenlerle Öğrenin",
          "Sertifikalı Eğitim Programları",
          "Geleceğe Yatırım Yapın"
        ]
      : [
          "Quality and Innovation in Education",
          "Reach Your Goal Step by Step",
          "Learn with Expert Instructors",
          "Certified Training Programs",
          "Invest in the Future"
        ]
  };

  // Sign in handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signIn) return;

    try {
      setLoading(true);
      setError('');

      const result = await signIn.create({
        identifier: email.trim(),
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(`/${locale}`);
      } else {
        setError(locale === 'tr'
          ? 'Giriş tamamlanamadı. Lütfen tekrar deneyin.'
          : 'Sign-in could not be completed. Please try again.'
        );
      }
    } catch (err: unknown) {
      const clerkError = err as ClerkAPIError;
      let errorMessage = locale === 'tr'
        ? 'Giriş sırasında bir hata oluştu.'
        : 'An error occurred during sign-in.';

      if (clerkError.errors && clerkError.errors.length > 0) {
        const firstError = clerkError.errors[0];
        switch (firstError.code) {
          case 'form_identifier_not_found':
            errorMessage = locale === 'tr'
              ? 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.'
              : 'No account found with this email address.';
            break;
          case 'form_password_incorrect':
            errorMessage = locale === 'tr'
              ? 'Hatalı şifre. Lütfen tekrar deneyin.'
              : 'Incorrect password. Please try again.';
            break;
          default:
            errorMessage = firstError.message || errorMessage;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;

    try {
      setLoading(true);
      setError('');

      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        password: password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      router.push(`/${locale}`);
      
    } catch (err: unknown) {
      const clerkError = err as ClerkAPIError;
      let errorMessage = locale === 'tr'
        ? 'Hesap oluşturma sırasında bir hata oluştu.'
        : 'An error occurred during account creation.';

      if (clerkError.errors && clerkError.errors.length > 0) {
        const firstError = clerkError.errors[0];
        errorMessage = firstError.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Social sign in handler
  const handleSocialSignIn = async (strategy: 'oauth_google' | 'oauth_microsoft' | 'oauth_apple') => {
    if (!signInLoaded || !signIn) return;

    try {
      setLoading(true);
      setError('');
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `/${locale}`,
        redirectUrlComplete: `/${locale}`
      });
    } catch (err: unknown) {
      const clerkError = err as ClerkAPIError;
      let errorMessage = locale === 'tr'
        ? 'Sosyal medya girişi sırasında bir hata oluştu.'
        : 'An error occurred during social sign-in.';

      if (clerkError.errors && clerkError.errors.length > 0) {
        const firstError = clerkError.errors[0];
        errorMessage = firstError.message || errorMessage;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Social sign up handler
  const handleSocialSignUp = async (strategy: 'oauth_google' | 'oauth_microsoft' | 'oauth_apple') => {
    if (!signUpLoaded || !signUp) return;

    try {
      setLoading(true);
      setError('');
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: `/${locale}`,
        redirectUrlComplete: `/${locale}`
      });
    } catch (err: unknown) {
      const clerkError = err as ClerkAPIError;
      let errorMessage = locale === 'tr'
        ? 'Sosyal medya kaydı sırasında bir hata oluştu.'
        : 'An error occurred during social sign-up.';

      if (clerkError.errors && clerkError.errors.length > 0) {
        const firstError = clerkError.errors[0];
        errorMessage = firstError.message || errorMessage;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Image Slider Component
  const ImageSlider = () => {
    return (
      <div className="relative h-full w-full bg-white dark:neutral-900  rounded-lg overflow-hidden group">
        {/* Image Stack */}
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
        
        

        

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/5 via-transparent to-transparent pointer-events-none" />

        
      </div>
    );
  };

  // Return null while loading or if already signed in
  if (!mounted || ((signInLoaded || signUpLoaded) && isSignedIn)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-900">
      {/* Form Section - Left Side */}
      <div className="flex flex-1 lg:w-1/2 flex-col justify-center py-8 px-6 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="text-left">
           
            <h2 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {t.subtitle}
            </p>
          </div>

          {/* Main Form Section */}
          <div className="mt-8">
            {/* Tab Navigation */}
            <div className="flex bg-neutral-200 dark:bg-neutral-600 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {t.tabs.signin}
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'signup'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {t.tabs.signup}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center rounded bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-300">
                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'signin' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t.signin.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.signin.description}</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Social Sign In Buttons */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSocialSignIn('oauth_google')}
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#990000] disabled:opacity-60 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {t.form.continueWithGoogle}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialSignIn('oauth_microsoft')}
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#990000] disabled:opacity-60 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#f25022" d="M1 1h10v10H1z"/>
                        <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                        <path fill="#7fba00" d="M1 13h10v10H1z"/>
                        <path fill="#ffb900" d="M13 13h10v10H13z"/>
                      </svg>
                      {t.form.continueWithMicrosoft}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialSignIn('oauth_apple')}
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#990000] disabled:opacity-60 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      {t.form.continueWithApple}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-300 dark:border-neutral-500" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-neutral-100 dark:bg-neutral-900 px-2 text-neutral-500 dark:text-neutral-400">{t.form.orDivider}</span>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="signin-email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      {t.form.email}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail className="h-4 w-4 text-neutral-400 dark:text-neutral-100" />
                      </div>
                      <input
                        id="signin-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-600 pl-10 pr-4 py-2 text-neutral-900 dark:text-neutral-100 focus:border-[#990000] focus:ring-[#990000] text-sm placeholder-neutral-400 dark:placeholder-neutral-100"
                        placeholder={t.form.emailPlaceholder}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="signin-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      {t.form.password}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock className="h-4 w-4 text-neutral-400 dark:text-neutral-100" />
                      </div>
                      <input
                        id="signin-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-600 pl-10 pr-4 py-2 text-neutral-900 dark:text-neutral-100 focus:border-[#990000] focus:ring-[#990000] text-sm placeholder-neutral-400 dark:placeholder-neutral-100"
                        placeholder={t.form.passwordPlaceholder}
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-500 text-[#990000] focus:ring-[#990000] bg-white dark:bg-neutral-600"
                      />
                      <label htmlFor="remember-me" className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {t.form.rememberMe}
                      </label>
                    </div>
                    <Link href="#" className="text-sm font-medium text-[#990000] hover:text-[#770000]">
                      {t.form.forgotPassword}
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="flex w-full justify-center rounded bg-[#990000] px-4 py-2 text-sm font-medium text-white hover:bg-[#770000] focus:outline-none disabled:opacity-60 transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.form.loading}
                      </>
                    ) : (
                      t.form.signinButton
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Sign Up Form */}
            {activeTab === 'signup' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t.signup.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.signup.description}</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Social Sign Up Buttons */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSocialSignUp('oauth_google')}
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#990000] disabled:opacity-60 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {t.form.continueWithGoogle}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialSignUp('oauth_microsoft')}
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#990000] disabled:opacity-60 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#f25022" d="M1 1h10v10H1z"/>
                        <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                        <path fill="#7fba00" d="M1 13h10v10H1z"/>
                        <path fill="#ffb900" d="M13 13h10v10H13z"/>
                      </svg>
                      {t.form.continueWithMicrosoft}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialSignUp('oauth_apple')}
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#990000] disabled:opacity-60 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      {t.form.continueWithApple}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-300 dark:border-neutral-500" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-neutral-100 dark:bg-neutral-900 px-2 text-neutral-500 dark:text-neutral-400">{t.form.orDivider}</span>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        {t.form.firstName}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <User className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <input
                          id="firstName"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="block w-full rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-600 pl-10 pr-4 py-2 text-neutral-900 dark:text-neutral-100 focus:border-[#990000] focus:ring-[#990000] text-sm placeholder-neutral-400 dark:placeholder-neutral-500"
                          placeholder={t.form.firstNamePlaceholder}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        {t.form.lastName}
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-600 px-4 py-2 text-neutral-900 dark:text-neutral-100 focus:border-[#990000] focus:ring-[#990000] text-sm placeholder-neutral-400 dark:placeholder-neutral-500"
                        placeholder={t.form.lastNamePlaceholder}
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      {t.form.email}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <input
                        id="signup-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-600 pl-10 pr-4 py-2 text-neutral-900 dark:text-neutral-100 focus:border-[#990000] focus:ring-[#990000] text-sm placeholder-neutral-400 dark:placeholder-neutral-500"
                        placeholder={t.form.emailPlaceholder}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      {t.form.password}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <input
                        id="signup-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-600 pl-10 pr-4 py-2 text-neutral-900 dark:text-neutral-100 focus:border-[#990000] focus:ring-[#990000] text-sm placeholder-neutral-400 dark:placeholder-neutral-500"
                        placeholder={t.form.passwordPlaceholder}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !email || !password || !firstName || !lastName}
                    className="flex w-full justify-center rounded bg-[#990000] px-4 py-2 text-sm font-medium text-white hover:bg-[#770000] focus:outline-none disabled:opacity-60 transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.form.loading}
                      </>
                    ) : (
                      t.form.signupButton
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t.footer.text}{' '}
                <a href={t.urls.terms} className="text-[#990000] hover:underline">
                  {t.footer.terms}
                </a>{' '}
                {t.footer.and}{' '}
                <a href={t.urls.privacy} className="text-[#990000] hover:underline">
                  {t.footer.privacy}
                </a>
                {t.footer.accept}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Slider Section - Right Side (Hidden on Mobile, Visible on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 p-8">
        <div className="w-full h-full min-h-[600px]">
          <ImageSlider />
        </div>
      </div>
    </div>
  );
}