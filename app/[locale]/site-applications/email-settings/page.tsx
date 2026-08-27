'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Send, Save, Info, AlertTriangle } from 'lucide-react';

const t = {
  tr: {
    title: 'E-posta Ayarları',
    subtitle:
      'Başvuranlara kendi kurumsal e-postanızla mesaj göndermek için aşağıdaki adımları takip edin.',
    stepsTitle: 'Nasıl Yapılır?',
    step1:
      'E-posta sağlayıcınızın SMTP bilgilerini öğrenin. Bu bilgiler genellikle e-posta yönetim panelinizde veya IT departmanınızda bulunur.',
    step2:
      'Aşağıdaki formu doldurup "Kaydet" butonuna tıklayın. Sistem otomatik olarak bağlantıyı doğrulamaya çalışacak.',
    step3:
      'Doğrulama başarılı olursa "Test Maili Gönder" ile kendinize bir deneme maili gönderin. Başarısız olsa bile ayarlar kaydedilmişse tekrar deneyebilirsiniz.',
    step4:
      'Her şey tamamsa artık başvuru detay sayfasından başvuranlara mail gönderebilirsiniz.',
    host: 'SMTP Sunucu (Host)',
    hostHint:
      'E-posta sağlayıcınıza göre değişir. Örn: Gmail → smtp.gmail.com, Microsoft 365 → smtp.office365.com, Yandex → smtp.yandex.com',
    port: 'Port',
    portHint: '587 (TLS) veya 465 (SSL) kullanılır. Emin değilseniz 587 bırakın.',
    secure: 'SSL/TLS Bağlantısı',
    secureHint:
      'Port 465 ise işaretleyin. Port 587 ise işaretlemeyin (STARTTLS otomatik kullanılır).',
    user: 'Gönderen E-posta Adresi',
    userHint: 'Maillerin gönderileceği adres. Bu aynı zamanda SMTP kullanıcı adınızdır.',
    password: 'Şifre / Uygulama Parolası',
    passwordHint:
      'Gmail ve Google Workspace kullanıyorsanız normal şifreniz çalışmaz. Google Hesabı → Güvenlik → 2 Adımlı Doğrulama → Uygulama Parolaları bölümünden 16 karakterlik parola oluşturun. Boşluklu yapıştırabilirsiniz; sistem temizler.\nDaha önce kaydettiyseniz şifreyi değiştirmek istemiyorsanız bu alanı boş bırakabilirsiniz.',
    passwordKeepHint: 'Kayıtlı şifre korunacak (değiştirmek için yeni parola girin).',
    fromName: 'Gönderen Adı',
    fromNameHint:
      'Alıcıların gelen kutusunda göreceği isim. Örn: "XYZ Şirketi İK", "ABC Topluluk"',
    save: 'Kaydet ve Doğrula',
    test: 'Test Maili Gönder',
    testing: 'Gönderiliyor...',
    saving: 'Kaydediliyor...',
    verified: 'Bağlantı Doğrulandı',
    notVerified: 'Henüz Doğrulanmadı',
    testSuccess: 'Test maili başarıyla gönderildi!',
    testHint: 'Test maili, yukarıda girdiğiniz e-posta adresine gönderilir.',
    testDisabledHint: 'Önce ayarları kaydedin, ardından test maili gönderebilirsiniz.',
    saveSuccess: 'SMTP ayarları kaydedildi ve bağlantı doğrulandı.',
    saveSuccessNoVerify:
      'Ayarlar kaydedildi ancak SMTP bağlantısı doğrulanamadı. Ayrıntı aşağıda; bilgileri düzeltip tekrar kaydedin veya Test’i deneyin.',
    verifyFailHint:
      'Olası nedenler: Host/Port yanlış, şifre hatalı (App Password kullanıyor musunuz?), güvenlik duvarı SMTP portunu engelliyor, veya SSL/TLS seçimi portla uyumsuz. Google Workspace’te hello@alanadiniz.com için smtp.gmail.com + App Password gerekir.',
    hostPlaceholder: 'smtp.gmail.com',
    userPlaceholder: 'noreply@sirketiniz.com',
  },
  en: {
    title: 'Email Settings',
    subtitle:
      'Follow the steps below to send emails to applicants from your own corporate email address.',
    stepsTitle: 'How It Works',
    step1: "Get your SMTP credentials from your email provider's admin panel or IT department.",
    step2: 'Fill in the form below and click "Save". The system will automatically try to verify the connection.',
    step3:
      'If verification succeeds, use "Send Test Email". You can retry the test after a failed verify if settings were saved.',
    step4:
      'Once everything works, you can email applicants directly from the application detail page.',
    host: 'SMTP Host',
    hostHint:
      'Depends on your provider. E.g.: Gmail → smtp.gmail.com, Microsoft 365 → smtp.office365.com, Yandex → smtp.yandex.com',
    port: 'Port',
    portHint: 'Usually 587 (TLS) or 465 (SSL). If unsure, leave it at 587.',
    secure: 'SSL/TLS Connection',
    secureHint:
      'Check this if using port 465. Leave unchecked for port 587 (STARTTLS is used automatically).',
    user: 'Sender Email Address',
    userHint: 'The address emails will be sent from. This is also your SMTP username.',
    password: 'Password / App Password',
    passwordHint:
      'For Gmail/Google Workspace, your regular password won\'t work. Generate a 16-character App Password. Spaces are OK; we strip them.\nLeave blank to keep the previously saved password.',
    passwordKeepHint: 'Saved password will be kept (enter a new one to change it).',
    fromName: 'Sender Name',
    fromNameHint:
      'The name recipients will see in their inbox. E.g.: "XYZ Corp HR", "ABC Community"',
    save: 'Save & Verify',
    test: 'Send Test Email',
    testing: 'Sending...',
    saving: 'Saving...',
    verified: 'Connection Verified',
    notVerified: 'Not Yet Verified',
    testSuccess: 'Test email sent successfully!',
    testHint: 'The test email will be sent to the email address you entered above.',
    testDisabledHint: 'Save settings first, then you can send a test email.',
    saveSuccess: 'SMTP settings saved and connection verified.',
    saveSuccessNoVerify:
      'Settings saved but SMTP could not be verified. See details below; fix credentials and save again, or try Test.',
    verifyFailHint:
      'Possible reasons: Wrong host/port, incorrect password (App Password?), firewall blocking SMTP, or SSL/TLS mismatch. For Google Workspace custom domains use smtp.gmail.com + App Password.',
    hostPlaceholder: 'smtp.gmail.com',
    userPlaceholder: 'noreply@yourcompany.com',
  },
};

export default function EmailSettingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const labels = locale === 'en' ? t.en : t.tr;

  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [fromName, setFromName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [hasSavedConfig, setHasSavedConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string; detail?: string } | null>(
    null
  );

  useEffect(() => {
    fetch('/api/site-applications/smtp-config')
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setFlash({
            type: 'error',
            msg: data.error || (locale === 'en' ? 'Could not load settings' : 'Ayarlar yüklenemedi'),
          });
          return;
        }
        if (data.config) {
          setHost(data.config.smtp_host || '');
          setPort(String(data.config.smtp_port || 587));
          setSecure(Boolean(data.config.smtp_secure));
          setUser(data.config.smtp_user || '');
          setFromName(data.config.from_name || '');
          setIsVerified(Boolean(data.config.is_verified));
          setHasSavedConfig(true);
        }
      })
      .catch(() => {
        setFlash({
          type: 'error',
          msg: locale === 'en' ? 'Could not load settings' : 'Ayarlar yüklenemedi',
        });
      })
      .finally(() => setLoading(false));
  }, [locale]);

  const handleSave = async () => {
    setSaving(true);
    setFlash(null);
    try {
      const res = await fetch('/api/site-applications/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp_host: host.trim(),
          smtp_port: parseInt(port, 10) || 587,
          smtp_secure: secure,
          smtp_user: user.trim(),
          smtp_password: password,
          from_name: fromName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || (locale === 'en' ? 'Save failed' : 'Kayıt başarısız'));
      }
      setHasSavedConfig(true);
      setIsVerified(Boolean(data.verified));
      setPassword('');
      if (data.verified) {
        setFlash({ type: 'success', msg: labels.saveSuccess });
      } else {
        setFlash({
          type: 'error',
          msg: labels.saveSuccessNoVerify,
          detail: data.verifyError || undefined,
        });
      }
    } catch (err: unknown) {
      setFlash({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setFlash(null);
    try {
      const res = await fetch('/api/site-applications/smtp-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_email: user.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || (locale === 'en' ? 'Test failed' : 'Test başarısız'));
      }
      setIsVerified(true);
      setFlash({ type: 'success', msg: `${labels.testSuccess} (${data.sent_to})` });
    } catch (err: unknown) {
      setFlash({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Error',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-neutral-500">Loading...</div>;
  }

  const canSave = Boolean(host.trim() && user.trim() && (password || hasSavedConfig));
  const canTest = hasSavedConfig;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
        {labels.title}
      </h1>
      <p className="text-sm text-neutral-500 mb-6">{labels.subtitle}</p>

      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {labels.stepsTitle}
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300/90">
          <li>{labels.step1}</li>
          <li>{labels.step2}</li>
          <li>{labels.step3}</li>
          <li>{labels.step4}</li>
        </ol>
      </div>

      {flash && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            flash.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <p>{flash.msg}</p>
          {flash.detail && (
            <p className="mt-2 text-xs font-mono break-all opacity-90">{flash.detail}</p>
          )}
          {flash.type === 'error' && (
            <p className="mt-2 text-xs opacity-80 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              {labels.verifyFailHint}
            </p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> {labels.verified}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-1 rounded-full">
              <XCircle className="w-3.5 h-3.5" /> {labels.notVerified}
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {labels.host}
            </label>
            <input
              type="text"
              autoComplete="off"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder={labels.hostPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
            />
            <p className="text-xs text-neutral-500 mt-1.5">{labels.hostHint}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {labels.port}
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => {
                const next = e.target.value;
                setPort(next);
                if (next === '465') setSecure(true);
                if (next === '587') setSecure(false);
              }}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
            />
            <p className="text-xs text-neutral-500 mt-1.5">{labels.portHint}</p>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
              className="rounded border-neutral-300"
            />
            {labels.secure}
          </label>
          <p className="text-xs text-neutral-500 mt-1.5 ml-6">{labels.secureHint}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {labels.user}
          </label>
          {/* type=text avoids browser "pattern" validation quirks on corporate addresses */}
          <input
            type="text"
            inputMode="email"
            autoComplete="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder={labels.userPlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1.5">{labels.userHint}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {labels.password}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={hasSavedConfig ? '••••••••' : '••••••••'}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed whitespace-pre-line">
            {labels.passwordHint}
          </p>
          {hasSavedConfig && !password && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {labels.passwordKeepHint}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {labels.fromName}
          </label>
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="MyUNI HR"
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1.5">{labels.fromNameHint}</p>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5 space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !canSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#990000] text-white text-sm font-medium rounded-lg hover:bg-[#7a0000] disabled:opacity-50 transition"
            >
              <Save className="w-4 h-4" />
              {saving ? labels.saving : labels.save}
            </button>
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={testing || !canTest}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
              {testing ? labels.testing : labels.test}
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            {canTest ? labels.testHint : labels.testDisabledHint}
          </p>
        </div>
      </div>
    </div>
  );
}
