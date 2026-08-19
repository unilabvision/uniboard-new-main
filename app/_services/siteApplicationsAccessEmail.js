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
        ? 'MyUNI Site Başvuruları paneline davet edildiniz. Aşağıdaki butona tıklayarak hesabınızı oluşturun veya giriş yapın; ardından panele yönlendirileceksiniz.'
        : 'You have been invited to the MyUNI Site Applications panel. Click the button below to create your account or sign in; you will then be taken to the panel.'
      : tr
        ? 'Site Başvuruları yönetim paneline erişiminiz açıldı. Panele gitmek için aşağıdaki butonu kullanın.'
        : 'Your access to the Site Applications admin panel has been granted. Use the button below to open the panel.';

    const cta = invited
      ? tr
        ? 'Daveti kabul et / Panele git'
        : 'Accept invite / Open panel'
      : tr
        ? 'Panele Git'
        : 'Open Panel';

    const year = new Date().getFullYear();
    const footerText = tr
      ? `© ${year} MyUNI. Tüm hakları saklıdır.`
      : `© ${year} MyUNI. All rights reserved.`;
    const supportLabel = tr ? 'Destek' : 'Support';
    const linkHint = tr
      ? 'Buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:'
      : "If the button doesn't work, paste this link into your browser:";

    const htmlContent = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#990000;padding:24px 32px;text-align:center;">
            <img src="https://www.myunilab.net/myuni-logo-dark.png" alt="MyUNI" width="120" style="display:inline-block;height:auto;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 16px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1a1a1a;">
              ${tr ? 'Site Başvuruları Paneli' : 'Site Applications Panel'}
            </h2>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333;">
              ${greeting}
            </p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#333;">
              ${body}
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="border-radius:8px;background:#990000;" align="center">
                  <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                    ${cta}
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:12px;color:#888;">
              ${linkHint}
            </p>
            <p style="margin:0 0 24px;font-size:12px;color:#990000;word-break:break-all;">
              ${dashboardUrl}
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;">
              ${supportLabel}: <a href="mailto:info@myunilab.net" style="color:#990000;text-decoration:none;">info@myunilab.net</a>
            </p>
            <p style="margin:0;font-size:11px;color:#aaa;">
              ${footerText}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
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
