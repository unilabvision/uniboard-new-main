"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ locale: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || "/";

  // Localization - memoized for performance (always call, regardless of resolvedParams)
  const translations = useMemo(() => ({
    tr: {
      title: 'MyUNI\'ye Hoşgeldiniz',
      subtitle: 'Ücretsiz hesap oluşturun ve öğrenmeye başlayın',
      welcome: 'MyUNI\'ye Hoş Geldin!',
      description: 'MyUNI, size özel içeriklerle bilgi birikiminizi zenginleştirirken, ilerlemenizi kolayca takip etmenizi sağlar. Kendi hızınızda öğrenerek, her aşamada gelişiminizin tadını çıkarın.',
      backToHome: 'Ana Sayfaya Dön',
      signInInstead: 'Zaten hesabınız var mı?',
      signIn: 'Giriş Yapın'
    },
    en: {
      title: 'Welcome to MyUNI',
      subtitle: 'Create a free account and start learning',
      welcome: 'Welcome to MyUNI!',
      description: 'MyUNI enriches your knowledge with personalized content while making it easy to track your progress. Learn at your own pace and enjoy every step of your development.',
      backToHome: 'Back to Home',
      signInInstead: 'Already have an account?',
      signIn: 'Sign In'
    }
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
    setTimeout(() => setLoading(false), 1500);
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

  // Clerk appearance configuration
  const clerkAppearance = useMemo(() => ({
    elements: {
      rootBox: "mx-auto",
      card: "shadow-none border-0 bg-transparent",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      socialButtonsBlockButton: "border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700",
      socialButtonsBlockButtonText: "text-sm font-medium",
      dividerRow: "my-4",
      dividerText: "text-neutral-500 dark:text-neutral-400 text-sm",
      formFieldInput: "border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-neutral-500 focus:ring-neutral-500",
      formFieldLabel: "text-neutral-700 dark:text-neutral-300 text-sm font-medium",
      formButtonPrimary: "bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 dark:bg-neutral-700 dark:hover:bg-neutral-600",
      footerActionLink: "text-neutral-800 hover:text-neutral-700 dark:text-neutral-200 dark:hover:text-neutral-300",
      identityPreviewText: "text-neutral-600 dark:text-neutral-400",
      identityPreviewEditButton: "text-neutral-800 hover:text-neutral-700 dark:text-neutral-200 dark:hover:text-neutral-300"
    }
  }), []);

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

          {/* Sign Up Form */}
          {loading ? (
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-[400px] w-full bg-neutral-300 dark:bg-neutral-700 rounded-lg"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <SignUp
                appearance={clerkAppearance}
                signInUrl={`/${locale}/login?tab=signin&redirect=${encodeURIComponent(redirectUrl)}`}
                afterSignUpUrl={`/${locale}/complete-profile`}
                afterSignInUrl={redirectUrl}
              />

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t.signInInstead}{" "}
                  <Link
                    href={`/${locale}/login?tab=signin&redirect=${encodeURIComponent(redirectUrl)}`}
                    className="font-medium text-neutral-800 hover:underline dark:text-neutral-200"
                  >
                    {t.signIn}
                  </Link>
                </p>
              </div>

              {/* Back to Home */}
              <div className="text-center">
                <Link
                  href={`/${locale}`}
                  className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                >
                  {t.backToHome}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Section - Right Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 p-8">
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center">
          {/* Welcome Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white/90 dark:bg-neutral-800/90 rounded-xl p-8 backdrop-blur-sm shadow-lg max-w-xl transform transition-transform duration-300 hover:scale-105">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-neutral-100 sm:text-3xl">
                {t.welcome}
              </h2>
              <p className="mt-4 leading-relaxed text-gray-800 dark:text-neutral-300">
                {t.description}
              </p>
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