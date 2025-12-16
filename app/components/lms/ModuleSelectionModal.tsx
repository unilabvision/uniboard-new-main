'use client';

import React from 'react';
import { Video, FileText, HelpCircle, X } from 'lucide-react';
import { ModuleType } from '../../types/course';

interface ModuleSelectionModalProps {
  lessonTitle: string;
  onModuleSelected: (moduleType: ModuleType) => void;
  onClose: () => void;
  existingModules?: {
    hasVideo: boolean;
    hasNotes: boolean;
    hasQuiz: boolean;
  };
}

const moduleOptions = [
  {
    type: 'video' as ModuleType,
    label: 'Video',
    icon: Video,
    description: 'Video içerik yükleyin ve Vimeo entegrasyonu kullanın',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    borderColor: 'border-red-200 dark:border-red-800/30',
    iconBg: 'bg-red-600',
    textColor: 'text-red-700 dark:text-red-300'
  },
  {
    type: 'notes' as ModuleType,
    label: 'Notlar',
    icon: FileText,
    description: 'Markdown, HTML veya düz metin formatında not ekleyin',
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    borderColor: 'border-blue-200 dark:border-blue-800/30',
    iconBg: 'bg-blue-600',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  {
    type: 'quiz' as ModuleType,
    label: 'Quiz',
    icon: HelpCircle,
    description: 'İnteraktif quiz oluşturun ve öğrenci değerlendirmesi yapın',
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10',
    borderColor: 'border-purple-200 dark:border-purple-800/30',
    iconBg: 'bg-purple-600',
    textColor: 'text-purple-700 dark:text-purple-300'
  }
];

export default function ModuleSelectionModal({ 
  lessonTitle, 
  onModuleSelected, 
  onClose,
  existingModules = { hasVideo: false, hasNotes: false, hasQuiz: false }
}: ModuleSelectionModalProps) {
  
  // Check if any module already exists
  const hasExistingModule = existingModules.hasVideo || existingModules.hasNotes || existingModules.hasQuiz;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 transition-opacity duration-200 ease-out z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[10001]">
        <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-200 ease-out scale-100 opacity-100 border border-neutral-200 dark:border-neutral-700 pointer-events-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {hasExistingModule ? 'Modül Değiştir' : 'Modül Seç'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                <span className="font-medium">{lessonTitle}</span> dersi için içerik türü seçin
              </p>
              {hasExistingModule && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  ⚠️ Bu derste zaten bir modül var. Yeni modül seçerseniz mevcut içerik silinecek.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Module Options */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  İçerik Türü Seçin
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Her derse sadece bir tür içerik ekleyebilirsiniz
                </p>
              </div>

              <div className="grid gap-4">
                {moduleOptions.map((option) => {
                  const Icon = option.icon;
                  const isExisting = 
                    (option.type === 'video' && existingModules.hasVideo) ||
                    (option.type === 'notes' && existingModules.hasNotes) ||
                    (option.type === 'quiz' && existingModules.hasQuiz);
                  
                  const isDisabled = hasExistingModule && !isExisting;
                  
                  return (
                    <button
                      key={option.type}
                      onClick={() => onModuleSelected(option.type)}
                      disabled={isDisabled}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        isExisting 
                          ? `${option.bgColor} ${option.borderColor} ring-2 ring-${option.color}-200`
                          : isDisabled
                          ? 'bg-neutral-50 dark:bg-neutral-700/50 border-neutral-200 dark:border-neutral-600 opacity-50 cursor-not-allowed'
                          : `hover:${option.bgColor} hover:${option.borderColor} border-neutral-200 dark:border-neutral-700 hover:shadow-lg`
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${isDisabled ? 'bg-neutral-400' : option.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${isDisabled ? 'text-neutral-600' : 'text-white'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className={`font-medium ${
                              isExisting 
                                ? option.textColor
                                : isDisabled 
                                ? 'text-neutral-400 dark:text-neutral-500'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}>
                              {option.label}
                            </h4>
                            {isExisting && (
                              <span className={`text-xs px-2 py-1 rounded-full bg-${option.color}-100 dark:bg-${option.color}-900/30 ${option.textColor} font-medium`}>
                                Mevcut
                              </span>
                            )}
                            {isDisabled && (
                              <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                                Kullanılamaz
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${
                            isDisabled 
                              ? 'text-neutral-400 dark:text-neutral-500'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {option.description}
                          </p>
                          
                          {isExisting && (
                            <div className="mt-3 text-xs text-orange-600 dark:text-orange-400">
                              Bu türde içerik zaten mevcut. Tıklayarak düzenleyebilirsiniz.
                            </div>
                          )}
                          
                          {isDisabled && (
                            <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                              Bu derse zaten başka bir türde içerik eklenmiş.
                            </div>
                          )}
                        </div>
                        
                        {!isDisabled && (
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              isExisting
                                ? `border-${option.color}-500 bg-${option.color}-500`
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}>
                              {isExisting && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Önemli Bilgiler:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Her derse sadece bir tür içerik (video, not veya quiz) ekleyebilirsiniz</li>
                      <li>• Mevcut içerik varken başka tür seçerseniz, eski içerik silinir</li>
                      <li>• Video: Vimeo entegrasyonu ile otomatik yükleme</li>
                      <li>• Notlar: Markdown desteği ile zengin metin editörü</li>
                      <li>• Quiz: Çoktan seçmeli, doğru/yanlış ve açık uçlu sorular</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors text-sm font-medium"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}