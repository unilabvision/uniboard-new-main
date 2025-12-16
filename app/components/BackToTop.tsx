"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Smooth scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Sayfanın üstüne git"
          className="fixed bottom-8 right-4 p-3 rounded-full bg-neutral-800 dark:bg-neutral-700 text-white shadow-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-all duration-300 z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </>
  );
};

export default BackToTop;