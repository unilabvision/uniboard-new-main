import nodemailer from 'nodemailer';

/**
 * Etkinlik hatırlatma e-postası (kayıtlı katılımcılara).
 * @param {object} params
 * @param {string} params.to
 * @param {string} [params.firstName]
 * @param {string} [params.lastName]
 * @param {string} [params.locale]
 * @param {string} params.eventName
 * @param {string} [params.eventDateLabel]
 * @param {string} [params.eventUrl]
 * @param {boolean|null} [params.isOnline]
 * @param {string} [params.locationLabel]
 * @param {string} [params.meetingUrl]
 */
export async function sendEventReminderEmail({
  to,
  firstName,
  lastName,
  locale = 'tr',
  eventName,
  eventDateLabel = null,
  eventUrl = null,
  isOnline = null,
  locationLabel = null,
  meetingUrl = null,
}) {
  try {
    if (!to?.trim()) {
      return { success: false, error: 'Recipient email missing' };
    }
    if (!eventName?.trim()) {
      return { success: false, error: 'Event name missing' };
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
    const title = String(eventName).trim();

    const subject = tr
      ? `${title} — Etkinlik hatırlatması`
      : `${title} — Event reminder`;

    const headerTitle = tr ? 'Etkinlik Hatırlatması' : 'Event Reminder';

    const body = tr
      ? `<strong>${title}</strong> etkinliğine kaydınız bulunmaktadır. Etkinliği kaçırmamanız için bu hatırlatmayı gönderiyoruz.`
      : `You are registered for <strong>${title}</strong>. This is a reminder so you don’t miss the event.`;

    const details = [];
    if (eventDateLabel) {
      details.push(
        `<p style="margin:8px 0;"><strong>${tr ? 'Tarih' : 'Date'}:</strong> ${eventDateLabel}</p>`
      );
    }
    if (isOnline === true) {
      details.push(
        `<p style="margin:8px 0;"><strong>${tr ? 'Format' : 'Format'}:</strong> ${
          tr ? 'Online' : 'Online'
        }</p>`
      );
    } else if (isOnline === false && locationLabel) {
      details.push(
        `<p style="margin:8px 0;"><strong>${tr ? 'Konum' : 'Location'}:</strong> ${locationLabel}</p>`
      );
    } else if (locationLabel) {
      details.push(
        `<p style="margin:8px 0;"><strong>${tr ? 'Konum' : 'Location'}:</strong> ${locationLabel}</p>`
      );
    }

    const safeMeetingUrl =
      typeof meetingUrl === 'string' && /^https?:\/\//i.test(meetingUrl.trim())
        ? meetingUrl.trim()
        : null;

    if (safeMeetingUrl) {
      details.push(
        `<p style="margin:8px 0;"><strong>${tr ? 'Toplantı linki' : 'Meeting link'}:</strong> <a href="${safeMeetingUrl}" style="color:#990000;word-break:break-all;">${safeMeetingUrl}</a></p>`
      );
    }

    const cta = eventUrl
      ? tr
        ? 'Etkinlik sayfasına git'
        : 'Open event page'
      : null;

    const meetingCta = safeMeetingUrl
      ? tr
        ? 'Toplantıya katıl'
        : 'Join meeting'
      : null;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <div style="background:#990000;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">${headerTitle}</h1>
        </div>
        <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
          <p>${greeting}</p>
          <p>${body}</p>
          ${details.join('')}
          ${
            meetingCta && safeMeetingUrl
              ? `<p style="margin:28px 0 12px;">
                  <a href="${safeMeetingUrl}" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
                    ${meetingCta}
                  </a>
                </p>`
              : ''
          }
          ${
            cta && eventUrl
              ? `<p style="margin:${safeMeetingUrl ? '12px' : '28px'} 0;">
                  <a href="${eventUrl}" style="background:#990000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
                    ${cta}
                  </a>
                </p>
                <p style="font-size:12px;color:#666;word-break:break-all;">${eventUrl}</p>`
              : ''
          }
          <p style="margin-top:24px;font-size:13px;color:#666;">
            ${
              tr
                ? 'Bu e-posta MyUNI etkinlik sistemi tarafından gönderilmiştir.'
                : 'This email was sent by the MyUNI events system.'
            }
          </p>
          <p style="font-size:12px;color:#666;">${tr ? 'Destek' : 'Support'}: info@myunilab.net</p>
        </div>
      </div>
    `;

    const textContent = `${greeting}\n\n${title}\n${
      eventDateLabel ? `${tr ? 'Tarih' : 'Date'}: ${eventDateLabel}\n` : ''
    }${
      safeMeetingUrl
        ? `${tr ? 'Toplantı' : 'Meeting'}: ${safeMeetingUrl}\n`
        : ''
    }${eventUrl ? `${eventUrl}\n` : ''}\nSupport: info@myunilab.net`;

    const result = await transporter.sendMail({
      from: { name: 'MyUNI', address: process.env.EMAIL_USER },
      to: to.trim(),
      subject,
      html: htmlContent,
      text: textContent,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Event reminder email error:', error);
    return { success: false, error: error.message };
  }
}
