import React from "react";

interface ButtonProps {
  variant?: "primary" | "outline" | "secondary";
  children: React.ReactNode;
  icon?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Button({
  variant = "primary",
  children,
  icon = false,
  onClick,
  className = "",
}: ButtonProps) {
  const baseClasses = "px-6 py-2.5 rounded-lg transition-colors text-sm font-medium";

  const variantClasses = {
    primary: "bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
    secondary: "bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-1000/30 dark:text-red-50 dark:hover:bg-red-900/50"
  };

  const playIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${icon ? "flex items-center gap-2" : ""} ${className}`}
      onClick={onClick}
    >
      {icon && playIcon}
      {children}
    </button>
  );
}
