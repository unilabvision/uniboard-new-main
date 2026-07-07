import nodemailer from 'nodemailer';

/**
 * Site Başvuruları modülü erişim / davet e-postası
 */
export async function sendSiteApplicationsAccessInviteEmail({
  to,
  name,
  locale = 'tr',
  dashboardUrl,
  invited = false,
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
    const subject = invited
      ? tr
        ? 'MyUNI Site Başvuruları — Davetiniz'
        : 'MyUNI Site Applications — Your Invitation'
      : tr
        ? 'MyUNI Site Başvuruları — Erişiminiz Açıldı'
        : 'MyUNI Site Applications — Access Granted';

    const greeting = tr ? `Merhaba ${name},` : `Hello ${name},`;
    const body = invited
      ? tr
        ? 'MyUNI Site Başvuruları paneline davet edildiniz. Hesabınızı oluşturmak için Clerk davet e-postanızdaki bağlantıyı kullanın; ardından aşağıdaki panele erişebilirsiniz.'
        : 'You have been invited to the MyUNI Site Applications panel. Use the link in your Clerk invitation email to create your account, then access the panel below.'
      : tr
        ? 'Site Başvuruları yönetim paneline erişiminiz açıldı.'
        : 'Your access to the Site Applications admin panel has been granted.';

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

    const textContent = `${greeting}\n\n${body}\n\n${dashboardUrl}\n\nSupport: info@myunilab.net`;

    const result = await transporter.sendMail({
      from: { name: 'MyUNI', address: process.env.EMAIL_USER },
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Site applications access email error:', error);
    return { success: false, error: error.message };
  }
}
