// app/hooks/useAuth.ts
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function useAuthUser() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();

  const redirectToSignup = (locale: string) => {
    router.push(`/${locale}/member/signup`);
  };

  const redirectToLogin = (locale: string) => {
    router.push(`/${locale}/member/login`);
  };

  return { 
    isSignedIn, 
    isLoaded, 
    userId,
    loading: !isLoaded,
    redirectToSignup,
    redirectToLogin // Yeni fonksiyonu döndürüyoruz
  };
}