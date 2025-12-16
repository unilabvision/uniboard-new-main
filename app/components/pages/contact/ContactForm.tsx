'use client';

import React, { useState, useRef, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ContactFormProps {
  locale: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  honeypot: string;
  timestamp: number;
  browser: string;
  operatingSystem: string;
  deviceType: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  general?: string;
  captcha?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ locale }) => {
  const content = {
    tr: {
      nameLabel: "Adınız",
      namePlaceholder: "Adınızı giriniz",
      surnameLabel: "Soyadınız",
      surnamePlaceholder: "Soyadınızı giriniz",
      emailLabel: "E-posta Adresiniz",
      emailPlaceholder: "E-posta adresinizi giriniz",
      phoneLabel: "Telefon Numaranız",
      phonePlaceholder: "Telefon numaranızı giriniz",
      messageLabel: "Mesajınız",
      messagePlaceholder: "Mesajınızı buraya yazınız...",
      submitButton: "Gönder",
      submittingButton: "Gönderiliyor...",
      successMessage: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
      errorMessage: "Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
      networkErrorMessage: "Bağlantı hatası oluştu. İnternet bağlantınızı kontrol ediniz.",
      requiredFieldError: "Bu alan zorunludur",
      invalidEmailError: "Geçerli bir e-posta adresi giriniz",
      invalidPhoneError: "Geçerli bir telefon numarası giriniz",
      spamProtectionText: "Bu formda spam koruması ve güvenlik doğrulaması bulunmaktadır.",
      hcaptchaError: "Lütfen robot olmadığınızı doğrulayın.",
      tryAgainButton: "Tekrar Dene",
    },
    en: {
      nameLabel: "First Name",
      namePlaceholder: "Enter your first name",
      surnameLabel: "Last Name",
      surnamePlaceholder: "Enter your last name",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      phoneLabel: "Phone Number",
      phonePlaceholder: "Enter your phone number",
      messageLabel: "Message",
      messagePlaceholder: "Write your message here...",
      submitButton: "Submit",
      submittingButton: "Sending...",
      successMessage: "Your message has been sent successfully. We will get back to you as soon as possible.",
      errorMessage: "An error occurred while sending your message. Please try again later.",
      networkErrorMessage: "Connection error occurred. Please check your internet connection.",
      requiredFieldError: "This field is required",
      invalidEmailError: "Please enter a valid email address",
      invalidPhoneError: "Please enter a valid phone number",
      spamProtectionText: "This form has spam protection and security verification.",
      hcaptchaError: "Please verify that you are not a robot.",
      tryAgainButton: "Try Again",
    },
  };

  const t = locale in content ? content[locale as keyof typeof content] : content.tr;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    honeypot: '',
    timestamp: Date.now(),
    browser: '',
    operatingSystem: '',
    deviceType: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<HCaptcha>(null);

  // Load hCaptcha script - removed since we're using @hcaptcha/react-hcaptcha
  // useEffect(() => {
  //   const loadHCaptcha = () => {
  //     // No need to load script manually with @hcaptcha/react-hcaptcha
  //   };
  //   loadHCaptcha();
  // }, []);

  // Initialize hCaptcha widget - removed since @hcaptcha/react-hcaptcha handles this
  // useEffect(() => {
  //   // No need to manually initialize with @hcaptcha/react-hcaptcha
  // }, []);

  useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      let browserName = "Unknown";
      let browserVersion = "";

      if (userAgent.indexOf("Firefox") > -1) {
        browserName = "Firefox";
        browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("SamsungBrowser") > -1) {
        browserName = "Samsung Browser";
        browserVersion = userAgent.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
        browserName = "Opera";
        browserVersion = userAgent.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Trident") > -1) {
        browserName = "Internet Explorer";
        browserVersion = userAgent.match(/rv:([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Edge") > -1) {
        browserName = "Edge (Legacy)";
        browserVersion = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Edg") > -1) {
        browserName = "Edge Chromium";
        browserVersion = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Chrome") > -1) {
        browserName = "Chrome";
        browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Safari") > -1) {
        browserName = "Safari";
        browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] || "";
      }

      return `${browserName} ${browserVersion}`.trim();
    };

    const detectOS = () => {
      const userAgent = navigator.userAgent;
      let osName = "Unknown";

      if (userAgent.indexOf("Win") > -1) {
        osName = "Windows";
        if (userAgent.indexOf("Windows NT 10.0") > -1) osName = "Windows 10";
        else if (userAgent.indexOf("Windows NT 6.3") > -1) osName = "Windows 8.1";
        else if (userAgent.indexOf("Windows NT 6.2") > -1) osName = "Windows 8";
        else if (userAgent.indexOf("Windows NT 6.1") > -1) osName = "Windows 7";
      } else if (userAgent.indexOf("Mac") > -1) {
        osName = "MacOS";
      } else if (userAgent.indexOf("Android") > -1) {
        osName = "Android";
      } else if (userAgent.indexOf("like Mac") > -1) {
        osName = "iOS";
      } else if (userAgent.indexOf("Linux") > -1) {
        osName = "Linux";
      } else if (userAgent.indexOf("X11") > -1) {
        osName = "UNIX";
      }

      return osName;
    };

    const detectDeviceType = (): 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' => {
      const userAgent = navigator.userAgent;

      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        return "Tablet";
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return "Mobile";
      } else if (/Windows|Mac|Linux|X11/i.test(userAgent)) {
        return "Desktop";
      }
      return "Unknown";
    };

    setFormData(prev => ({
      ...prev,
      browser: detectBrowser(),
      operatingSystem: detectOS(),
      deviceType: detectDeviceType(),
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t.requiredFieldError;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t.requiredFieldError;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.requiredFieldError;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.invalidEmailError;
    }

    if (formData.phone.trim() && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = t.invalidPhoneError;
    }

    if (!formData.message.trim()) {
      newErrors.message = t.requiredFieldError;
    }

    // hCaptcha validation
    if (!captchaToken) {
      newErrors.captcha = t.hcaptchaError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData(prev => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
      honeypot: '',
      timestamp: Date.now(),
      browser: prev.browser,
      operatingSystem: prev.operatingSystem,
      deviceType: prev.deviceType,
    }));
    setErrors({});
    
    if (formRef.current) {
      formRef.current.reset();
    }
    
    // Don't reset hCaptcha here - it will be reset when needed
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get hCaptcha response
    if (!captchaToken) {
      setErrors({ captcha: t.hcaptchaError });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrors({});

    try {
      
      const requestBody = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        locale,
        browser: formData.browser,
        operatingSystem: formData.operatingSystem,
        deviceType: formData.deviceType,
        honeypot: formData.honeypot,
        timestamp: formData.timestamp,
        hCaptchaToken: captchaToken,
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData;
        const responseText = await response.text();
        
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        
        console.error('API returned error:', errorData);
        
        if (response.status === 400) {
          // Check if it's a captcha error
          if (errorData.error?.includes('Captcha') || errorData.error?.includes('verification')) {
            setErrors({ captcha: t.hcaptchaError });
            // Reset hCaptcha on error
            if (captchaRef.current) {
              captchaRef.current.resetCaptcha();
            }
            setCaptchaToken(null);
          } else {
            setErrors({ general: errorData.error || t.errorMessage });
          }
        } else if (response.status >= 500) {
          setErrors({ general: t.networkErrorMessage });
        } else {
          setErrors({ general: t.errorMessage });
        }
        
        setSubmitStatus('error');
        return;
      }

      const result = await response.json();

      setSubmissionId(result.submissionId || '');
      setSubmitStatus('success');
      resetForm();

    } catch (error) {
      console.error('Form submission error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      
      if (error instanceof Error && error.name === 'TypeError') {
        setErrors({ general: t.networkErrorMessage });
      } else {
        setErrors({ general: t.errorMessage });
      }
      
      setSubmitStatus('error');
      
      // Reset hCaptcha on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSubmitStatus('idle');
    setErrors({});
    
    // Reset hCaptcha when trying again
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
    setCaptchaToken(null);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-8">
      {submitStatus === 'success' ? (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-6 rounded-sm flex items-start">
          <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t.successMessage}</p>
            {submissionId && (
              <p className="text-sm mt-2 opacity-80">
                {locale === 'tr' ? 'Referans No' : 'Reference ID'}: {submissionId}
              </p>
            )}
          </div>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Honeypot field */}
          <div className="hidden">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* General error message */}
          {(submitStatus === 'error' || errors.general) && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-6 rounded-sm flex items-start">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{errors.general || t.errorMessage}</p>
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  {t.tryAgainButton}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.nameLabel} *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder={t.namePlaceholder}
                className={`w-full p-3 text-black dark:text-white bg-neutral-50 dark:bg-neutral-900 border ${
                  errors.firstName
                    ? 'border-red-300 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
                required
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.surnameLabel} *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder={t.surnamePlaceholder}
                className={`w-full p-3 text-black dark:text-white bg-neutral-50 dark:bg-neutral-900 border ${
                  errors.lastName
                    ? 'border-red-300 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
                required
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.emailLabel} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t.emailPlaceholder}
                className={`w-full text-black dark:text-white p-3 bg-neutral-50 dark:bg-neutral-900 border ${
                  errors.email
                    ? 'border-red-300 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
                required
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.phoneLabel}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t.phonePlaceholder}
                className={`w-full p-3 text-black dark:text-white bg-neutral-50 dark:bg-neutral-900 border ${
                  errors.phone
                    ? 'border-red-300 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t.messageLabel} *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder={t.messagePlaceholder}
              rows={6}
              className={`w-full p-3 text-black dark:text-white bg-neutral-50 dark:bg-neutral-900 border ${
                errors.message
                  ? 'border-red-300 dark:border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700'
              } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
              required
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
            )}
          </div>

          {/* hCaptcha Widget */}
          <div className="md:col-span-2">
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '7dbc4a24-2176-4928-8222-a65c5504acdc'}
              onVerify={(token) => {
                setCaptchaToken(token);
                if (errors.captcha) {
                  setErrors(prev => ({ ...prev, captcha: '' }));
                }
              }}
              onExpire={() => {
                setCaptchaToken(null);
                setErrors(prev => ({ ...prev, captcha: t.hcaptchaError }));
              }}
              onError={() => {
                setCaptchaToken(null);
                setErrors(prev => ({ ...prev, captcha: t.hcaptchaError }));
              }}
              onLoad={() => console.log('hCaptcha loaded')}
              theme="light"
              size="normal"
            />
            {errors.captcha && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.captcha}
              </p>
            )}
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
            <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
            {t.spamProtectionText}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !captchaToken}
              className="bg-[#a90013] hover:bg-[#8a0010] dark:bg-[#a90013] dark:hover:bg-[#8a0010] text-white py-3 px-8 rounded-sm text-md font-medium transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {t.submittingButton}
                </>
              ) : (
                t.submitButton
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContactForm;