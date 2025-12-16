// lib/languageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type LanguageContextType = {
  locale: string;
  setLocale: (locale: string) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  locale: 'tr',
  setLocale: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [locale, setLocale] = useState(router.locale || 'tr');

  useEffect(() => {
    setLocale(router.locale || 'tr');
  }, [router.locale]);

  const handleSetLocale = (newLocale: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);