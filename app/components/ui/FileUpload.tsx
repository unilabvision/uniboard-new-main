'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  currentFile?: File | null;
  currentUrl?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  currentFile,
  currentUrl,
  accept = "image/*",
  maxSize = 10, // 10MB default
  className = "",
  disabled = false,
  error,
  placeholder = "Dosya seçin veya buraya sürükleyin"
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `Dosya boyutu ${maxSize}MB'dan büyük olamaz`;
    }

    // Check file type
    if (accept.includes('image/*')) {
      if (!file.type.startsWith('image/')) {
        return 'Sadece resim dosyaları kabul edilir';
      }
    }

    return null;
  }, [maxSize, accept]);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError("");
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    setUploadError("");
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileRemove]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const displayError = error || uploadError;

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-[#990000] bg-red-50 dark:bg-red-900/20' 
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${displayError ? 'border-red-500' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        {/* Current file display */}
        {(currentFile || currentUrl) && (
          <div className="mb-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <ImageIcon className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {currentFile?.name || 'Mevcut görsel'}
                  </p>
                  {currentFile && (
                    <p className="text-xs text-neutral-500">
                      {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
                disabled={disabled}
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>
        )}

        {/* Upload prompt */}
        {!currentFile && !currentUrl && (
          <div className="text-center">
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              {placeholder}
            </p>
            <p className="text-xs text-neutral-500">
              PNG, JPG, SVG formatında, maksimum {maxSize}MB
            </p>
          </div>
        )}

        {/* Upload button for when file exists */}
        {(currentFile || currentUrl) && (
          <div className="text-center">
            <button
              type="button"
              onClick={openFileDialog}
              disabled={disabled}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#990000] bg-white border border-[#990000] rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-[#990000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Farklı Dosya Seç
            </button>
          </div>
        )}
      </div>

      {/* Error display */}
      {displayError && (
        <div className="mt-2 flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{displayError}</p>
        </div>
      )}
    </div>
  );
}
