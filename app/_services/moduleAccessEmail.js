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
        ? `MyUNI — ${moduleName} davetiniz`
        : `MyUNI — Your ${moduleName} invitation`
      : tr
        ? `MyUNI — ${moduleName} erişiminiz açıldı`
        : `MyUNI — ${moduleName} access granted`;

    const greeting = tr ? `Merhaba ${name},` : `Hello ${name},`;
    const body = invited
      ? tr
        ? `${moduleName} paneline davet edildiniz. Hesabınızı oluşturmak için Clerk davet e-postanızdaki bağlantıyı kullanın; ardından panele erişebilirsiniz.`
        : `You have been invited to the ${moduleName} panel. Use your Clerk invitation email to create your account, then access the panel.`
      : tr
        ? `${moduleName} yönetim paneline erişiminiz açıldı.${extraNoteTr ? ` ${extraNoteTr}` : ''}`
        : `Your access to the ${moduleName} admin panel has been granted.${extraNoteEn ? ` ${extraNoteEn}` : ''}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <p>${greeting}</p>
        <p>${body}</p>
        <p style="margin: 24px 0;">
          <a href="${dashboardUrl}" style="background:#990000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
            ${tr ? 'Panele Git' : 'Open Panel'}
          </a>
        </p>
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
