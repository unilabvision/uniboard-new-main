import nodemailer from 'nodemailer';

/**
 * Başvuru onaylandığında başvurana bilgilendirme e-postası gönderir.
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

    const subject = isEvent
      ? tr
        ? eventName
          ? `${eventName} başvurunuz onaylandı`
          : 'Etkinlik başvurunuz onaylandı'
        : eventName
          ? `Your application for ${eventName} was approved`
          : 'Your event application was approved'
      : tr
        ? 'UNILAB ekip başvurunuz onaylandı'
        : 'Your UNILAB team application was approved';

    const body = isEvent
      ? tr
        ? eventName
          ? `${eventName} etkinliğine yaptığınız başvuru onaylandı. En kısa sürede sizinle iletişime geçeceğiz.`
          : 'Etkinlik başvurunuz onaylandı. En kısa sürede sizinle iletişime geçeceğiz.'
        : eventName
          ? `Your application for ${eventName} has been approved. We will contact you soon.`
          : 'Your event application has been approved. We will contact you soon.'
      : tr
        ? 'UNILAB ekibine yaptığınız başvuru onaylandı. En kısa sürede sizinle iletişime geçeceğiz.'
        : 'Your application to join the UNILAB team has been approved. We will contact you soon.';

    const footer = tr
      ? 'Bu e-posta MyUNI başvuru sistemi tarafından otomatik gönderilmiştir.'
      : 'This email was sent automatically by the MyUNI application system.';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <div style="background:#990000;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">${tr ? 'Başvurunuz Onaylandı' : 'Application Approved'}</h1>
        </div>
        <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
          <p>${greeting}</p>
          <p>${body}</p>
          ${eventName ? `<p style="margin-top:16px;"><strong>${tr ? 'Etkinlik' : 'Event'}:</strong> ${eventName}</p>` : ''}
          <p style="margin-top:24px;font-size:13px;color:#666;">${footer}</p>
          <p style="font-size:12px;color:#666;">${tr ? 'Destek' : 'Support'}: info@myunilab.net</p>
        </div>
      </div>
    `;

    const textContent = `${greeting}\n\n${body}\n\n${eventName ? `${tr ? 'Etkinlik' : 'Event'}: ${eventName}\n\n` : ''}${footer}\n\nSupport: info@myunilab.net`;

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
