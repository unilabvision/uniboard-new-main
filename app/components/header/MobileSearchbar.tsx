'use client';

import { useState, useRef } from "react";
import { Search, X } from "lucide-react";

interface MobileSearchBarProps {
  locale: string;
}

export default function MobileSearchBar({ locale }: MobileSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Dil bazlı içerikler
  const translations = {
    tr: {
      searchPlaceholder: "Ara...",
      searchButton: "Ara",
    },
    en: {
      searchPlaceholder: "Search...",
      searchButton: "Search",
    }
  };

  // Güvenli bir şekilde çevirileri al (desteklenmeyen dil olursa tr'ye geri dön)
  const t = locale in translations ? translations[locale as keyof typeof translations] : translations.tr;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/${locale}/search?q=${encodeURIComponent(searchTerm)}`;
      setSearchTerm("");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex items-center rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800">
        <div className="relative flex-grow flex items-center pl-3">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ml-2 py-3 px-1 text-sm bg-transparent border-none focus:outline-none text-neutral-700 dark:text-neutral-200 placeholder-neutral-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300 p-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-full px-4 py-3 bg-[#a90013] hover:bg-[#8a0010] dark:bg-[#a90013] dark:hover:bg-[#8a0010] text-white transition-colors duration-200 text-sm font-medium"
        >
          {t.searchButton}
        </button>
      </form>
    </div>
  );
}