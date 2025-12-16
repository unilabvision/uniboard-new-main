'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

// Next.js sayfa props interface'i - Promise olarak tanımlandı
interface AuthPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Define proper types for authentication errors
interface AuthError {
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
}

interface AuthTexts {
  title: string;
  subtitle: string;
  tabs: {
    signin: string;
    signup: string;
  };
  signin: {
    title: string;
    description: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    signInButton: string;
    loading: string;
    orContinue: string;
    forgotPassword: string;
    noAccount: string;
    signUp: string;
    errorGeneral: string;
    errorCredentials: string;
  };
  signup: {
    title: string;
    description: string;
    firstName: string;
    firstNamePlaceholder: string;
    lastName: string;
    lastNamePlaceholder: string;
    username: string;
    usernamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    signUpButton: string;
    loading: string;
    continueWithGoogle: string;
    orDivider: string;
    agreeToTerms: string;
    hasAccount: string;
    signIn: string;
    errorGeneral: string;
    termsError: string;
    securedBy: string;
    verificationTitle: string;
    verificationDescription: string;
    verificationCode: string;
    verificationCodePlaceholder: string;
    verifyButton: string;
    resendCode: string;
    verificationError: string;
    resendSuccess: string;
  };
  footer: {
    text: string;
    terms: string;
    and: string;
    privacy: string;
    accept: string;
  };
  urls: {
    terms: string;
    privacy: string;
  };
  backToHome: string;
  welcomeSignup: string;
  signupDescription: string;
}

interface TranslationsType {
  tr: AuthTexts;
  en: AuthTexts;
}

// Ana sayfa bileşeni - use() hook kullanarak Promise'i resolve ediyoruz
export default function AuthPage({ params }: AuthPageProps) {
  const resolvedParams = use(params);
  const { locale } = resolvedParams;
  
  return <AuthPageContent locale={locale} />;
}

// İçerik bileşeni
function AuthPageContent({ locale }: { locale: string }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [currentImage, setCurrentImage] = useState(1);

  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get('tab') || 'signin';
  const messageFromUrl = searchParams.get('message');
  const emailFromUrl = searchParams.get('email');
  const currentLocale = locale || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'en');
  const redirectUrl = searchParams.get('redirect') || `/${currentLocale}`;

  // Mount ve tab yönetimi
  useEffect(() => {
    setMounted(true);
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Scroll çözümü - ayrı effect
  useEffect(() => {
    if (mounted) {
      // Multiple scroll attempts for better reliability
      const scrollToTop = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      // Immediate scroll
      scrollToTop();

      // Delayed scroll for slower devices
      const timer1 = setTimeout(scrollToTop, 50);
      const timer2 = setTimeout(scrollToTop, 150);
      const timer3 = setTimeout(scrollToTop, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [mounted]);

  // Tab değişikliğinde scroll
  useEffect(() => {
    if (mounted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, mounted]);

  // Görsel döngüsü
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Oturum açıkken yönlendirme
  useEffect(() => {
    if (mounted && isSignedIn) {
      const finalRedirectUrl = searchParams.get('redirect') || redirectUrl;
      router.push(finalRedirectUrl);
    }
  }, [mounted, isSignedIn, router, redirectUrl, searchParams]);

  // Sekme değiştirme
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      router.push(url.pathname + url.search, { scroll: false });
    },
    [router]
  );

// Şimdi translations objesini tip tanımıyla güncelleyin:
const translations: TranslationsType = useMemo(
  () => ({
    tr: {
      title: 'MyUNI\'ye Hoşgeldiniz',
      subtitle: 'Eğitim yolculuğunuza başlamak için giriş yapın veya hesap oluşturun',
      tabs: { signin: 'Giriş Yap', signup: 'Hesap Oluştur' },
      signin: {
        title: 'Hesabınıza Giriş Yapın',
        description: 'Giriş yaparak özel içeriklere erişin',
        email: 'E-posta Adresi',
        emailPlaceholder: 'E-posta adresinizi girin',
        password: 'Şifre',
        passwordPlaceholder: 'Şifrenizi girin',
        signInButton: 'Giriş Yap',
        loading: 'Giriş yapılıyor...',
        orContinue: 'Veya şununla devam et',
        forgotPassword: 'Şifremi Unuttum',
        noAccount: 'Hesabınız yok mu?',
        signUp: 'Kayıt Ol',
        errorGeneral: 'Giriş sırasında hata oluştu. Lütfen tekrar deneyin.',
        errorCredentials: 'E-posta veya şifre hatalı. Lütfen kontrol edin.'
      },
      signup: {
        title: 'Yeni Hesap Oluşturun',
        description: 'Ücretsiz hesap oluşturun ve öğrenmeye başlayın',
        firstName: 'Ad',
        firstNamePlaceholder: 'Adınızı girin',
        lastName: 'Soyad',
        lastNamePlaceholder: 'Soyadınızı girin',
        username: 'Kullanıcı Adı',
        usernamePlaceholder: 'Kullanıcı adınızı girin',
        email: 'E-posta Adresi',
        emailPlaceholder: 'E-posta adresinizi girin',
        password: 'Şifre',
        passwordPlaceholder: 'Şifrenizi girin',
        signUpButton: 'Hesap Oluştur',
        loading: 'Hesap oluşturuluyor...',
        continueWithGoogle: 'Google ile Devam Et',
        orDivider: 'veya',
        agreeToTerms: 'Kabul ediyorum:',
        hasAccount: 'Zaten hesabınız var mı?',
        signIn: 'Giriş Yap',
        errorGeneral: 'Hesap oluşturma hatası. Lütfen tekrar deneyin.',
        termsError: 'Kullanım koşullarını kabul etmelisiniz.',
        securedBy: 'Güvenlik: Clerk',
        verificationTitle: 'E-posta Doğrulama',
        verificationDescription: 'E-postanıza gönderilen 6 haneli kodu girin.',
        verificationCode: 'Doğrulama Kodu',
        verificationCodePlaceholder: '6 haneli kodu girin',
        verifyButton: 'Kodu Doğrula',
        resendCode: 'Kodu Yeniden Gönder',
        verificationError: 'Geçersiz doğrulama kodu.',
        resendSuccess: 'Kod yeniden gönderildi.'
      },
      footer: {
        text: 'Hesap oluşturarak',
        terms: 'Kullanım Koşulları',
        and: 've',
        privacy: 'Gizlilik Politikası',
        accept: '\'nı kabul etmiş olursunuz.'
      },
      urls: { terms: '/tr/kullanim-kosullari', privacy: '/tr/gizlilik-politikasi' },
      backToHome: 'Ana Sayfaya Dön',
      welcomeSignup: 'MyUNI\'ye Hoş Geldin!',
      signupDescription: 'MyUNI ile öğren, geliş, takip et!'
    },
    en: {
      title: 'Welcome to MyUNI',
      subtitle: 'Sign in or create an account to start learning',
      tabs: { signin: 'Sign In', signup: 'Sign Up' },
      signin: {
        title: 'Sign In to Your Account',
        description: 'Access exclusive content by signing in',
        email: 'Email Address',
        emailPlaceholder: 'Enter your email address',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        signInButton: 'Sign In',
        loading: 'Signing in...',
        orContinue: 'Or continue with',
        forgotPassword: 'Forgot Password',
        noAccount: 'Don\'t have an account?',
        signUp: 'Sign Up',
        errorGeneral: 'Sign-in error. Please try again.',
        errorCredentials: 'Invalid email or password.'
      },
      signup: {
        title: 'Create New Account',
        description: 'Create a free account and start learning',
        firstName: 'First Name',
        firstNamePlaceholder: 'Enter your first name',
        lastName: 'Last Name',
        lastNamePlaceholder: 'Enter your last name',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        email: 'Email Address',
        emailPlaceholder: 'Enter your email address',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        signUpButton: 'Create Account',
        loading: 'Creating account...',
        continueWithGoogle: 'Continue with Google',
        orDivider: 'or',
        agreeToTerms: 'I agree to the',
        hasAccount: 'Already have an account?',
        signIn: 'Sign In',
        errorGeneral: 'Account creation error. Please try again.',
        termsError: 'You must agree to the terms and conditions.',
        securedBy: 'Secured by Clerk',
        verificationTitle: 'Email Verification',
        verificationDescription: 'Enter the 6-digit code sent to your email.',
        verificationCode: 'Verification Code',
        verificationCodePlaceholder: 'Enter 6-digit code',
        verifyButton: 'Verify Code',
        resendCode: 'Resend Code',
        verificationError: 'Invalid verification code.',
        resendSuccess: 'Code resent successfully.'
      },
      footer: {
        text: 'By creating an account, you agree to our',
        terms: 'Terms of Service',
        and: 'and',
        privacy: 'Privacy Policy',
        accept: '.'
      },
      urls: { terms: '/en/terms-of-service', privacy: '/en/privacy-policy' },
      backToHome: 'Back to Home',
      welcomeSignup: 'Welcome to MyUNI!',
      signupDescription: 'Learn, grow, and track your progress with MyUNI!'
    }
  }),
  []
);

  const normalizedLocale = useMemo(() => (currentLocale.toLowerCase() === 'tr' ? 'tr' : 'en'), [currentLocale]);
  const t = translations[normalizedLocale];

  // SignUp Form
  const SignUpForm = useMemo(() => {
    const SignUpFormComponent = () => {
      const { isLoaded, signUp, setActive } = useSignUp();
      const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        username: ''
      });
      const [showPassword, setShowPassword] = useState(false);
      const [agreedToTerms, setAgreedToTerms] = useState(false);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');
      const [showVerification, setShowVerification] = useState(false);
      const [verificationCode, setVerificationCode] = useState('');
      const [verificationError, setVerificationError] = useState('');
      const [resendSuccess, setResendSuccess] = useState(false);
      const router = useRouter();

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !signUp) return;

        if (!agreedToTerms) {
          setError(t.signup.termsError);
          return;
        }

        const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
        if (formData.username.trim() && !usernameRegex.test(formData.username.trim())) {
          setError(
            normalizedLocale === 'tr'
              ? 'Kullanıcı adı 3+ karakter olmalı ve sadece harf, rakam, "_" veya "-" içermeli.'
              : 'Username must be 3+ characters and contain only letters, numbers, "_", or "-".'
          );
          return;
        }

        try {
          setLoading(true);
          setError('');

          const result = await signUp.create({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            emailAddress: formData.email.trim(),
            password: formData.password,
            username: formData.username.trim() || undefined
          });

          if (result.status === 'missing_requirements' && result.unverifiedFields?.includes('email_address')) {
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setShowVerification(true);
          } else {
            setError(
              normalizedLocale === 'tr'
                ? `Kayıt tamamlanamadı. Durum: ${result.status}`
                : `Sign-up failed. Status: ${result.status}`
            );
          }
        } catch (err: unknown) {
          console.error('SignUp error:', err);
          const authError = err as AuthError;
          const msg =
            authError.errors?.[0]?.message ||
            authError.errors?.[0]?.code ||
            t.signup.errorGeneral;
          setError(msg);
        } finally {
          setLoading(false);
        }
      };

      const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !signUp) return;

        try {
          setLoading(true);
          setVerificationError('');

          const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });

          if (result.status === 'complete' && result.createdSessionId) {
            await setActive({ session: result.createdSessionId });
            router.push(`/${normalizedLocale}/complete-profile`);
          } else {
            setVerificationError(t.signup.verificationError);
          }
        } catch (err: unknown) {
          console.error('Verification error:', err);
          setVerificationError(t.signup.verificationError);
        } finally {
          setLoading(false);
        }
      };

      const handleResendCode = async () => {
        if (!isLoaded || !signUp) return;

        try {
          setLoading(true);
          setVerificationError('');
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setResendSuccess(true);
          setTimeout(() => setResendSuccess(false), 3000);
        } catch (err: unknown) {
          console.error('Resend code error:', err);
          setVerificationError(t.signup.errorGeneral);
        } finally {
          setLoading(false);
        }
      };

      const handleOAuthRedirect = () => {
        if (!isLoaded || !signUp) return;
        setLoading(true);
        const redirectParam = searchParams.get('redirect');
        const redirectUrlComplete = redirectParam || `/${normalizedLocale}/complete-profile`;
        void signUp.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: `/${normalizedLocale}/sign-up/sso-callback`,
            redirectUrlComplete: redirectUrlComplete
        });
        setTimeout(() => setLoading(false), 1000);
      };

      if (showVerification) {
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t.signup.verificationTitle}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.signup.verificationDescription}</p>
            {verificationError && (
              <div className="flex items-center rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                <AlertCircle className="mr-2 h-5 w-5" />
                {verificationError}
              </div>
            )}
            {resendSuccess && (
              <div className="flex items-center rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
                <CheckCircle className="mr-2 h-5 w-5" />
                {t.signup.resendSuccess}
              </div>
            )}
            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {t.signup.verificationCode}
                </label>
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                  placeholder={t.signup.verificationCodePlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-70 dark:bg-neutral-700 dark:hover:bg-neutral-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.signup.loading}
                  </>
                ) : (
                  t.signup.verifyButton
                )}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {t.signup.resendCode}
                </button>
              </div>
            </form>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {error && (
            <div className="flex items-center rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertCircle className="mr-2 h-5 w-5" />
              {error}
            </div>
          )}
          
          {/* Google OAuth Button */}
          <div>
            <button
              type="button"
              onClick={handleOAuthRedirect}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              {t.signup.continueWithGoogle}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                {t.signup.orDivider}
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {t.signup.firstName}
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                  placeholder={t.signup.firstNamePlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {t.signup.lastName}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                  placeholder={t.signup.lastNamePlaceholder}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t.signup.username}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                placeholder={t.signup.usernamePlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t.signup.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                placeholder={t.signup.emailPlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t.signup.password}
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                  placeholder={t.signup.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800"
              />
              <label
                htmlFor="terms"
                className="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t.signup.agreeToTerms}{' '}
                <a href={t.urls.terms} className="text-neutral-800 hover:underline dark:text-neutral-200">
                  {t.footer.terms}
                </a>{' '}
                {t.footer.and}{' '}
                <a href={t.urls.privacy} className="text-neutral-800 hover:underline dark:text-neutral-200">
                  {t.footer.privacy}
                </a>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="flex w-full justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-70 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.signup.loading}
                </>
              ) : (
                t.signup.signUpButton
              )}
            </button>
          </form>
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            {t.signup.hasAccount}{' '}
            <button
              onClick={() => handleTabChange('signin')}
              className="font-medium text-neutral-800 hover:underline dark:text-neutral-200"
            >
              {t.signup.signIn}
            </button>
          </p>
          
        </div>
      );
    };
    
    SignUpFormComponent.displayName = 'SignUpForm';
    return SignUpFormComponent;
  }, [t, normalizedLocale, handleTabChange, searchParams]);

  // SignIn Form
  const SignInForm = useMemo(() => {
    const SignInFormComponent = () => {
      const { isLoaded, signIn, setActive } = useSignIn();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');
      const router = useRouter();

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !signIn) return;

        try {
          setLoading(true);
          setError('');

          const result = await signIn.create({
            identifier: email.trim(),
            password
          });

          if (result.status === 'complete' && result.createdSessionId) {
            await setActive({ session: result.createdSessionId });
            
            // Redirect URL varsa oraya git, yoksa default redirectUrl'e
            const finalRedirectUrl = searchParams.get('redirect') || redirectUrl;
            console.log('Login successful, redirecting to:', finalRedirectUrl);
            router.push(finalRedirectUrl);
          } else {
            setError(t.signin.errorGeneral);
          }
        } catch (err: unknown) {
          console.error('SignIn error:', err);
          setError(t.signin.errorCredentials);
        } finally {
          setLoading(false);
        }
      };

      const handleOAuthRedirect = () => {
        if (!isLoaded || !signIn) return;

        const redirectParam = searchParams.get('redirect');
        const redirectUrlComplete = redirectParam || redirectUrl;
        
        void signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: `/${normalizedLocale}/sign-in/sso-callback`,
          redirectUrlComplete: redirectUrlComplete
        });
      };

      return (
        <div className="space-y-6">
          {error && (
            <div className="flex items-center rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertCircle className="mr-2 h-5 w-5" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t.signin.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                placeholder={t.signin.emailPlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t.signin.password}
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:text-sm shadow-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 dark:focus:ring-neutral-500 dark:focus:border-neutral-500"
                  placeholder={t.signin.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-70 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.signin.loading}
                </>
              ) : (
                t.signin.signInButton
              )}
            </button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                {t.signin.orContinue}
              </span>
            </div>
          </div>
          
          {/* Google OAuth Button */}
          <div>
            <button
              type="button"
              onClick={handleOAuthRedirect}
              className="flex w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              {t.signup.continueWithGoogle}
            </button>
          </div>

          <div className="mt-4 flex justify-between">
            <Link
              href={`/${normalizedLocale}/forgot-password`}
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {t.signin.forgotPassword}
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            {t.signin.noAccount}{' '}
            <button
              onClick={() => handleTabChange('signup')}
              className="font-medium text-neutral-800 hover:underline dark:text-neutral-200"
            >
              {t.signin.signUp}
            </button>
          </p>
        </div>
      );
    };
    
    SignInFormComponent.displayName = 'SignInForm';
    return SignInFormComponent;
  }, [t, normalizedLocale, handleTabChange, redirectUrl, searchParams]);

  // Image Slider
  const ImageSlider = useMemo(() => {
    const ImageSliderComponent = () => (
      <div className="relative h-full w-full rounded-lg overflow-hidden">
        {[1, 2, 3, 4, 5].map((num) => (
          <div
            key={num}
            className={`absolute inset-0 transition-opacity duration-1000 ${currentImage === num ? 'opacity-100' : 'opacity-0'}`}
          >
            <Image
              src={`/tr/images/myuni-egitim-platformu-${num}.webp`}
              alt={`MyUNI Platform ${num}`}
              fill
              className="object-cover"
              priority={num === 1}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    );
    
    ImageSliderComponent.displayName = 'ImageSlider';
    return ImageSliderComponent;
  }, [currentImage]);

  // Mobile Welcome Image
  const MobileWelcomeImage = useMemo(() => {
    const MobileWelcomeImageComponent = () => (
      <div className="lg:hidden mb-6">
        <div className="relative h-48 w-full rounded-lg overflow-hidden">
          <Image
            src={`/tr/images/myuni-egitim-platformu-${currentImage}.webp`}
            alt={`MyUNI Platform ${currentImage}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 flex items-end p-4">
            <div className="bg-white/80 dark:bg-neutral-800/80 rounded-lg p-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t.welcomeSignup}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
    
    MobileWelcomeImageComponent.displayName = 'MobileWelcomeImage';
    return MobileWelcomeImageComponent;
  }, [currentImage, t.welcomeSignup]);

  if (!mounted || isSignedIn) return null;

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-900">
      <div className="flex-1 flex flex-col justify-center py-8 px-6 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t.title}</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>
          {messageFromUrl === 'account_created' && (
            <div className="mt-4 p-4 bg-green-50 rounded-md dark:bg-green-900/20">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    {normalizedLocale === 'tr' ? 'Hesap Oluşturuldu!' : 'Account Created!'}
                  </h3>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    {normalizedLocale === 'tr'
                      ? 'E-postanız doğrulandı ve hesabınız oluşturuldu.'
                      : 'Your email was verified and account created.'}
                    {emailFromUrl && (
                      <span className="ml-1 font-medium">
                        ({normalizedLocale === 'tr' ? 'E-posta:' : 'Email:'} {emailFromUrl})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex bg-neutral-200 dark:bg-neutral-700 rounded-lg p-1 mt-6 mb-8">
            <button
              onClick={() => handleTabChange('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                activeTab === 'signin'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {t.tabs.signin}
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                activeTab === 'signup'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {t.tabs.signup}
            </button>
          </div>
          {activeTab === 'signin' ? (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t.signin.title}
              </h3>
              <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">{t.signin.description}</p>
              <SignInForm />
              <div className="mt-6 text-left">
                <Link
                  href={`/${normalizedLocale}`}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {t.backToHome}
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t.signup.title}
              </h3>
              <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">{t.signup.description}</p>
              <MobileWelcomeImage />
              <SignUpForm />
              <div className="mt-6 text-left">
                <Link
                  href={`/${normalizedLocale}`}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {t.backToHome}
                </Link>
              </div>
              <p className="mt-6 text-left text-sm text-neutral-500 dark:text-neutral-400">
                {t.footer.text}{' '}
                <a href={t.urls.terms} className="text-neutral-800 hover:underline dark:text-neutral-200">
                  {t.footer.terms}
                </a>{' '}
                {t.footer.and}{' '}
                <a href={t.urls.privacy} className="text-neutral-800 hover:underline dark:text-neutral-200">
                  {t.footer.privacy}
                </a>
                {t.footer.accept}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-100 dark:bg-neutral-800 p-8">
        <div className="w-full h-full min-h-[600px]">
          <ImageSlider />
        </div>
      </div>
    </div>
  );
}