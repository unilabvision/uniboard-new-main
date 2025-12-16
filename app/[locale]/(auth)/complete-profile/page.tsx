// app/[locale]/(auth)/complete-profile/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Loader2, CheckCircle, User } from "lucide-react";

// Define proper types for translations
interface TranslationStrings {
  title: string;
  subtitle: string;
  firstName: string;
  firstNamePlaceholder: string;
  lastName: string;
  lastNamePlaceholder: string;
  bio: string;
  bioPlaceholder: string;
  phoneNumber: string;
  phoneNumberPlaceholder: string;
  completeProfile: string;
  completing: string;
  skipForNow: string;
  profileCompleted: string;
  errorGeneral: string;
  welcome: string;
  welcomeDescription: string;
  backToHome: string;
}

interface CompleteProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default function CompleteProfilePage({ params }: CompleteProfilePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ locale: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentImage, setCurrentImage] = useState(1);

  // Localization - memoized for performance (always call, regardless of resolvedParams)
  const translations = useMemo(() => ({
    tr: {
      title: 'Profilinizi Tamamlayın',
      subtitle: 'Hesabınızı tamamlamak için birkaç bilgi daha ekleyin',
      firstName: 'Ad',
      firstNamePlaceholder: 'Adınızı girin',
      lastName: 'Soyad',
      lastNamePlaceholder: 'Soyadınızı girin',
      bio: 'Hakkınızda (İsteğe bağlı)',
      bioPlaceholder: 'Kendiniz hakkında kısa bir açıklama yazın...',
      phoneNumber: 'Telefon Numarası (İsteğe bağlı)',
      phoneNumberPlaceholder: '+90 5XX XXX XX XX',
      completeProfile: 'Profili Tamamla',
      completing: 'Tamamlanıyor...',
      skipForNow: 'Şimdilik Atla',
      profileCompleted: 'Profiliniz başarıyla tamamlandı. Ana sayfaya yönlendiriliyorsunuz...',
      errorGeneral: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      welcome: 'Hoş Geldiniz!',
      welcomeDescription: 'MyUNI ailesine katıldığınız için teşekkürler! Profilinizi tamamlayarak kişiselleştirilmiş deneyiminizi başlatın.',
      backToHome: 'Ana Sayfaya Dön'
    } as TranslationStrings,
    en: {
      title: 'Complete Your Profile',
      subtitle: 'Add a few more details to complete your account setup',
      firstName: 'First Name',
      firstNamePlaceholder: 'Enter your first name',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Enter your last name',
      bio: 'Bio (Optional)',
      bioPlaceholder: 'Write a short description about yourself...',
      phoneNumber: 'Phone Number (Optional)',
      phoneNumberPlaceholder: '+1 (555) 123-4567',
      completeProfile: 'Complete Profile',
      completing: 'Completing...',
      skipForNow: 'Skip for Now',
      profileCompleted: 'Your profile has been successfully completed! Redirecting to homepage...',
      errorGeneral: 'An error occurred. Please try again.',
      welcome: 'Welcome!',
      welcomeDescription: 'Thank you for joining the MyUNI family! Complete your profile to begin your personalized experience.',
      backToHome: 'Back to Home'
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
    const SliderComponent = () => (
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
    SliderComponent.displayName = 'ImageSlider';
    return SliderComponent;
  }, [currentImage]);

  // Mobile Welcome Image Component - Memoized separately
  const MobileWelcomeImage = useMemo(() => {
    const MobileComponent = () => (
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
    MobileComponent.displayName = 'MobileWelcomeImage';
    return MobileComponent;
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
              {t.welcome}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {t.title}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
              {t.subtitle}
            </p>
          </div>

          {/* Mobile Welcome Image */}
          <MobileWelcomeImage />

          {/* Complete Profile Form */}
          <CompleteProfileForm locale={locale} t={t} normalizedLocale={normalizedLocale} />
        </div>
      </div>

      {/* Image Section - Right Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 p-8">
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center">
          {/* Welcome Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white/90 -800/90 rounded-xl p-8 backdrop-blur-sm shadow-lg max-w-xl transform transition-transform duration-300 hover:scale-105">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-neutral-100 sm:text-3xl">
                  {t.welcome}
                </h2>
                <p className="mt-4 leading-relaxed text-gray-800 dark:text-neutral-300">
                  {t.welcomeDescription}
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

interface CompleteProfileFormProps {
  locale: string;
  t: TranslationStrings;
  normalizedLocale: string;
}

function CompleteProfileForm({ locale, t, normalizedLocale }: CompleteProfileFormProps) {
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phoneNumber: ''
  });

  // Debug: Check user state on component mount
  useEffect(() => {
    console.log("=== COMPLETE PROFILE DEBUG ===");
    console.log("isLoaded:", isLoaded);
    console.log("user:", user);
    console.log("user email:", user?.emailAddresses?.[0]?.emailAddress);
    console.log("user verified:", user?.emailAddresses?.[0]?.verification?.status);
    console.log("user id:", user?.id);
    console.log("==============================");
    
    if (isLoaded && !user) {
      console.log("❌ No user found, redirecting to login");
      // If no user, redirect to login
      window.location.href = `/${normalizedLocale}/login?tab=signup`;
      return;
    }
    
    if (isLoaded && user) {
      console.log("✅ User found, checking verification status");
      const emailVerified = user.emailAddresses?.[0]?.verification?.status === "verified";
      console.log("Email verified:", emailVerified);
      
      if (!emailVerified) {
        console.log("❌ Email not verified, redirecting to verify-email");
        window.location.href = `/${normalizedLocale}/verify-email`;
        return;
      }
    }
  }, [isLoaded, user, normalizedLocale]);

  // Initialize form data with user info
  useEffect(() => {
    if (isLoaded && user) {
      console.log("Initializing form with user data:", {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses?.[0]?.emailAddress,
        verified: user.emailAddresses?.[0]?.verification?.status
      });
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: (user.unsafeMetadata?.bio as string) || '',
        phoneNumber: user.phoneNumbers?.[0]?.phoneNumber || ''
      });
    }
  }, [isLoaded, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log("=== PROFILE COMPLETION SUBMIT ===");
    console.log("isLoaded:", isLoaded);
    console.log("user:", !!user);
    console.log("formData:", formData);
    
    if (!isLoaded || !user) {
      console.log("❌ User not loaded or not found");
      setError(normalizedLocale === 'tr' ? 
        'Kullanıcı bilgileri yüklenemedi. Lütfen tekrar giriş yapın.' : 
        'User information could not be loaded. Please sign in again.'
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      console.log("Updating user basic info...");
      // Update user basic info first
      const updateResult1 = await user.update({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });
      console.log("Basic info update result:", updateResult1);

      console.log("Updating user metadata...");
      // Update metadata separately using the correct approach
      const updateResult2 = await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          bio: formData.bio.trim(),
          profileCompleted: true
        }
      });
      console.log("Metadata update result:", updateResult2);

      // Add phone number if provided and user doesn't have one
      if (formData.phoneNumber && user.phoneNumbers.length === 0) {
        try {
          console.log("Adding phone number...");
          const phoneResult = await user.createPhoneNumber({ phoneNumber: formData.phoneNumber });
          console.log("Phone number added:", phoneResult);
        } catch (phoneError) {
          console.warn("Phone number couldn't be added:", phoneError);
        }
      }

      console.log("✅ Profile completion successful!");
      setSuccess(t.profileCompleted);
      
      // Wait a bit for the success message to be visible
      setTimeout(() => {
        console.log("Redirecting to homepage...");
        // Force reload and redirect to homepage
        window.location.href = `/${normalizedLocale}`;
      }, 2000);

    } catch (err: unknown) {
      console.error("❌ Profile completion error:", err);
      
      // Type-safe error handling
      const error = err as { errors?: Array<{ code?: string }> };
      console.error("Error details:", error.errors);
      
      // More specific error handling
      if (error.errors?.[0]?.code === "user_not_found") {
        setError(normalizedLocale === 'tr' ? 
          'Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.' : 
          'User not found. Please sign in again.'
        );
      } else if (error.errors?.[0]?.code === "session_not_found") {
        setError(normalizedLocale === 'tr' ? 
          'Oturum bulunamadı. Lütfen tekrar giriş yapın.' : 
          'Session not found. Please sign in again.'
        );
      } else {
        setError(t.errorGeneral);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log("Skipping profile completion...");
    // Force reload and redirect to homepage
    window.location.href = `/${normalizedLocale}`;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
        <span className="ml-2 text-neutral-600">Loading user data...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {normalizedLocale === 'tr' ? 'Kullanıcı bilgileri bulunamadı.' : 'User information not found.'}
          </p>
          <Link
            href={`/${normalizedLocale}/login?tab=signup`}
            className="text-neutral-800 hover:underline dark:text-neutral-200"
          >
            {normalizedLocale === 'tr' ? 'Tekrar kayıt ol' : 'Sign up again'}
          </Link>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.firstName}
            </label>
            <div className="mt-1">
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500 sm:text-sm"
                placeholder={t.firstNamePlaceholder}
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.lastName}
            </label>
            <div className="mt-1">
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500 sm:text-sm"
                placeholder={t.lastNamePlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Bio Field */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t.bio}
          </label>
          <div className="mt-1">
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleInputChange}
              className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500 sm:text-sm"
              placeholder={t.bioPlaceholder}
            />
          </div>
        </div>

        {/* Phone Number Field */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t.phoneNumber}
          </label>
          <div className="mt-1">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-500 sm:text-sm"
              placeholder={t.phoneNumberPlaceholder}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={loading || !formData.firstName.trim() || !formData.lastName.trim()}
            className="flex w-full justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.completing}
              </>
            ) : (
              t.completeProfile
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            {t.skipForNow}
          </button>
        </div>
      </form>

      {/* Navigation Links */}
      <div className="mt-8 text-center">
        <Link
          href={`/${locale}`}
          className="text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          {t.backToHome}
        </Link>
      </div>
    </div>
  );
}