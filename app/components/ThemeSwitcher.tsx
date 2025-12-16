import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeSwitcherProps {
  onToggle?: () => void;
}

export default function ThemeSwitcher({ onToggle }: ThemeSwitcherProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    }
    if (onToggle) onToggle();
  };

  useEffect(() => {
    // Kullanıcı daha önce tema tercihi yapmışsa, tercihini yükle
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle fonksiyonunu dışarıdan erişilebilir hale getir
  React.useImperativeHandle(onToggle, () => ({
    toggle: toggleTheme
  }));

  return (
    <div onClick={toggleTheme} className="cursor-pointer">
      {isDarkMode ? (
        <Sun className="w-5 h-5 flex-shrink-0" />
      ) : (
        <Moon className="w-5 h-5 flex-shrink-0" />
      )}
    </div>
  );
}