import nodemailer from 'nodemailer';

/**
 * Admin-initiated course enrollment notification.
 *
 * @param {object} params
 * @param {string} params.to
 * @param {string} [params.name]
 * @param {string} params.courseTitle
 * @param {string} params.courseUrl
 * @param {string} [params.locale]
 * @param {boolean} [params.invited]
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendCourseEnrollmentEmail({
  to,
  name = '',
  courseTitle,
  courseUrl,
  locale = 'tr',
  invited = false,
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

    const tr = locale !== 'en';
    const displayName = (name || '').trim() || (tr ? 'Katılımcı' : 'Participant');
    const subject = invited
      ? tr
        ? `${courseTitle} — kurs davetiniz`
        : `${courseTitle} — your course invitation`
      : tr
        ? `${courseTitle} — kurs kaydınız açıldı`
        : `${courseTitle} — you have been enrolled`;

    const greeting = tr ? `Merhaba ${displayName},` : `Hello ${displayName},`;
    const body = invited
      ? tr
        ? `"${courseTitle}" kursuna davet edildiniz. Aşağıdaki butona tıklayın: hesabınız yoksa önce oluşturun, ardından aynı bağlantı kursu hesabınıza tanımlar. Hesabı oluşturduktan sonra kurs görünmezse bu e-postadaki bağlantıyı tekrar açın.`
        : `You have been invited to "${courseTitle}". Click the button below: create your account if needed, then the same link assigns the course. If the course does not appear after sign-up, open this email link again.`
      : tr
        ? `"${courseTitle}" kursuna kaydınız oluşturuldu. Kursa erişmek için aşağıdaki butonu kullanabilirsiniz.`
        : `You have been enrolled in "${courseTitle}". Use the button below to access the course.`;
    const cta = invited
      ? tr
        ? 'Daveti Aç ve Eğitime Katıl'
        : 'Open Invite and Join'
      : tr
        ? 'Kursa Git'
        : 'Open Course';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <p>${greeting}</p>
        <p>${body}</p>
        <p style="margin: 24px 0;">
          <a href="${courseUrl}" style="background:#990000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
            ${cta}
          </a>
        </p>
        <p style="font-size:12px;color:#666;word-break:break-all;">${courseUrl}</p>
        <p style="font-size:12px;color:#666;">${tr ? 'Destek' : 'Support'}: info@myunilab.net</p>
      </div>
    `;

    const result = await transporter.sendMail({
      from: { name: 'MyUNI', address: process.env.EMAIL_USER },
      to,
      subject,
      html: htmlContent,
      text: `${greeting}\n\n${body}\n\n${courseUrl}`,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Course enrollment email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
