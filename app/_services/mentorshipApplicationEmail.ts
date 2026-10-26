import nodemailer from 'nodemailer';
import { getMailSafeAppBaseUrl } from '@/app/lib/moduleAccess/helpers';

type MentorshipApplicationEmailParams = {
  applicationId: string;
  applicantEmail: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  school?: string | null;
  department?: string | null;
  locale: 'tr' | 'en';
  mentorshipTitle: string;
  mentorName?: string | null;
};

type DeliveryResult = {
  applicantSent: boolean;
  notificationSent: boolean;
  error?: string;
};

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getNotificationRecipients(): string[] {
  const configured =
    process.env.MENTORSHIP_NOTIFICATION_EMAILS ||
    process.env.NOTIFICATION_EMAILS ||
    process.env.EMAIL_USER ||
    '';

  return configured
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function buildApplicantMessage(params: MentorshipApplicationEmailParams) {
  const isTurkish = params.locale === 'tr';
  const title = escapeHtml(params.mentorshipTitle);
  const firstName = escapeHtml(params.firstName);
  const mentor = params.mentorName ? escapeHtml(params.mentorName) : '';
  const subject = isTurkish
    ? `${params.mentorshipTitle} — başvurunuz alındı`
    : `${params.mentorshipTitle} — application received`;
  const body = isTurkish
    ? 'Mentörlük başvurunuz başarıyla alındı. Başvurunuz incelendikten sonra sizinle iletişime geçeceğiz.'
    : 'Your mentorship application has been received. We will contact you after reviewing it.';

  return {
    subject: subject.replace(/[\r\n]+/g, ' '),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
        <div style="background:#990000;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">${isTurkish ? 'Başvurunuz Alındı' : 'Application Received'}</h1>
        </div>
        <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
          <p>${isTurkish ? 'Merhaba' : 'Hello'} ${firstName},</p>
          <p>${body}</p>
          <p><strong>${isTurkish ? 'Mentörlük' : 'Mentorship'}:</strong> ${title}</p>
          ${mentor ? `<p><strong>${isTurkish ? 'Mentör' : 'Mentor'}:</strong> ${mentor}</p>` : ''}
          <p style="margin-top:24px;font-size:13px;color:#666;">${isTurkish ? 'Bu e-posta MyUNI tarafından otomatik gönderilmiştir.' : 'This email was sent automatically by MyUNI.'}</p>
          <p style="font-size:12px;color:#666;">${isTurkish ? 'Destek' : 'Support'}: info@myunilab.net</p>
        </div>
      </div>
    `,
    text: `${isTurkish ? 'Merhaba' : 'Hello'} ${params.firstName},\n\n${body}\n\n${isTurkish ? 'Mentörlük' : 'Mentorship'}: ${params.mentorshipTitle}${params.mentorName ? `\n${isTurkish ? 'Mentör' : 'Mentor'}: ${params.mentorName}` : ''}\n\n${isTurkish ? 'Destek' : 'Support'}: info@myunilab.net`,
  };
}

function buildNotificationMessage(params: MentorshipApplicationEmailParams) {
  const applicantName = `${params.firstName} ${params.lastName}`.trim();
  const applicationUrl = `${getMailSafeAppBaseUrl()}/tr/mentorship/applications/${params.applicationId}`;
  const details = [
    ['Başvuran', applicantName],
    ['E-posta', params.applicantEmail],
    ['Telefon', params.phone],
    ['Okul', params.school],
    ['Bölüm', params.department],
    ['Mentörlük', params.mentorshipTitle],
    ['Mentör', params.mentorName],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]));

  return {
    subject: `Yeni mentörlük başvurusu — ${params.mentorshipTitle}`.replace(/[\r\n]+/g, ' '),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
        <h1 style="font-size:20px;">Yeni Mentörlük Başvurusu</h1>
        ${details
          .map(
            ([label, value]) =>
              `<p style="margin:8px 0;"><strong>${label}:</strong> ${escapeHtml(value)}</p>`
          )
          .join('')}
        <p style="margin:24px 0;">
          <a href="${applicationUrl}" style="background:#990000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Başvuruyu Görüntüle</a>
        </p>
        <p style="font-size:12px;color:#666;word-break:break-all;">${applicationUrl}</p>
      </div>
    `,
    text: `Yeni mentörlük başvurusu\n\n${details
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n')}\n\nBaşvuruyu görüntüle: ${applicationUrl}`,
  };
}

export async function sendMentorshipApplicationEmails(
  params: MentorshipApplicationEmailParams
): Promise<DeliveryResult> {
  const senderEmail = process.env.EMAIL_USER?.trim();
  const notificationRecipients = getNotificationRecipients();
  if (!senderEmail || notificationRecipients.length === 0) {
    return {
      applicantSent: false,
      notificationSent: false,
      error: 'Mentorship sender or notification recipient missing',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number.parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: senderEmail,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();

    const applicantMessage = buildApplicantMessage(params);
    const notificationMessage = buildNotificationMessage(params);
    const deliveries = await Promise.allSettled([
      transporter.sendMail({
        from: { name: 'MyUNI', address: senderEmail },
        to: params.applicantEmail,
        ...applicantMessage,
      }),
      transporter.sendMail({
        from: { name: 'MyUNI', address: senderEmail },
        to: notificationRecipients,
        replyTo: params.applicantEmail,
        ...notificationMessage,
      }),
    ]);

    transporter.close();

    return {
      applicantSent: deliveries[0].status === 'fulfilled',
      notificationSent: deliveries[1].status === 'fulfilled',
      ...(deliveries.some((delivery) => delivery.status === 'rejected')
        ? { error: 'One or more mentorship emails could not be sent' }
        : {}),
    };
  } catch (error) {
    return {
      applicantSent: false,
      notificationSent: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
