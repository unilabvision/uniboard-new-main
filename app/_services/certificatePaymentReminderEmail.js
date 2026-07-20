import nodemailer from 'nodemailer';

/**
 * Sertifika ödemesi hatırlatma / mükerrer bilgilendirme maili.
 * pending → checkout linki
 * superseded → tekrar ödeme yok, kayıt tamam mesajı
 * @param {object} params
 * @param {string} params.to
 * @param {string} [params.firstName]
 * @param {string} [params.lastName]
 * @param {string} [params.locale]
 * @param {string} [params.eventName]
 * @param {string} [params.checkoutUrl]
 * @param {'pending'|'superseded'} [params.kind]
 */
export async function sendCertificatePaymentReminderEmail({
  to,
  firstName,
  lastName,
  locale = 'tr',
  eventName = null,
  checkoutUrl = null,
  kind = 'pending',
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
    const name =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      (tr ? 'Katılımcı' : 'Participant');
    const greeting = tr ? `Merhaba ${firstName || name},` : `Hello ${firstName || name},`;
    const eventLabel = (eventName || '').trim();
    const isSuperseded = kind === 'superseded';

    const subject = isSuperseded
      ? tr
        ? eventLabel
          ? `${eventLabel} — Kaydınız alındı (mükerrer başvuru)`
          : 'Kaydınız alındı (mükerrer başvuru)'
        : eventLabel
          ? `${eventLabel} — Registration noted (duplicate application)`
          : 'Registration noted (duplicate application)'
      : tr
        ? eventLabel
          ? `${eventLabel} — Kaydınız alındı, ödemeniz tamamlanmadı`
          : 'Kaydınız alındı, ödemeniz tamamlanmadı'
        : eventLabel
          ? `${eventLabel} — Registration received, payment incomplete`
          : 'Registration received, payment incomplete';

    const headerTitle = isSuperseded
      ? tr
        ? 'Kaydınız Mevcut'
        : 'You Are Already Registered'
      : tr
        ? 'Ödeme Bekleniyor'
        : 'Payment Pending';

    const body = isSuperseded
      ? tr
        ? `Sistemde aynı e-posta ile bu etkinlik için sertifika ödemesi daha önce tamamlanmış bir kaydınız var. Bu başvuru mükerrer olarak işaretlendi; tekrar ödeme yapmanıza gerek yoktur.${
            eventLabel ? ` Etkinlik: ${eventLabel}.` : ''
          }`
        : `We already have a completed certificate payment for this email and event. This application was marked as a duplicate; you do not need to pay again.${
            eventLabel ? ` Event: ${eventLabel}.` : ''
          }`
      : tr
        ? `Kaydınız alınmıştır ancak sertifika ödemesi tamamlanmamıştır veya ödeme ekranından çıkılmıştır.${
            eventLabel ? ` Etkinlik: ${eventLabel}.` : ''
          } Sertifika paketini aktifleştirmek için aşağıdaki butonla güvenli ödeme sayfasına gidebilirsiniz. Ödeme zaten alındıysa bu bağlantı sizi tekrar ücretlendirmeden bilgilendirir.`
        : `Your registration was received, but the certificate payment was not completed (or you left the payment screen).${
            eventLabel ? ` Event: ${eventLabel}.` : ''
          } Use the button below to open the secure payment page. If payment was already received, the link will not charge you again.`;

    const cta =
      !isSuperseded && checkoutUrl
        ? tr
          ? 'Ödemeyi tamamla'
          : 'Complete payment'
        : null;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <div style="background:#990000;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">${headerTitle}</h1>
        </div>
        <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
          <p>${greeting}</p>
          <p>${body}</p>
          ${
            cta && checkoutUrl
              ? `<p style="margin:28px 0;">
                  <a href="${checkoutUrl}" style="background:#990000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
                    ${cta}
                  </a>
                </p>
                <p style="font-size:12px;color:#666;word-break:break-all;">${checkoutUrl}</p>`
              : ''
          }
          <p style="margin-top:24px;font-size:13px;color:#666;">
            ${
              tr
                ? 'Bu e-posta MyUNI etkinlik kayıt sistemi tarafından gönderilmiştir.'
                : 'This email was sent by the MyUNI event registration system.'
            }
          </p>
          <p style="font-size:12px;color:#666;">${tr ? 'Destek' : 'Support'}: info@myunilab.net</p>
        </div>
      </div>
    `;

    const textContent = `${greeting}\n\n${body}\n\n${
      checkoutUrl && !isSuperseded ? `${checkoutUrl}\n\n` : ''
    }Support: info@myunilab.net`;

    const result = await transporter.sendMail({
      from: { name: 'MyUNI', address: process.env.EMAIL_USER },
      to: to.trim(),
      subject,
      html: htmlContent,
      text: textContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Certificate payment reminder email error:', error);
    return { success: false, error: error.message };
  }
}
