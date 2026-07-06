'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Palette, Image, Eye, Edit2, Trash2, 
  PlusCircle, Copy, CheckCircle, 
  X, MoreVertical, Search
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useUser } from '@clerk/nextjs';
import { generateDashboardCertificatePreview } from '@/utils/dashboardCertificateGenerator';
import { certificatesSupabase as supabase } from '@/app/_services/certificatesSupabaseClient';
import { getCertificateOrganizationSlugs } from '@/app/_services/organizationAccessService';
import { useUserModules } from '@/app/hooks/useUserModules';

// Types
interface CertificateTemplate {
  id: number;
  name: string;
  description?: string;
  background_image: string;
  organization_slug: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  design_settings?: {
    colors: {
      primary: string;
      secondary: string;
      text: string;
    };
    fonts: {
      title: string;
      body: string;
    };
    layout: {
      title_position: { x: number; y: number };
      name_position: { x: number; y: number };
      date_position: { x: number; y: number };
      signature_position: { x: number; y: number };
    };
  };
}

interface Organization {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  organizationSlugs?: string[];
}

// Localized texts
const texts = {
  tr: {
    title: "Sertifika Şablonları",
    subtitle: "Kuruluşunuza özel sertifika şablonları oluşturun ve yönetin",
    searchPlaceholder: "Şablon adı ara...",
    emptyState: {
      title: "Henüz şablon bulunmuyor",
      subtitle: "Yeni bir şablon oluşturarak başlayın",
      buttonText: "Şablon Oluştur"
    },
    createNew: "Yeni Şablon",
    viewTemplate: "Şablonu Görüntüle",
    editTemplate: "Şablonu Düzenle",
    duplicateTemplate: "Şablonu Kopyala",
    deleteTemplate: "Şablonu Sil",
    downloadTemplate: "Şablonu İndir",
    setAsDefault: "Varsayılan Yap",
    removeDefault: "Varsayılandan Çıkar",
    uploadBackground: "Arka Plan Yükle",
    preview: "Önizleme",
    designSettings: "Tasarım Ayarları",
    colors: "Renkler",
    fonts: "Yazı Tipleri",
    layout: "Yerleşim",
    primaryColor: "Ana Renk",
    secondaryColor: "İkincil Renk",
    textColor: "Yazı Rengi",
    titleFont: "Başlık Yazı Tipi",
    bodyFont: "Gövde Yazı Tipi",
    save: "Kaydet",
    cancel: "İptal",
    saving: "Kaydediliyor...",
    saved: "Kaydedildi",
    error: "Bir hata oluştu",
    deleteConfirmTitle: "Şablonu Sil",
    deleteConfirmMessage: "Bu şablonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    deleteConfirmButton: "Evet, Sil",
    deleting: "Siliniyor...",
    deleteSuccess: "Şablon başarıyla silindi",
    deleteError: "Şablon silinirken bir hata oluştu",
    duplicateSuccess: "Şablon başarıyla kopyalandı",
    duplicateError: "Şablon kopyalanırken bir hata oluştu",
    defaultTemplate: "Varsayılan Şablon",
    templateInfo: {
      name: "Şablon Adı",
      organization: "Kuruluş",
      created: "Oluşturulma Tarihi",
      updated: "Güncelleme Tarihi",
      backgroundImage: "Arka Plan Görseli"
    },
    loading: "Yükleniyor...",
    noResults: "Aramanıza uygun sonuç bulunamadı"
  },
  en: {
    title: "Certificate Templates",
    subtitle: "Create and manage custom certificate templates for your organization",
    searchPlaceholder: "Search template name...",
    emptyState: {
      title: "No templates found",
      subtitle: "Get started by creating a new template",
      buttonText: "Create Template"
    },
    createNew: "New Template",
    viewTemplate: "View Template",
    editTemplate: "Edit Template",
    duplicateTemplate: "Duplicate Template",
    deleteTemplate: "Delete Template",
    downloadTemplate: "Download Template",
    setAsDefault: "Set as Default",
    removeDefault: "Remove Default",
    uploadBackground: "Upload Background",
    preview: "Preview",
    designSettings: "Design Settings",
    colors: "Colors",
    fonts: "Fonts",
    layout: "Layout",
    primaryColor: "Primary Color",
    secondaryColor: "Secondary Color",
    textColor: "Text Color",
    titleFont: "Title Font",
    bodyFont: "Body Font",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    saved: "Saved",
    error: "An error occurred",
    deleteConfirmTitle: "Delete Template",
    deleteConfirmMessage: "Are you sure you want to delete this template? This action cannot be undone.",
    deleteConfirmButton: "Yes, Delete",
    deleting: "Deleting...",
    deleteSuccess: "Template deleted successfully",
    deleteError: "An error occurred while deleting template",
    duplicateSuccess: "Template duplicated successfully",
    duplicateError: "An error occurred while duplicating template",
    defaultTemplate: "Default Template",
    templateInfo: {
      name: "Template Name",
      organization: "Organization",
      created: "Created Date",
      updated: "Updated Date",
      backgroundImage: "Background Image"
    },
    loading: "Loading...",
    noResults: "No results found for your search"
  }
};

// Utility functions
const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Template Card Component
const TemplateCard = ({ 
  template, 
  locale, 
  organization,
  t,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
  onPreview
}: { 
  template: CertificateTemplate;
  locale: string;
  organization?: Organization;
  t: typeof texts.tr;
  onEdit: (template: CertificateTemplate) => void;
  onDelete: (template: CertificateTemplate) => void;
  onDuplicate: (template: CertificateTemplate) => void;
  onSetDefault: (template: CertificateTemplate) => void;
  onPreview: (template: CertificateTemplate) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate small preview for card
  const generateCardPreview = useCallback(async () => {
    if (!template.background_image || isGeneratingPreview) {
      return;
    }
    
    setIsGeneratingPreview(true);
    try {
      const previewWidth = 400;
      const previewHeight = 300;
      
      const canvas = await generateDashboardCertificatePreview(
        template,
        previewWidth,
        previewHeight,
        locale
      );
      
      setPreviewCanvas(canvas);
      
      // Update canvas in the DOM if ref exists
      if (canvasRef.current && canvas) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    } catch (error) {
      console.error('Card preview generation error:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [locale, isGeneratingPreview, template]);

  // Generate preview when component mounts
  useEffect(() => {
    if (template.background_image && !previewCanvas && !isGeneratingPreview) {
      generateCardPreview();
    }
  }, [template.background_image, template.id, generateCardPreview, isGeneratingPreview, previewCanvas]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        const target = event.target as Element;
        if (!target.closest('.menu-container')) {
          setShowMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header with organization accent color */}
      <div 
        className="h-2" 
        style={{ 
          backgroundColor: organization?.primary_color || '#990000'
        }}
      />
      
      {/* Template preview */}
      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
        {template.background_image ? (
          <div className="w-full h-full relative">
            {/* Canvas Preview */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
              style={{ display: previewCanvas ? 'block' : 'none' }}
            />
            
            {/* Loading state */}
            {isGeneratingPreview && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="text-white text-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  <p className="text-xs">Yükleniyor...</p>
                </div>
              </div>
            )}
            
            {/* Fallback image if canvas fails */}
            {!previewCanvas && !isGeneratingPreview && (
              <NextImage 
                src={template.background_image} 
                alt={template.name}
                width={400}
                height={300}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: `${organization?.primary_color || '#990000'}20`
              }}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image 
                className="w-10 h-10" 
                style={{ 
                  color: organization?.primary_color || '#990000'
                }}
              />
            </div>
          </div>
        )}
        
        {/* Default badge */}
        {template.is_default && (
          <div className="absolute top-3 left-3">
            <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              {t.defaultTemplate}
            </div>
          </div>
        )}
        
        {/* Preview overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
          <button
            onClick={() => onPreview(template)}
            className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4 py-2 rounded-lg font-medium flex items-center shadow-lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            {t.preview}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {/* Template info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              {template.name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {organization?.name || template.organization_slug}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(template)}
              className="p-2 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title={t.editTemplate}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            
            <div className="relative menu-container">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg z-10">
                  <button
                    onClick={() => {
                      onDuplicate(template);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t.duplicateTemplate}
                  </button>
                  
                  {!template.is_default ? (
                    <button
                      onClick={() => {
                        onSetDefault(template);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t.setAsDefault}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onSetDefault(template);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t.removeDefault}
                    </button>
                  )}
                  
                  <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                  
                  <button
                    onClick={() => {
                      onDelete(template);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.deleteTemplate}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Template description */}
        {template.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            {template.description}
          </p>
        )}
        
        {/* Template details */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
          <div className="flex justify-between">
            <span>{t.templateInfo.created}:</span>
            <span>{formatDate(template.created_at, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.templateInfo.updated}:</span>
            <span>{formatDate(template.updated_at, locale)}</span>
          </div>
        </div>
      </div>
      
      {/* Footer with action buttons */}
      <div className="px-6 py-4  border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => onPreview(template)}
            className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4 mr-1" />
            {t.viewTemplate}
          </button>
        </div>
        
        <button
          onClick={() => onEdit(template)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#990000] hover:bg-[#880000] rounded-md transition-colors"
        >
          <Edit2 className="w-4 h-4 mr-1" />
          {t.editTemplate}
        </button>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  template,
  isDeleting,
  t 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  template: CertificateTemplate | null;
  isDeleting: boolean;
  t: typeof texts.tr;
}) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t.deleteConfirmTitle}
              </h3>
            </div>
          </div>
          
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
            {t.deleteConfirmMessage}
          </p>
          
          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-3 mb-6">
            <div className="text-sm">
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {template.name}
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">
                {template.organization_slug}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t.deleting}
                </>
              ) : (
                t.deleteConfirmButton
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preview Modal Component
const PreviewModal = ({ 
  isOpen, 
  onClose, 
  template,
  previewCanvas,
  isGeneratingPreview,
  canvasRef,
  t 
}: {
  isOpen: boolean;
  onClose: () => void;
  template: CertificateTemplate | null;
  previewCanvas: HTMLCanvasElement | null;
  isGeneratingPreview: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  t: typeof texts.tr;
}) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.preview}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {template.name}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              disabled={isGeneratingPreview}
              className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Certificate Preview */}
          <div className="relative bg-neutral-100 dark:bg-neutral-700 rounded-lg overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-600">
            {template.background_image ? (
              <div className="w-full h-full relative min-h-[400px] flex items-center justify-center">
                {/* Canvas Preview */}
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[500px] object-contain"
                  style={{ display: previewCanvas ? 'block' : 'none' }}
                />
                
                {/* Loading state */}
                {isGeneratingPreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm">Önizleme oluşturuluyor...</p>
                    </div>
                  </div>
                )}
                
                {/* Fallback image if canvas fails */}
                {!previewCanvas && !isGeneratingPreview && (
                  <NextImage 
                    src={template.background_image} 
                    alt="Preview"
                    width={800}
                    height={500}
                    className="max-w-full max-h-[500px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <div className="text-center">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Arka plan görseli bulunamadı</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Preview Info */}
          <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
            <p><strong>Şablon:</strong> {template.name}</p>
            <p><strong>Kuruluş:</strong> {template.organization_slug}</p>
            {template.description && (
              <p><strong>Açıklama:</strong> {template.description}</p>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              disabled={isGeneratingPreview}
              className="px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function CertificateTemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<CertificateTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState<CertificateTemplate | null>(null);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const locale = 'tr'; // You can get this from params or context
  const t = texts[locale] || texts.tr;

  // Generate preview function
  const generatePreview = useCallback(async (template: CertificateTemplate) => {
    if (!template.background_image || isGeneratingPreview) {
      return;
    }
    
    setIsGeneratingPreview(true);
    try {
      const previewWidth = 800;
      const previewHeight = 600;
      
      const canvas = await generateDashboardCertificatePreview(
        template,
        previewWidth,
        previewHeight,
        locale
      );
      
      setPreviewCanvas(canvas);
      
      // Update canvas in the DOM if ref exists
      if (canvasRef.current && canvas) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    } catch (error) {
      console.error('Preview generation error:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [locale, isGeneratingPreview]);

  // Set current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isLoaded || modulesLoading) return;
      
      if (!clerkUser) {
        setLoading(false);
        return;
      }

      try {
        const orgSlugs = await getCertificateOrganizationSlugs(clerkUser.id, isSuperAdmin);

        setCurrentUser({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || 'Kullanıcı',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          organizationSlugs: orgSlugs
        });
      } catch (error) {
        console.error('Error getting user profile:', error);
      }
    };

    getCurrentUser();
  }, [clerkUser, isLoaded, isSuperAdmin, modulesLoading]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Check if user has any organization slugs
        if (!currentUser.organizationSlugs || currentUser.organizationSlugs.length === 0) {
          // If no organizations, show empty state
          setOrganizations([]);
          setTemplates([]);
          setLoading(false);
          return;
        }
        
        // Fetch organizations first
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('slug', currentUser.organizationSlugs);
        
        if (orgsError) {
          throw orgsError;
        }
        
        setOrganizations(orgsData || []);
        
        // Fetch templates (we'll need to create this table)
        const { data: templatesData, error: templatesError } = await supabase
          .from('certificate_templates')
          .select('*')
          .in('organization_slug', currentUser.organizationSlugs)
          .order('created_at', { ascending: false });
        
        if (templatesError) {
          // If table doesn't exist yet, just set empty array
          console.log('Certificate templates table not found, showing empty state');
          setTemplates([]);
        } else {
          setTemplates(templatesData || []);
        }
        
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  // Filter templates based on search
  const getFilteredTemplates = () => {
    if (!searchQuery) return templates;
    
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.organization_slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get matching organization for a template
  const getOrganizationForTemplate = (template: CertificateTemplate) => {
    return organizations.find(org => org.slug === template.organization_slug);
  };

  // Handle edit template
  const handleEditTemplate = (template: CertificateTemplate) => {
    // Redirect to edit page - you'll need to create this page
    window.location.href = `/${locale}/certificates/templates/edit/${template.id}`;
  };

  // Handle preview template
  const handlePreviewTemplate = (template: CertificateTemplate) => {
    setTemplateToPreview(template);
    setShowPreviewModal(true);
    setPreviewCanvas(null);
    // Generate preview when modal opens
    generatePreview(template);
  };

  // Handle duplicate template
  const handleDuplicateTemplate = async (template: CertificateTemplate) => {
    try {
      const newTemplate = {
        ...template,
        id: undefined,
        name: `${template.name} - Kopya`,
        is_default: false,
        created_at: undefined,
        updated_at: undefined
      };

      const { data, error } = await supabase
        .from('certificate_templates')
        .insert([newTemplate])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTemplates(prev => [data, ...prev]);
      alert(t.duplicateSuccess);
    } catch (error: unknown) {
      console.error('Error duplicating template:', error);
      alert(t.duplicateError + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    }
  };

  // Handle set default template
  const handleSetDefaultTemplate = async (template: CertificateTemplate) => {
    try {
      // First, remove default from all templates in the same organization
      await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('organization_slug', template.organization_slug);

      // Then set this template as default (or remove if it was already default)
      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_default: !template.is_default })
        .eq('id', template.id);

      if (error) {
        throw error;
      }

      // Update local state
      setTemplates(prev => prev.map(t => ({
        ...t,
        is_default: t.organization_slug === template.organization_slug ? 
          (t.id === template.id ? !template.is_default : false) : 
          t.is_default
      })));

    } catch (error: unknown) {
      console.error('Error setting default template:', error);
      alert(t.error + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    }
  };

  // Handle delete template
  const handleDeleteTemplate = (template: CertificateTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  // Confirm delete template
  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', templateToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Remove template from local state
      setTemplates(prev => prev.filter(template => template.id !== templateToDelete.id));
      
      // Close modal
      setShowDeleteModal(false);
      setTemplateToDelete(null);
      
      // Show success message
      alert(t.deleteSuccess);
      
    } catch (error: unknown) {
      console.error('Error deleting template:', error);
      alert(t.deleteError + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  };

  // Close preview modal
  const closePreviewModal = () => {
    if (!isGeneratingPreview) {
      setShowPreviewModal(false);
      setTemplateToPreview(null);
      setPreviewCanvas(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="p-6">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (!clerkUser || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                {t.title}
              </h1>
              <div className="w-12 sm:w-16 h-px bg-[#990000] mb-4"></div>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
                {t.subtitle}
              </p>
            </div>
            
            <Link 
              href={`/${locale}/certificates/templates/create`} 
              className="mt-4 lg:mt-0 flex items-center px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {t.createNew}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        {templates.length === 0 ? (
          // Empty state
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Palette className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {currentUser.organizationSlugs && currentUser.organizationSlugs.length > 0 ? 
                t.emptyState.title : 
                "Erişiminiz olan kurum bulunmuyor"
              }
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {currentUser.organizationSlugs && currentUser.organizationSlugs.length > 0 ? 
                t.emptyState.subtitle : 
                "Şablon oluşturabilmek için önce bir kuruma erişim almanız gerekiyor"
              }
            </p>
            {currentUser.organizationSlugs && currentUser.organizationSlugs.length > 0 ? (
              <Link 
                href={`/${locale}/certificates/templates/create`} 
                className="inline-flex items-center px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                {t.emptyState.buttonText}
              </Link>
            ) : (
              <div className="text-amber-600 dark:text-amber-400 px-6 py-3 bg-amber-50 dark:bg-amber-900/20 inline-block rounded-lg">
                Sistem yöneticisiyle iletişime geçerek kurum erişimi talep edebilirsiniz
              </div>
            )}
          </div>
        ) : filteredTemplates.length === 0 ? (
          // No results from search
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t.noResults}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Farklı arama kriterleri deneyebilirsiniz
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-6 py-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-medium rounded-lg transition-colors"
            >
              Aramayı Temizle
            </button>
          </div>
        ) : (
          // Template grid
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTemplates.map((template: CertificateTemplate) => (
                <TemplateCard 
                  key={template.id}
                  template={template}
                  locale={locale}
                  organization={getOrganizationForTemplate(template)}
                  t={t}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onDuplicate={handleDuplicateTemplate}
                  onSetDefault={handleSetDefaultTemplate}
                  onPreview={handlePreviewTemplate}
                />
              ))}
            </div>
            
            {/* Results count */}
            <div className="text-center mt-8 text-sm text-neutral-500 dark:text-neutral-400">
              Toplam {filteredTemplates.length} şablon
            </div>
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteTemplate}
        template={templateToDelete}
        isDeleting={isDeleting}
        t={t}
      />
      
      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={closePreviewModal}
        template={templateToPreview}
        previewCanvas={previewCanvas}
        isGeneratingPreview={isGeneratingPreview}
        canvasRef={canvasRef}
        t={t}
      />
    </div>
  );
}
