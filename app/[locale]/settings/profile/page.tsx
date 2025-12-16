"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Mail, Phone, Save, 
  Eye, EyeOff, AlertCircle, CheckCircle, 
  Camera, Trash2, Edit3, Shield
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

// Types
interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Dil metinleri
const texts = {
  tr: {
    title: "Profil Ayarları",
    subtitle: "Profil bilgilerinizi yönetin ve hesap ayarlarınızı güncelleyin",
    sections: {
      personalInfo: "Kişisel Bilgiler",
      security: "Güvenlik",
      avatar: "Profil Fotoğrafı"
    },
    fields: {
      firstName: "Ad",
      lastName: "Soyad",
      email: "E-posta",
      phone: "Telefon",
      bio: "Hakkımda",
      currentPassword: "Mevcut Şifre",
      newPassword: "Yeni Şifre",
      confirmPassword: "Yeni Şifre (Tekrar)"
    },
    placeholders: {
      firstName: "Adınızı girin",
      lastName: "Soyadınızı girin",
      email: "E-posta adresiniz",
      phone: "+90 5xx xxx xx xx",
      bio: "Kendiniz hakkında kısa bir açıklama yazın..."
    },
    buttons: {
      save: "Değişiklikleri Kaydet",
      changePassword: "Şifreyi Değiştir",
      uploadPhoto: "Fotoğraf Yükle",
      removePhoto: "Fotoğrafı Kaldır",
      cancel: "İptal"
    },
    messages: {
      profileUpdated: "Profil bilgileri başarıyla güncellendi",
      passwordChanged: "Şifre başarıyla değiştirildi",
      passwordMismatch: "Şifreler eşleşmiyor",
      passwordTooShort: "Şifre en az 8 karakter olmalıdır",
      fillAllFields: "Lütfen tüm alanları doldurun",
      photoUploaded: "Profil fotoğrafı başarıyla güncellendi",
      photoRemoved: "Profil fotoğrafı kaldırıldı",
      error: "Bir hata oluştu, lütfen tekrar deneyin"
    },
    validation: {
      emailInvalid: "Geçerli bir e-posta adresi girin",
      phoneInvalid: "Geçerli bir telefon numarası girin",
      required: "Bu alan zorunludur"
    }
  },
  en: {
    title: "Profile Settings",
    subtitle: "Manage your profile information and update account settings",
    sections: {
      personalInfo: "Personal Information",
      security: "Security",
      avatar: "Profile Photo"
    },
    fields: {
      firstName: "First Name",
      lastName: "Last Name", 
      email: "Email",
      phone: "Phone",
      bio: "About Me",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password"
    },
    placeholders: {
      firstName: "Enter your first name",
      lastName: "Enter your last name",
      email: "Your email address",
      phone: "+1 xxx xxx xxxx",
      bio: "Write a short description about yourself..."
    },
    buttons: {
      save: "Save Changes",
      changePassword: "Change Password",
      uploadPhoto: "Upload Photo",
      removePhoto: "Remove Photo",
      cancel: "Cancel"
    },
    messages: {
      profileUpdated: "Profile information updated successfully",
      passwordChanged: "Password changed successfully",
      passwordMismatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 8 characters",
      fillAllFields: "Please fill in all fields",
      photoUploaded: "Profile photo updated successfully",
      photoRemoved: "Profile photo removed",
      error: "An error occurred, please try again"
    },
    validation: {
      emailInvalid: "Enter a valid email address",
      phoneInvalid: "Enter a valid phone number",
      required: "This field is required"
    }
  }
};

// Utility Functions
// Removed unused validation functions

// Components
const InputField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  icon: Icon,
  disabled = false
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
        error 
          ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200' 
          : 'border-neutral-300 dark:border-neutral-600 focus:border-[#990000] focus:ring-red-100'
      } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
    />
    {error && (
      <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

const TextAreaField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  error, 
  rows = 4,
  icon: Icon
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  rows?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
        error 
          ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200' 
          : 'border-neutral-300 dark:border-neutral-600 focus:border-[#990000] focus:ring-red-100'
      } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2`}
    />
    {error && (
      <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

const NotificationMessage = ({ 
  type, 
  message, 
  onClose 
}: { 
  type: 'success' | 'error'; 
  message: string; 
  onClose: () => void; 
}) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${
    type === 'success' 
      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200' 
      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
  }`}>
    {type === 'success' ? (
      <CheckCircle className="w-5 h-5" />
    ) : (
      <AlertCircle className="w-5 h-5" />
    )}
    <span className="font-medium">{message}</span>
    <button
      onClick={onClose}
      className="ml-4 text-neutral-400 hover:text-neutral-600"
    >
      ×
    </button>
  </div>
);

// Main Settings Component
const SettingsContent = ({ locale }: { locale: string }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user: clerkUser, isLoaded } = useUser();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Load user data from Clerk
  useEffect(() => {
    if (isLoaded && clerkUser) {
      setProfileData({
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || '',
        bio: ''
      });
    }
  }, [clerkUser, isLoaded]);

  // Validation
  const validateProfileForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = t.validation.required;
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = t.validation.required;
    }
    // Email and phone are disabled/read-only, no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = t.validation.required;
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = t.validation.required;
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = t.messages.passwordTooShort;
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = t.validation.required;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = t.messages.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;

    setLoading(true);
    try {
      // Update basic user info via Clerk
      await clerkUser?.update({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });

      // Note: Email and phone updates in Clerk require verification
      // These would typically trigger verification flows
      // For now, we'll just update the basic profile info

      setNotification({
        type: 'success',
        message: t.messages.profileUpdated
      });
    } catch (error) {
      console.error('Profile update error:', error);
      setNotification({
        type: 'error',
        message: t.messages.error
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      // Update password via Clerk
      await clerkUser?.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setNotification({
        type: 'success',
        message: t.messages.passwordChanged
      });
    } catch (error) {
      console.error('Password change error:', error);
      setNotification({
        type: 'error',
        message: t.messages.error
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Upload avatar via Clerk
      await clerkUser?.setProfileImage({ file });

      setNotification({
        type: 'success',
        message: t.messages.photoUploaded
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      setNotification({
        type: 'error',
        message: t.messages.error
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      await clerkUser?.setProfileImage({ file: null });

      setNotification({
        type: 'success',
        message: t.messages.photoRemoved
      });
    } catch (error) {
      console.error('Avatar removal error:', error);
      setNotification({
        type: 'error',
        message: t.messages.error
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-full xl:max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {t.title}
          </h1>
          <div className="w-12 sm:w-16 h-px bg-[#990000] mb-4"></div>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Profile Photo Section */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 sticky top-8">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                {t.sections.avatar}
              </h2>
              
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {clerkUser.imageUrl ? (
                    <Image
                      src={clerkUser.imageUrl}
                      alt="Profile"
                      width={150}
                      height={150}
                      className="w-36 h-36 rounded-full object-cover border-4 border-neutral-200 dark:border-neutral-700"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-gradient-to-r from-[#990000] to-red-600 flex items-center justify-center border-4 border-neutral-200 dark:border-neutral-700">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={loading}
                    />
                    <span className="inline-flex items-center px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-colors cursor-pointer disabled:opacity-50">
                      <Camera className="w-4 h-4 mr-2" />
                      {t.buttons.uploadPhoto}
                    </span>
                  </label>
                  
                  {clerkUser.imageUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={loading}
                      className="block w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2 inline" />
                      {t.buttons.removePhoto}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <div className="xl:col-span-3 space-y-8">
            {/* Personal Information */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2" />
                {t.sections.personalInfo}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <InputField
                  label={t.fields.firstName}
                  value={profileData.firstName}
                  onChange={(value) => setProfileData({...profileData, firstName: value})}
                  placeholder={t.placeholders.firstName}
                  error={errors.firstName}
                  required
                  icon={User}
                />
                
                <InputField
                  label={t.fields.lastName}
                  value={profileData.lastName}
                  onChange={(value) => setProfileData({...profileData, lastName: value})}
                  placeholder={t.placeholders.lastName}
                  error={errors.lastName}
                  required
                  icon={User}
                />
                
                <InputField
                  label={t.fields.email}
                  type="email"
                  value={profileData.email}
                  onChange={(value) => setProfileData({...profileData, email: value})}
                  placeholder={t.placeholders.email}
                  error={errors.email}
                  required
                  icon={Mail}
                  disabled={true}
                />
                
                <InputField
                  label={t.fields.phone}
                  type="tel"
                  value={profileData.phone}
                  onChange={(value) => setProfileData({...profileData, phone: value})}
                  placeholder={t.placeholders.phone}
                  error={errors.phone}
                  icon={Phone}
                  disabled={true}
                />
              </div>
              
              <div className="mt-6">
                <TextAreaField
                  label={t.fields.bio}
                  value={profileData.bio}
                  onChange={(value) => setProfileData({...profileData, bio: value})}
                  placeholder={t.placeholders.bio}
                  rows={4}
                  icon={Edit3}
                />
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="px-6 py-3 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Kaydediliyor...' : t.buttons.save}
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                {t.sections.security}
              </h2>
              
              <div className="space-y-6">
                <div className="relative">
                  <InputField
                    label={t.fields.currentPassword}
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(value) => setPasswordData({...passwordData, currentPassword: value})}
                    error={errors.currentPassword}
                    required
                    icon={Lock}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="relative">
                    <InputField
                      label={t.fields.newPassword}
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(value) => setPasswordData({...passwordData, newPassword: value})}
                      error={errors.newPassword}
                      required
                      icon={Lock}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <InputField
                      label={t.fields.confirmPassword}
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(value) => setPasswordData({...passwordData, confirmPassword: value})}
                      error={errors.confirmPassword}
                      required
                      icon={Lock}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="px-6 py-3 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {loading ? 'Değiştiriliyor...' : t.buttons.changePassword}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <NotificationMessage
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

// Main Page Component
export default function SettingsPage({ params }: SettingsPageProps) {
  const [locale, setLocale] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale);
      setMounted(true);
    };
    resolveParams();
  }, [params]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
      </div>
    );
  }

  return <SettingsContent locale={locale} />;
}