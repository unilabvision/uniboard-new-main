'use client';

import React from 'react';
import { Video, FileText, HelpCircle, X, Link2, FolderOpen } from 'lucide-react';
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

const moduleOptions: Array<{
  type: ModuleType;
  label: string;
  icon: React.ElementType;
  description: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  textColor: string;
}> = [
  {
    type: 'video',
    label: 'Video (Vimeo)',
    icon: Video,
    description: 'Dosya yükle veya Vimeo linki — Supabase kaydı ile senkron',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    borderColor: 'border-red-200 dark:border-red-800/30',
    iconBg: 'bg-red-600',
    textColor: 'text-red-700 dark:text-red-300',
  },
  {
    type: 'notes',
    label: 'Not / Metin',
    icon: FileText,
    description: 'Markdown, HTML veya düz metin eğitim içeriği',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    borderColor: 'border-blue-200 dark:border-blue-800/30',
    iconBg: 'bg-blue-600',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    type: 'quiz',
    label: 'Quiz',
    icon: HelpCircle,
    description: 'İnteraktif soru-cevap ve değerlendirme',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10',
    borderColor: 'border-purple-200 dark:border-purple-800/30',
    iconBg: 'bg-purple-600',
    textColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    type: 'url',
    label: 'Harici URL',
    icon: Link2,
    description: 'Harici sayfa, doküman veya eğitim kaynağı linki',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
    borderColor: 'border-emerald-200 dark:border-emerald-800/30',
    iconBg: 'bg-emerald-600',
    textColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    type: 'resource',
    label: 'Kaynak / Dosya',
    icon: FolderOpen,
    description: 'PDF, slayt veya ek eğitim kaynağı (URL ile)',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    borderColor: 'border-amber-200 dark:border-amber-800/30',
    iconBg: 'bg-amber-600',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
];

export default function ModuleSelectionModal({
  lessonTitle,
  onModuleSelected,
  onClose,
  existingModules = { hasVideo: false, hasNotes: false, hasQuiz: false },
}: ModuleSelectionModalProps) {
  const hasExistingModule =
    existingModules.hasVideo || existingModules.hasNotes || existingModules.hasQuiz;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/20 transition-opacity duration-200 ease-out z-[10000]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[10001]">
        <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-700 pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {hasExistingModule ? 'Modül Değiştir' : 'İçerik Modülü Seç'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                <span className="font-medium">{lessonTitle}</span> — video, quiz, URL veya kaynak
              </p>
              {hasExistingModule && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Bu derste zaten bir modül var. Yeni seçim mevcut içeriğin yerini alır.
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moduleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => onModuleSelected(option.type)}
                    className={`text-left rounded-xl border p-4 transition-all hover:shadow-md ${option.bgColor} ${option.borderColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0 ${option.iconBg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <div>
                        <p className={`font-semibold ${option.textColor}`}>{option.label}</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
