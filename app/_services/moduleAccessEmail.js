import nodemailer from 'nodemailer';

export async function sendModuleAccessEmail({
  to,
  name,
  locale = 'tr',
  dashboardUrl,
  moduleNameTr,
  moduleNameEn,
  invited = false,
  extraNoteTr = '',
  extraNoteEn = '',
  ctaLabelTr,
  ctaLabelEn,
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();

    const tr = locale === 'tr';
    const moduleName = tr ? moduleNameTr : moduleNameEn;
    const subject = invited
      ? tr
        ? `MyUNI — ${moduleName} panel davetiniz`
        : `MyUNI — Your ${moduleName} panel invitation`
      : tr
        ? `MyUNI — ${moduleName} erişiminiz açıldı`
        : `MyUNI — ${moduleName} access granted`;

    const greeting = tr ? `Merhaba ${name},` : `Hello ${name},`;
    const body = invited
      ? tr
        ? `${moduleName} paneline davet edildiniz. Aşağıdaki butona tıklayarak hesabınızı oluşturun veya giriş yapın; ardından panele yönlendirileceksiniz.${extraNoteTr ? ` ${extraNoteTr}` : ''}`
        : `You have been invited to the ${moduleName} panel. Click the button below to create your account or sign in; you will then be taken to the panel.${extraNoteEn ? ` ${extraNoteEn}` : ''}`
      : tr
        ? `${moduleName} yönetim paneline erişiminiz açıldı. Panele gitmek için aşağıdaki butonu kullanın.${extraNoteTr ? ` ${extraNoteTr}` : ''}`
        : `Your access to the ${moduleName} admin panel has been granted. Use the button below to open the panel.${extraNoteEn ? ` ${extraNoteEn}` : ''}`;

    const cta = invited
      ? tr
        ? ctaLabelTr || 'Daveti kabul et / Panele git'
        : ctaLabelEn || 'Accept invite / Open panel'
      : tr
        ? ctaLabelTr || 'Panele Git'
        : ctaLabelEn || 'Open Panel';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <p>${greeting}</p>
        <p>${body}</p>
        <p style="margin: 24px 0;">
          <a href="${dashboardUrl}" style="background:#990000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
            ${cta}
          </a>
        </p>
        <p style="font-size:12px;color:#666;word-break:break-all;">${dashboardUrl}</p>
        <p style="font-size:12px;color:#666;">${tr ? 'Destek' : 'Support'}: info@myunilab.net</p>
      </div>
    `;

    const result = await transporter.sendMail({
      from: { name: 'MyUNI', address: process.env.EMAIL_USER },
      to,
      subject,
      html: htmlContent,
      text: `${greeting}\n\n${body}\n\n${dashboardUrl}`,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Module access email error:', error);
    return { success: false, error: error.message };
  }
}
