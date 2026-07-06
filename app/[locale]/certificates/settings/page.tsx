'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, ArrowLeft, Save, Trash, RefreshCw,
  Check, X, Upload, Edit, Settings as SettingsIcon,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { certificatesSupabase as supabase } from '@/app/_services/certificatesSupabaseClient';
import { getCertificateOrganizationSlugs, organizationSlugFromJoin } from '@/app/_services/organizationAccessService';
import { useUserModules } from '@/app/hooks/useUserModules';

// Types
interface Organization {
  id?: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at?: string;
  updated_at?: string;
}

// Localized texts
const texts = {
  tr: {
    title: "Organizasyon Ayarları",
    subtitle: "Kurumlarınızı ekleyin ve düzenleyin",
    form: {
      sections: {
        basicInfo: "Temel Bilgiler",
        appearance: "Görünüm",
        advanced: "Gelişmiş Ayarlar"
      },
      fields: {
        name: {
          label: "Kurum Adı",
          placeholder: "Örn: Massive Bioinformatics"
        },
        slug: {
          label: "Kurum Kısa Adı",
          placeholder: "Örn: massive-bioinformatics",
          helper: "Sadece küçük harfler, rakamlar ve tire kullanın"
        },
        description: {
          label: "Kurum Açıklaması",
          placeholder: "Kurumunuzun kısa açıklaması"
        },
        website: {
          label: "Web Sitesi",
          placeholder: "Örn: https://example.com"
        },
        logo: {
          label: "Logo",
          placeholder: "Logo URL veya dosya yükleyin",
          upload: "Logo Yükle",
          clear: "Temizle"
        },
        primaryColor: {
          label: "Ana Renk",
          placeholder: "Örn: #990000"
        },
        secondaryColor: {
          label: "İkincil Renk",
          placeholder: "Örn: #ffffff"
        }
      },
      buttons: {
        submit: "Kaydet",
        cancel: "İptal",
        add: "Yeni Kurum Ekle",
        edit: "Düzenle",
        delete: "Sil",
        viewCertificates: "Sertifikaları Görüntüle"
      },
      validation: {
        required: "Bu alan zorunludur",
        invalid: "Geçersiz değer",
        slugFormat: "Kısa ad sadece küçük harfler, rakamlar ve tire içerebilir",
        slugExists: "Bu kısa ad zaten kullanılıyor"
      }
    },
    confirmDelete: {
      title: "Kurumu Sil",
      message: "Bu kurumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      confirm: "Evet, Sil",
      cancel: "İptal"
    },
    notifications: {
      saved: "Kurum başarıyla kaydedildi",
      deleted: "Kurum başarıyla silindi",
      error: "Bir hata oluştu"
    },
    empty: {
      title: "Henüz kurum eklenmemiş",
      subtitle: "Sertifika oluşturmak için önce bir kurum eklemelisiniz",
      action: "Kurum Ekle"
    },
    loading: "Yükleniyor..."
  },
  en: {
    title: "Organization Settings",
    subtitle: "Add and edit your organizations",
    form: {
      sections: {
        basicInfo: "Basic Information",
        appearance: "Appearance",
        advanced: "Advanced Settings"
      },
      fields: {
        name: {
          label: "Organization Name",
          placeholder: "e.g. Massive Bioinformatics"
        },
        slug: {
          label: "Organization Slug",
          placeholder: "e.g. massive-bioinformatics",
          helper: "Use only lowercase letters, numbers and hyphens"
        },
        description: {
          label: "Organization Description",
          placeholder: "Short description of your organization"
        },
        website: {
          label: "Website",
          placeholder: "e.g. https://example.com"
        },
        logo: {
          label: "Logo",
          placeholder: "Logo URL or upload a file",
          upload: "Upload Logo",
          clear: "Clear"
        },
        primaryColor: {
          label: "Primary Color",
          placeholder: "e.g. #990000"
        },
        secondaryColor: {
          label: "Secondary Color",
          placeholder: "e.g. #ffffff"
        }
      },
      buttons: {
        submit: "Save",
        cancel: "Cancel",
        add: "Add New Organization",
        edit: "Edit",
        delete: "Delete",
        viewCertificates: "View Certificates"
      },
      validation: {
        required: "This field is required",
        invalid: "Invalid value",
        slugFormat: "Slug can only contain lowercase letters, numbers and hyphens",
        slugExists: "This slug is already in use"
      }
    },
    confirmDelete: {
      title: "Delete Organization",
      message: "Are you sure you want to delete this organization? This action cannot be undone.",
      confirm: "Yes, Delete",
      cancel: "Cancel"
    },
    notifications: {
      saved: "Organization saved successfully",
      deleted: "Organization deleted successfully",
      error: "An error occurred"
    },
    empty: {
      title: "No organizations yet",
      subtitle: "You need to add an organization before creating certificates",
      action: "Add Organization"
    },
    loading: "Loading..."
  }
};

// Form input component
const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  error,
  helper,
  required = false,
  disabled = false,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  colorPreview = false
}: { 
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  action?: () => void;
  actionLabel?: string;
  actionIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  colorPreview?: boolean;
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="flex">
          {type === 'textarea' ? (
            <textarea
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              rows={3}
              className={`w-full pl-3 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                error 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''} ${action ? 'rounded-r-none' : ''}`}
            />
          ) : (
            <div className="relative flex-1">
              {colorPreview && type === 'color' && (
                <div 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600"
                  style={{ backgroundColor: value || '#ffffff' }}
                ></div>
              )}
              <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full ${colorPreview && type === 'color' ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-md ${action ? 'rounded-r-none' : ''} focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                  error 
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                    : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
              />
            </div>
          )}
          
          {action && (
            <button
              type="button"
              onClick={action}
              className="px-4 py-2 bg-[#990000] hover:bg-[#880000] text-white font-medium rounded-r-md transition-colors flex items-center"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      
      {error ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
};

// Form section component
const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-700">
        {title}
      </h3>
      {children}
    </div>
  );
};

// Organization Card Component
const OrganizationCard = ({ 
  organization,
  onEdit,
  onDelete,
  locale,
  t,
  userRole,
  isAdmin
}: { 
  organization: Organization;
  onEdit: () => void;
  onDelete: () => void;
  locale: string;
  t: typeof texts.tr;
  userRole: string;
  isAdmin: boolean;
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header with organization accent color */}
      <div 
        className="h-2" 
        style={{ 
          backgroundColor: organization?.primary_color || '#990000'
        }}
      />
      
      <div className="p-6">
        {/* Organization logo and name */}
        <div className="flex items-center mb-4">
          {organization.logo ? (
            <Image 
              src={organization.logo} 
              alt={organization.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg object-contain mr-4 bg-white p-1 border border-neutral-200 dark:border-neutral-700"
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center mr-4"
              style={{ 
                backgroundColor: `${organization.primary_color || '#990000'}20`
              }}
            >
              <Building 
                className="w-8 h-8" 
                style={{ 
                  color: organization.primary_color || '#990000'
                }}
              />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              {organization.name}
            </h3>
            <div className="flex items-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-2">
                {organization.slug}
              </span>
              <div 
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: organization.primary_color || '#990000'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Organization description */}
        {organization.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
            {organization.description}
          </p>
        )}
        
        {/* Organization details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {organization.website && (
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block">
                Website
              </span>
              <a 
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                {new URL(organization.website).hostname}
                <Eye className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              Colors
            </span>
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 mr-2"
                style={{ backgroundColor: organization.primary_color || '#990000' }}
              ></div>
              {organization.secondary_color && (
                <div 
                  className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600"
                  style={{ backgroundColor: organization.secondary_color }}
                ></div>
              )}
            </div>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              Your Role
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {userRole === 'admin' ? 'Administrator' : 
               userRole === 'manager' ? 'Manager' : 
               userRole === 'member' ? 'Member' : userRole}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer with action buttons */}
      <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
        <Link
          href={`/${locale}/certificates/organizations/${organization.slug}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          {t.form.buttons.viewCertificates}
          <ArrowLeft className="w-3 h-3 ml-1" />
        </Link>
        
        {isAdmin && (
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Edit className="w-3 h-3 mr-1" />
              {t.form.buttons.edit}
            </button>
            
            <button
              onClick={onDelete}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-white dark:bg-neutral-800 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash className="w-3 h-3 mr-1" />
              {t.form.buttons.delete}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmDialog = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isOpen
}: {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Notification Component
const Toast = ({
  message,
  type = 'success',
  isVisible,
  onClose
}: {
  message: string;
  type?: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 ${
        type === 'success' 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
          type === 'success' 
            ? 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400'
        }`}>
          {type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </div>
        <div className={type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
          {message}
        </div>
        <button
          onClick={onClose}
          className={`ml-auto ${
            type === 'success' 
              ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
              : 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function OrganizationSettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState<Organization>({
    slug: '',
    name: '',
    description: '',
    website: '',
    logo: '',
    primary_color: '#990000',
    secondary_color: '#ffffff'
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, id?: number}>({show: false});
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const locale = 'tr'; // You can get this from params or context
  const t = texts[locale] || texts.tr;

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isLoaded || !clerkUser || modulesLoading) return;
      
      try {
        setLoading(true);

        const orgSlugs = await getCertificateOrganizationSlugs(clerkUser.id, isSuperAdmin);

        if (isSuperAdmin) {
          setUserRoles({});
          setIsAdmin(true);
        } else {
          const { data: accessData, error: accessError } = await supabase
            .from('user_module_access')
            .select('organization_role, organizations:organization_id (slug)')
            .eq('clerk_user_id', clerkUser.id)
            .eq('module_key', 'certificates')
            .eq('is_enabled', true);

          if (accessError) {
            throw accessError;
          }

          const roles: Record<string, string> = {};
          let userIsAdmin = false;

          accessData?.forEach((item) => {
            const slug = organizationSlugFromJoin(item.organizations);
            if (slug) {
              roles[slug] = item.organization_role || 'member';
              if (item.organization_role === 'admin') {
                userIsAdmin = true;
              }
            }
          });

          setUserRoles(roles);
          setIsAdmin(userIsAdmin);
        }

        if (orgSlugs.length === 0) {
          setOrganizations([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .in('slug', orgSlugs)
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        showToast(t.notifications.error, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [clerkUser, isLoaded, isSuperAdmin, modulesLoading, t.notifications.error]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate slug format
  const validateSlug = (slug: string) => {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug);
  };

  // Check if slug exists
  const checkSlugExists = (slug: string, currentId?: number) => {
    return organizations.some(org => org.slug === slug && org.id !== currentId);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name) newErrors.name = t.form.validation.required;
    if (!formData.slug) newErrors.slug = t.form.validation.required;
    
    // Slug format
    if (formData.slug && !validateSlug(formData.slug)) {
      newErrors.slug = t.form.validation.slugFormat;
    }
    
    // Check if slug exists (only for new organizations or if slug changed)
    if (formData.slug && checkSlugExists(formData.slug, formData.id)) {
      newErrors.slug = t.form.validation.slugExists;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({
      show: true,
      message,
      type
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Upload logo if a file is selected
      let logoUrl = formData.logo;
      if (logoFile) {
        try {
          const uploadedUrl = await uploadLogo();
          if (uploadedUrl) {
            logoUrl = uploadedUrl;
          } else {
            // If normal upload fails, try manual URL construction as fallback
            const fileExt = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
            const fileName = `${formData.slug}-${Date.now()}.${fileExt}`;
            
            // Even if upload failed, we can still save the form with expected URL pattern
            // This allows admin to manually upload the file later if needed
            logoUrl = `https://emfvwpztyuykqtepnsfp.supabase.co/storage/v1/object/public/unilab/organization-logos/${formData.slug}/${fileName}`;
            
            showToast('Logo yüklenemedi. Organizasyon oluşturulacak ancak logo daha sonra eklenebilir.', 'error');
          }
        } catch (uploadError) {
          console.error('Logo upload error in form submit:', uploadError);
          showToast('Logo yüklenemedi, diğer bilgiler kaydedilecek', 'error');
        }
      }
      
      const now = new Date().toISOString();
      const updatedFormData = {
        ...formData,
        logo: logoUrl
      };
      
      if (isEditing && formData.id) {
        // Update existing organization
        const { error } = await supabase
          .from('organizations')
          .update({
            ...updatedFormData,
            updated_at: now
          })
          .eq('id', formData.id);
        
        if (error) {
          console.error('Error updating organization:', error);
          throw error;
        }
        
        // Update local state
        setOrganizations(prev => 
          prev.map(org => org.id === formData.id ? { ...updatedFormData, updated_at: now } : org)
        );
        
        showToast(t.notifications.saved);
      } else {
        // Create new organization
        const { data, error } = await supabase
          .from('organizations')
          .insert([{
            ...updatedFormData,
            created_at: now,
            updated_at: now
          }])
          .select();
        
        if (error) {
          console.error('Error creating organization:', error);
          throw error;
        }
        
        // Update local state
        if (data && data[0]) {
          setOrganizations(prev => [...prev, data[0]]);
        }
        
        showToast(t.notifications.saved);
      }
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving organization:', error);
      showToast(t.notifications.error, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit organization
  const handleEdit = (organization: Organization) => {
    setFormData(organization);
    setIsEditing(true);
    setShowForm(true);
  };

  // Handle delete organization
  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) throw error;
      
      // Update local state
      setOrganizations(prev => prev.filter(org => org.id !== confirmDelete.id));
      
      showToast(t.notifications.deleted);
      
      // Close confirm dialog
      setConfirmDelete({ show: false });
    } catch (error) {
      console.error('Error deleting organization:', error);
      showToast(t.notifications.error, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      description: '',
      website: '',
      logo: '',
      primary_color: '#990000',
      secondary_color: '#ffffff'
    });
    setLogoFile(null);
    setErrors({});
    setIsEditing(false);
    setShowForm(false);
  };

  // Handle logo file selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setLogoFile(null);
      return;
    }
    
    const file = files[0];
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo dosyası 2MB\'dan küçük olmalıdır', 'error');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('Lütfen geçerli bir resim dosyası seçin', 'error');
      return;
    }
    
    setLogoFile(file);
    console.log('File selected:', file.name, file.size, file.type);
  };

  // Upload logo to Supabase storage
  const uploadLogo = async () => {
    if (!logoFile || !formData.slug) return null;
    
    try {
      setUploading(true);
      
      // First, convert the file to base64 to check if we can read it
      const reader = new FileReader();
      const fileBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(logoFile);
      });
      
      // Wait for file to be read as base64
      const fileBase64 = await fileBase64Promise;
      
      // Generate file path with timestamp to prevent duplicates
      const fileExt = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${formData.slug}-${Date.now()}.${fileExt}`;
      const filePath = `organization-logos/${formData.slug}/${fileName}`;
      
      console.log('Preparing to upload:', {
        fileName,
        filePath,
        fileSize: logoFile.size,
        fileType: logoFile.type,
        fileBase64Length: fileBase64.length
      });
      
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        throw new Error('Unable to list storage buckets');
      }
      
      console.log('Available buckets:', buckets.map(b => b.name));
      
      // Make sure the bucket exists - try with available buckets
      // Instead of checking for a specific bucket, use the first available bucket or a default
      const availableBuckets = buckets.map(b => b.name);
      console.log('All available buckets:', availableBuckets);
      
      // Try to use 'unilab' bucket or the first available bucket if it doesn't exist
      let bucketName = 'unilab';
      if (!availableBuckets.includes(bucketName) && availableBuckets.length > 0) {
        bucketName = availableBuckets[0];
        console.log(`Bucket 'unilab' not found, using available bucket: ${bucketName}`);
      }
      
      // Try direct file upload first (this might be more reliable with certain policies)
      try {
        console.log('Attempting direct file upload to bucket:', bucketName);
        const { data: directData, error: directError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: logoFile.type
          });
          
        if (directError) {
          console.error('Direct upload error:', directError);
          // If it's a permission issue, log more details
          if (directError.message && directError.message.includes('permission')) {
            console.error('This appears to be a permission issue. Make sure the bucket has a policy that allows uploads.');
          }
          // Continue to try the blob method below
        } else {
          console.log('Direct upload successful!', directData);
          
          // Create public URL using the proper method
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          console.log('Public URL data:', publicUrlData);
          
          const logoUrl = publicUrlData.publicUrl;
          
          // Update form data with logo URL
          setFormData(prev => ({ ...prev, logo: logoUrl }));
          
          return logoUrl;
        }
        
        console.log('Direct upload failed, trying blob method instead. Error:', directError);
      } catch (directUploadError) {
        console.error('Error in direct upload:', directUploadError);
      }
      
      // If direct upload failed, try with blob method
      console.log('Using blob upload method...');
      
      // Use direct file upload from base64 data
      // First, remove the data:image/xxx;base64, part
      const base64Data = fileBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: logoFile.type });
      
      // Upload the blob
      console.log('Uploading to bucket:', bucketName, 'path:', filePath);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: logoFile.type
        });
      
      if (error) {
        console.error('Supabase upload error details:', JSON.stringify(error));
        // Check if it's a permission issue
        if (error.message && (error.message.includes('permission') || error.message.includes('access') || error.message.includes('403'))) {
          throw new Error(`Upload failed due to permission issue. Please check bucket policies for ${bucketName}`);
        }
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
      
      console.log('Upload successful, data:', data);
      
      // Create public URL using the proper method
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log('Public URL data:', publicUrlData);
      
      const logoUrl = publicUrlData.publicUrl;
      
      // Update form data with logo URL
      setFormData(prev => ({ ...prev, logo: logoUrl }));
      
      return logoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logo yüklenirken bir hata oluştu';
      showToast(errorMessage, 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle logo upload button click
  const handleLogoUpload = () => {
    fileInputRef.current?.click();
  };

  // Clear selected logo
  const clearLogo = () => {
    setLogoFile(null);
    setFormData(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="flex justify-end mb-6">
              <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-40"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mr-4"></div>
                      <div>
                        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-40 mb-2"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-2"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-2"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
                        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
                      </div>
                    </div>
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
  if (!clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href={`/${locale}/certificates`} 
              className="mr-4 p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h1>
          </div>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            {t.subtitle}
          </p>
        </div>

        {/* Add Organization Button - Hidden as per request */}
        <div className="flex justify-end mb-6">
          {showForm && (
            <button
              onClick={resetForm}
              className="flex items-center px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              <X className="w-5 h-5 mr-2" />
              {t.form.buttons.cancel}
            </button>
          )}
        </div>

        {/* Organization Form */}
        {showForm && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
            <div className="flex items-center mb-6">
              <SettingsIcon className="w-5 h-5 text-[#990000] mr-2" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {isEditing ? 'Kurumu Düzenle' : 'Yeni Kurum Ekle'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <FormSection title={t.form.sections.basicInfo}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t.form.fields.name.label}
                    name="name"
                    placeholder={t.form.fields.name.placeholder}
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                  />
                  
                  <FormInput
                    label={t.form.fields.slug.label}
                    name="slug"
                    placeholder={t.form.fields.slug.placeholder}
                    value={formData.slug}
                    onChange={handleChange}
                    error={errors.slug}
                    helper={t.form.fields.slug.helper}
                    required
                    disabled={isEditing} // Can't change slug once created
                  />
                  
                  <div className="md:col-span-2">
                    <FormInput
                      label={t.form.fields.description.label}
                      name="description"
                      type="textarea"
                      placeholder={t.form.fields.description.placeholder}
                      value={formData.description || ''}
                      onChange={handleChange}
                      error={errors.description}
                    />
                  </div>
                  
                  <FormInput
                    label={t.form.fields.website.label}
                    name="website"
                    placeholder={t.form.fields.website.placeholder}
                    value={formData.website || ''}
                    onChange={handleChange}
                    error={errors.website}
                  />
                  
                  <FormInput
                    label={t.form.fields.logo.label}
                    name="logo"
                    placeholder={logoFile ? logoFile.name : t.form.fields.logo.placeholder}
                    value={formData.logo || ''}
                    onChange={handleChange}
                    error={errors.logo}
                    action={handleLogoUpload}
                    actionLabel={t.form.fields.logo.upload}
                    actionIcon={Upload}
                  />
                  
                  {/* Hidden file input for logo upload */}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleLogoFileChange}
                  />
                  
                  {/* Preview and clear button for selected logo */}
                  {(logoFile || formData.logo) && (
                    <div className="md:col-span-2 flex items-center mt-2">
                      {logoFile ? (
                        <div className="mr-2 font-medium text-sm text-green-600 flex items-center">
                          {uploading && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {logoFile.name} ({Math.round(logoFile.size / 1024)} KB) - {uploading ? 'Yükleniyor...' : 'Yüklenecek'}
                        </div>
                      ) : formData.logo ? (
                        <div className="mr-2 flex items-center">
                          <Image 
                            src={formData.logo} 
                            alt="Logo" 
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain mr-2 rounded border border-neutral-200 dark:border-neutral-700"
                            onError={(e) => {
                              e.currentTarget.src = '/myuni-logo.png'; // Fallback to default image
                              e.currentTarget.onerror = null; // Prevent infinite loop
                            }}
                          />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {formData.logo.includes('/')
                              ? formData.logo.split('/').pop()
                              : formData.logo
                            }
                          </span>
                        </div>
                      ) : null}
                      
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium flex items-center"
                      >
                        <X className="w-3 h-3 mr-1" />
                        {t.form.fields.logo.clear}
                      </button>
                    </div>
                  )}
                </div>
              </FormSection>
              
              <FormSection title={t.form.sections.appearance}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t.form.fields.primaryColor.label}
                    name="primary_color"
                    type="color"
                    placeholder={t.form.fields.primaryColor.placeholder}
                    value={formData.primary_color || '#990000'}
                    onChange={handleChange}
                    error={errors.primary_color}
                    colorPreview
                  />
                  
                  <FormInput
                    label={t.form.fields.secondaryColor.label}
                    name="secondary_color"
                    type="color"
                    placeholder={t.form.fields.secondaryColor.placeholder}
                    value={formData.secondary_color || '#ffffff'}
                    onChange={handleChange}
                    error={errors.secondary_color}
                    colorPreview
                  />
                </div>
              </FormSection>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mr-3"
                >
                  {t.form.buttons.cancel}
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white font-medium rounded-lg transition-colors disabled:bg-neutral-400 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {t.loading}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {t.form.buttons.submit}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Organizations List */}
        {organizations.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Building className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t.empty.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {isAdmin ? t.empty.subtitle : "Henüz erişiminiz olan bir organizasyon bulunmuyor."}
            </p>
            {/* "Add Organization" button hidden as per request */}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizations.map(org => (
              <OrganizationCard
                key={org.id}
                organization={org}
                onEdit={() => handleEdit(org)}
                onDelete={() => setConfirmDelete({ show: true, id: org.id })}
                locale={locale}
                t={t}
                userRole={userRoles[org.slug] || 'member'}
                isAdmin={userRoles[org.slug] === 'admin' || isAdmin}
              />
            ))}
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          title={t.confirmDelete.title}
          message={t.confirmDelete.message}
          confirmText={t.confirmDelete.confirm}
          cancelText={t.confirmDelete.cancel}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete({ show: false })}
          isOpen={confirmDelete.show}
        />

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      </div>
    </div>
  );
}
