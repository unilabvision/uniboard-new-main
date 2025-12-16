import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  locale: string;
}

export default function SearchBar({ locale }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dil bazlı içerikler
  const translations = {
    tr: {
      searchPlaceholder: "Ara...",
      searchButton: "Ara",
      searchLabel: "Ara",
    },
    en: {
      searchPlaceholder: "Search...",
      searchButton: "Search",
      searchLabel: "Search",
    }
  };

  // Güvenli bir şekilde çevirileri al (desteklenmeyen dil olursa tr'ye geri dön)
  const t = locale in translations ? translations[locale as keyof typeof translations] : translations.tr;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/${locale}/search?q=${encodeURIComponent(searchTerm)}`;
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={searchRef}>
      <button
        className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t.searchLabel}
      >
        <Search className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 md:w-72 bg-white dark:bg-neutral-800 rounded-md shadow-md border border-neutral-100 dark:border-neutral-700 overflow-hidden transform origin-top animate-in fade-in duration-200">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-grow flex items-center pl-3">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full ml-2 py-2.5 px-1 text-sm bg-transparent border-none focus:outline-none text-neutral-700 dark:text-neutral-200 placeholder-neutral-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="ml-2 h-full px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 transition-colors duration-200"
            >
              {t.searchButton}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}