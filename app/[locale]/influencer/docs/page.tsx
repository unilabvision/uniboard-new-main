"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Download, Eye, Copy, Search, FileText, Image as ImageIcon,
  Video, File, Folder, Star, Grid, List, RefreshCw, X,
  Check, ZoomIn, AlertCircle
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase client
const supabaseMain = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 
});

// Types
interface Document {
  id: string;
  title: string;
  description: string;
  content?: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'template';
  category: string;
  file_url: string;
  thumbnail_url?: string;
  file_size: string;
  file_format: string;
  tags: string[];
  is_featured: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
}

interface Texts {
  title: string;
  subtitle: string;
  search: {
    placeholder: string;
    noResults: string;
    resultsFor: string;
  };
  categories: {
    all: string;
    promotional_texts: string;
    images: string;
    logos: string;
    templates: string;
    course_materials: string;
  };
  filters: {
    all: string;
    featured: string;
    recent: string;
    most_downloaded: string;
  };
  document: {
    download: string;
    preview: string;
    copy: string;
    downloads: string;
    viewImage: string;
    close: string;
  };
  viewMode: {
    grid: string;
    list: string;
  };
  empty: {
    title: string;
    subtitle: string;
  };
  toast: {
    downloaded: string;
    copied: string;
    error: string;
  };
  loading: string;
  error: string;
}

// Dil metinleri
const texts: Texts = {
  title: "Dokümanlar & Materyaller",
  subtitle: "Pazarlama materyallerinize buradan ulaşın. Tanıtım metinleri, görseller ve şablonlar.",
  search: {
    placeholder: "Doküman ara...",
    noResults: "Arama sonucu bulunamadı",
    resultsFor: "için sonuçlar"
  },
  categories: {
    all: "Tümü",
    promotional_texts: "Tanıtım Metinleri",
    images: "Görseller", 
    logos: "Logolar",
    templates: "Şablonlar",
    course_materials: "Kurs Materyalleri"
  },
  filters: {
    all: "Tümü",
    featured: "Öne Çıkanlar",
    recent: "Son Eklenenler",
    most_downloaded: "En Çok İndirilenler"
  },
  document: {
    download: "İndir",
    preview: "Önizle",
    copy: "Metni Kopyala",
    downloads: "İndirme",
    viewImage: "Görseli Görüntüle",
    close: "Kapat"
  },
  viewMode: {
    grid: "Kart Görünümü",
    list: "Liste Görünümü"
  },
  empty: {
    title: "Henüz doküman yok",
    subtitle: "Pazarlama materyalleri hazırlandığında burada görünecek"
  },
  toast: {
    downloaded: "Dosya indirildi ✓",
    copied: "Metin kopyalandı ✓",
    error: "Bir hata oluştu"
  },
  loading: "Yükleniyor...",
  error: "Veriler yüklenirken bir hata oluştu"
};

// Toast Component
const Toast = ({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error'; 
  onClose: () => void; 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-bottom-2 duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      {type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      <span>{message}</span>
    </div>
  );
};

// Image Modal Component
const ImageModal = ({ 
  document, 
  isOpen, 
  onClose 
}: { 
  document: Document | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  if (!isOpen || !document || document.type !== 'image') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative max-w-6xl max-h-full animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <Image
          src={isValidImageUrl(document.thumbnail_url || '') ? document.thumbnail_url! : (isValidImageUrl(document.file_url || '') ? document.file_url! : '/myuni-logo.png')}
          alt={document.title}
          width={1200}
          height={800}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
          <h3 className="font-medium text-lg mb-1">{document.title}</h3>
          <p className="text-sm text-gray-300">{document.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
            <span>{document.file_format}</span>
            <span>{document.file_size}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Text Modal Component  
const TextModal = ({ 
  document, 
  isOpen, 
  onClose,
  onCopy
}: { 
  document: Document | null; 
  isOpen: boolean; 
  onClose: () => void;
  onCopy: (text: string) => void;
}) => {
  if (!isOpen || !document || !document.content) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl max-h-[80vh] w-full flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h3 className="font-medium text-lg text-neutral-900 dark:text-neutral-100">
              {document.title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {document.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border">
            <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed">
              {document.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-4 text-xs text-neutral-500">
            <span>{document.file_format}</span>
            <span>{document.file_size}</span>
          </div>
          <button
            onClick={() => onCopy(document.content || '')}
            className="flex items-center px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-all duration-200 hover:scale-105"
          >
            <Copy className="w-4 h-4 mr-2" />
            Metni Kopyala
          </button>
        </div>
      </div>
    </div>
  );
};

// Utility Functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const isValidImageUrl = (url: string) => {
  if (!url || typeof url !== 'string') return false;
  // Check if it's a valid URL format
  try {
    // If it starts with /, it's a relative path and valid
    if (url.startsWith('/')) return true;
    // Otherwise, try to construct a URL to validate it
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getFileIcon = (type: Document['type']) => {
  switch (type) {
    case 'text':
    case 'template':
      return FileText;
    case 'image':
      return ImageIcon;
    case 'video':
      return Video;
    default:
      return File;
  }
};

const getFileTypeColor = (type: Document['type']) => {
  switch (type) {
    case 'text':
    case 'template':
      return 'text-blue-500';
    case 'image':
      return 'text-green-500';
    case 'video':
      return 'text-purple-500';
    default:
      return 'text-neutral-500';
  }
};

// Category Card Component
const CategoryCard = ({ 
  category, 
  isActive, 
  onClick 
}: { 
  category: DocumentCategory; 
  isActive: boolean; 
  onClick: () => void; 
}) => {
  const Icon = category.icon;
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all duration-200 text-left w-full hover:scale-105 ${
        isActive
          ? 'bg-[#990000] text-white border-[#990000] shadow-md'
          : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:border-[#990000]/30 hover:bg-[#990000]/5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : category.color}`} />
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
          isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
        }`}>
          {category.count}
        </span>
      </div>
      <h3 className="font-medium mb-1">
        {category.name}
      </h3>
      <p className={`text-sm ${
        isActive ? 'text-white/80' : 'text-neutral-600 dark:text-neutral-400'
      }`}>
        {category.description}
      </p>
    </button>
  );
};

// Document Card Component
const DocumentCard = ({ 
  document, 
  t,
  viewMode = 'grid',
  onTextPreview,
  onImagePreview,
  onCopyText,
  onDownload
}: { 
  document: Document; 
  t: Texts;
  viewMode?: 'grid' | 'list';
  onTextPreview: (doc: Document) => void;
  onImagePreview: (doc: Document) => void;
  onCopyText: (text: string) => void;
  onDownload: (doc: Document) => void;
}) => {
  const FileIcon = getFileIcon(document.type);
  const fileTypeColor = getFileTypeColor(document.type);

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:shadow-md hover:scale-[1.01] transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* File Icon/Thumbnail */}
            <div className="w-12 h-12 flex-shrink-0">
              {document.thumbnail_url && isValidImageUrl(document.thumbnail_url) ? (
                <Image
                  src={document.thumbnail_url}
                  alt={document.title}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => document.type === 'image' && onImagePreview(document)}
                />
              ) : (
                <div className="w-full h-full bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                  <FileIcon className={`w-6 h-6 ${fileTypeColor}`} />
                </div>
              )}
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {document.title}
                </h3>
                {document.is_featured && (
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-1">
                {document.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
                <span>{document.file_format}</span>
                <span>{document.file_size}</span>
                <span>{formatDate(document.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {document.type === 'image' && (
              <button
                onClick={() => onImagePreview(document)}
                className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title={t.document.viewImage}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {(document.type === 'text' || document.type === 'template') && (
              <>
                <button
                  onClick={() => onTextPreview(document)}
                  className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title={t.document.preview}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onCopyText(document.content || '')}
                  className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                  title={t.document.copy}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => onDownload(document)}
              className="flex items-center px-3 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-all duration-200 hover:scale-105 text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {t.document.download}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 hover:scale-[1.02] transition-all duration-300">
      {/* Thumbnail/Preview */}
      <div className="relative h-48 bg-neutral-100 dark:bg-neutral-700">
        {document.thumbnail_url && isValidImageUrl(document.thumbnail_url) ? (
          <Image
            src={document.thumbnail_url}
            alt={document.title}
            width={400}
            height={192}
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => document.type === 'image' && onImagePreview(document)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileIcon className={`w-16 h-16 ${fileTypeColor}`} />
          </div>
        )}
        
        {/* Featured Badge */}
        {document.is_featured && (
          <div className="absolute top-3 left-3 flex items-center px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium animate-pulse">
            <Star className="w-3 h-3 mr-1" />
            Öne Çıkan
          </div>
        )}

        {/* Quick Actions - Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center space-x-2">
            {document.type === 'image' && (
              <button
                onClick={() => onImagePreview(document)}
                className="p-3 bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-white dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-110 shadow-lg"
                title={t.document.viewImage}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            )}
            {(document.type === 'text' || document.type === 'template') && (
              <>
                <button
                  onClick={() => onTextPreview(document)}
                  className="p-3 bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-white dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-110 shadow-lg"
                  title={t.document.preview}
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onCopyText(document.content || '')}
                  className="p-3 bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-white dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-110 shadow-lg"
                  title={t.document.copy}
                >
                  <Copy className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* File Type Badge */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-white rounded text-xs font-medium">
          {document.file_format}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
          {document.title}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
          {document.description}
        </p>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {document.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-xs">
                +{document.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          <div >
            <span>{document.file_size}</span>
            <span>{formatDate(document.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {(document.type === 'text' || document.type === 'template') && (
            <button
              onClick={() => onCopyText(document.content || '')}
              className="flex-1 flex items-center justify-center px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105"
            >
              <Copy className="w-4 h-4 mr-1" />
              {t.document.copy}
            </button>
          )}
          <button
            onClick={() => onDownload(document)}
            className={`${(document.type === 'text' || document.type === 'template') ? 'flex-1' : 'w-full'} flex items-center justify-center px-3 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-all duration-200 hover:scale-105`}
          >
            <Download className="w-4 h-4 mr-2" />
            {t.document.download}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const DocumentsContent = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const t = texts;

  // Fetch documents from Supabase
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: documentsData, error: documentsError } = await supabaseMain
        .from('myuni_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentsError) {
        throw documentsError;
      }

      const processedDocuments = documentsData?.map(doc => ({
        ...doc,
        tags: doc.tags || []
      })) || [];

      setDocuments(processedDocuments);

      // Generate categories with counts
      const categoryCounts = processedDocuments.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const generatedCategories: DocumentCategory[] = [
        {
          id: 'all',
          name: t.categories.all,
          description: 'Tüm dokümanlar',
          icon: Folder,
          count: processedDocuments.length,
          color: 'text-neutral-500'
        },
        {
          id: 'promotional_texts',
          name: t.categories.promotional_texts,
          description: 'Hazır tanıtım yazıları ve açıklamalar',
          icon: FileText,
          count: categoryCounts.promotional_texts || 0,
          color: 'text-blue-500'
        },
        {
          id: 'images',
          name: t.categories.images,
          description: 'Banner, poster ve sosyal medya görselleri',
          icon: ImageIcon,
          count: categoryCounts.images || 0,
          color: 'text-green-500'
        },
        {
          id: 'logos',
          name: t.categories.logos,
          description: 'Logo ve marka görselleri',
          icon: Star,
          count: categoryCounts.logos || 0,
          color: 'text-purple-500'
        },
        {
          id: 'templates',
          name: t.categories.templates,
          description: 'Özelleştirilebilir şablonlar',
          icon: File,
          count: categoryCounts.templates || 0,
          color: 'text-orange-500'
        }
      ];

      setCategories(generatedCategories);

    } catch (err: unknown) {
      console.error('Error fetching documents:', err);
      const errorMessage = err instanceof Error ? err.message : t.error;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t.categories, t.error]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Category filter
    if (activeCategory !== 'all' && doc.category !== activeCategory) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!doc.title.toLowerCase().includes(searchLower) &&
          !doc.description?.toLowerCase().includes(searchLower) &&
          !doc.tags?.some(tag => tag.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    
    // Additional filters
    if (activeFilter === 'featured' && !doc.is_featured) return false;
    if (activeFilter === 'recent') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(doc.created_at) < weekAgo) return false;
    }
    if (activeFilter === 'most_downloaded') {
      if (doc.downloads < 10) return false;
    }
    
    return true;
  });

  // Event handlers
  const handleTextPreview = (document: Document) => {
    setSelectedDocument(document);
    setShowTextModal(true);
  };

  const handleImagePreview = (document: Document) => {
    setSelectedDocument(document);
    setShowImageModal(true);
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: t.toast.copied, type: 'success' });
    } catch {
      setToast({ message: t.toast.error, type: 'error' });
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      // Update download count
      const { error: updateError } = await supabaseMain
        .from('myuni_documents')
        .update({ downloads: document.downloads + 1 })
        .eq('id', document.id);

      if (updateError) {
        console.error('Error updating download count:', updateError);
      }

      // Download file
      if (document.file_url) {
        const link = window.document.createElement('a');
        link.href = document.file_url;
        link.download = `${document.title}.${document.file_format.toLowerCase()}`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }

      setToast({ message: t.toast.downloaded, type: 'success' });

      // Refresh documents to update download count
      fetchDocuments();

    } catch {
      setToast({ message: t.toast.error, type: 'error' });
    }
  };

  const handleRefresh = () => {
    fetchDocuments();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
                  <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border overflow-hidden">
                  <div className="h-48 bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="p-4">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-3"></div>
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="mt-4 lg:mt-0 flex items-center px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
              <button
                onClick={handleRefresh}
                className="ml-auto px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        {/* Search & Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t.search.placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Filters & View Mode */}
            <div className="flex items-center space-x-3">
              {/* Filter Dropdown */}
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200"
              >
                {Object.entries(t.filters).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                  title={t.viewMode.grid}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                  title={t.viewMode.list}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {filteredDocuments.length} {t.search.resultsFor} &quot;{searchTerm}&quot;
            </p>
          </div>
        )}

        {/* Documents Grid/List */}
        {filteredDocuments.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                t={t}
                viewMode={viewMode}
                onTextPreview={handleTextPreview}
                onImagePreview={handleImagePreview}
                onCopyText={handleCopyText}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
              {searchTerm ? (
                <Search className="w-8 h-8 text-neutral-500" />
              ) : (
                <FileText className="w-8 h-8 text-neutral-500" />
              )}
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {searchTerm ? t.search.noResults : t.empty.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `&quot;${searchTerm}&quot; için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.`
                : t.empty.subtitle
              }
            </p>
            {!searchTerm && (
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center px-6 py-3 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Yenile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TextModal
        document={selectedDocument}
        isOpen={showTextModal}
        onClose={() => {
          setShowTextModal(false);
          setSelectedDocument(null);
        }}
        onCopy={handleCopyText}
      />
      
      <ImageModal
        document={selectedDocument}
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedDocument(null);
        }}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Export
export default DocumentsContent;