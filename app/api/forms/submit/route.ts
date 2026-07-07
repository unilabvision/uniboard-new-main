import { NextRequest, NextResponse } from 'next/server';

/** @deprecated Use POST /api/site-applications/submit */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const url = new URL('/api/site-applications/submit', request.url);

  const legacyType = body.applicationType as string | undefined;
  const locale = body.locale === 'en' ? 'en' : 'tr';
  const formSlug =
    legacyType === 'team'
      ? locale === 'en'
        ? 'team-application'
        : 'ekip-basvuru'
      : legacyType === 'event'
        ? locale === 'en'
          ? 'event-application'
          : 'etkinlik-basvuru'
        : body.formSlug;

  const fields: Record<string, unknown> = body.fields || {
    first_name: body.firstName,
    last_name: body.lastName,
    email: body.email,
    phone: body.phone,
    event_name: body.eventName,
    event_date: body.eventDate,
    participant_count: body.participantCount,
    organization: body.organization,
    role_interest: body.roleInterest,
    experience: body.experience,
    portfolio_url: body.portfolioUrl,
    motivation: body.motivation,
    message: body.message,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formSlug,
      locale,
      fields,
      honeypot: body.honeypot,
      hCaptchaToken: body.hCaptchaToken,
      attachmentStoragePath: body.attachmentStoragePath,
      attachmentFileName: body.attachmentFileName,
      attachmentMimeType: body.attachmentMimeType,
      attachmentFileSize: body.attachmentFileSize,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
