import nodemailer from 'nodemailer';

/**
 * Başvuru onay / etkinlik kayıt bilgilendirme e-postası.
 * - isEvent=true  → etkinlik kaydı maili (ekip başvurularından ayrı)
 * - isEvent=false → UNILAB ekip başvurusu onay maili
 *
 * @param {object} params
 * @param {string} params.to
 * @param {string} [params.firstName]
 * @param {string} [params.lastName]
 * @param {string} [params.locale]
 * @param {string | null} [params.eventName]
 * @param {boolean} [params.isEvent]
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendSiteApplicationApprovalEmail({
  to,
  firstName,
  lastName,
  locale = 'tr',
  eventName = null,
  isEvent = false,
}) {
  try {
    if (!to?.trim()) {
      return { success: false, error: 'Recipient email missing' };
    }

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
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || (tr ? 'Başvuran' : 'Applicant');
    const greeting = tr ? `Merhaba ${firstName || name},` : `Hello ${firstName || name},`;

    const eventLabel = (eventName || '').trim();

    // Etkinlik kayıtları — ekip başvurusundan ayrı metin
    const subject = isEvent
      ? tr
        ? eventLabel
          ? `${eventLabel} etkinliğe kaydınız başarıyla alınmıştır`
          : 'Etkinliğe kaydınız başarıyla alınmıştır'
        : eventLabel
          ? `Your registration for ${eventLabel} has been successfully received`
          : 'Your event registration has been successfully received'
      : tr
        ? 'UNILAB ekip başvurunuz onaylandı'
        : 'Your UNILAB team application was approved';

    const body = isEvent
      ? tr
        ? eventLabel
          ? `${eventLabel} etkinliğe kaydınız başarıyla alınmıştır.`
          : 'Etkinliğe kaydınız başarıyla alınmıştır.'
        : eventLabel
          ? `Your registration for ${eventLabel} has been successfully received.`
          : 'Your event registration has been successfully received.'
      : tr
        ? 'UNILAB ekibine yaptığınız başvuru onaylandı. En kısa sürede sizinle iletişime geçeceğiz.'
        : 'Your application to join the UNILAB team has been approved. We will contact you soon.';

    const headerTitle = isEvent
      ? tr
        ? 'Kaydınız Alındı'
        : 'Registration Received'
      : tr
        ? 'Başvurunuz Onaylandı'
        : 'Application Approved';

    const footer = tr
      ? 'Bu e-posta MyUNI başvuru sistemi tarafından otomatik gönderilmiştir.'
      : 'This email was sent automatically by the MyUNI application system.';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <div style="background:#990000;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">${headerTitle}</h1>
        </div>
        <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
          <p>${greeting}</p>
          <p>${body}</p>
          ${
            isEvent && eventLabel
              ? `<p style="margin-top:16px;"><strong>${tr ? 'Etkinlik' : 'Event'}:</strong> ${eventLabel}</p>`
              : !isEvent && eventLabel
                ? `<p style="margin-top:16px;"><strong>${tr ? 'Etkinlik' : 'Event'}:</strong> ${eventLabel}</p>`
                : ''
          }
          <p style="margin-top:24px;font-size:13px;color:#666;">${footer}</p>
          <p style="font-size:12px;color:#666;">${tr ? 'Destek' : 'Support'}: info@myunilab.net</p>
        </div>
      </div>
    `;

    const textContent = `${greeting}\n\n${body}\n\n${
      eventLabel ? `${tr ? 'Etkinlik' : 'Event'}: ${eventLabel}\n\n` : ''
    }${footer}\n\nSupport: info@myunilab.net`;

    const result = await transporter.sendMail({
      from: { name: 'MyUNI', address: process.env.EMAIL_USER },
      to: to.trim(),
      subject,
      html: htmlContent,
      text: textContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Site application approval email error:', error);
    return { success: false, error: error.message };
  }
}
