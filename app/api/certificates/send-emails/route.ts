import { NextRequest, NextResponse } from 'next/server';
import { sendCertificateCompletionEmail } from '@/app/_services/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificates, customMessage, locale = 'tr' } = body;

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sertifika bilgileri gerekli' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Her sertifika için mail gönder
    for (const cert of certificates) {
      try {
        if (!cert.email) {
          errors.push({
            name: cert.fullname || cert.name || 'Bilinmeyen',
            error: 'E-posta adresi bulunamadı'
          });
          continue;
        }

        const userInfo = {
          name: cert.fullname || cert.name || 'Değerli Kullanıcı',
          email: cert.email
        };

        const courseInfo = {
          title: cert.coursename || 'Sertifika',
          description: cert.description || ''
        };

        const certificateUrl =
          cert.certificateurl ||
          (cert.organization_slug
            ? `https://certificates.myunilab.net/${cert.organization_slug}/${cert.certificatenumber}`
            : `https://certificates.myunilab.net/${cert.certificatenumber}`);

        const organizationName = cert.organization || 'Kurum';
        console.log('Sending email - Organization name:', organizationName, 'Certificate:', cert);

        // Özel mesaj varsa email içeriğine ekle
        const result = await sendCertificateCompletionEmail(
          userInfo,
          courseInfo,
          cert.certificatenumber || '',
          certificateUrl,
          locale,
          customMessage || '',
          organizationName
        );

        if (result.success) {
          results.push({
            name: userInfo.name,
            email: userInfo.email,
            success: true
          });
        } else {
          errors.push({
            name: userInfo.name,
            email: userInfo.email,
            error: result.error || 'Mail gönderilemedi'
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        errors.push({
          name: cert.fullname || cert.name || 'Bilinmeyen',
          email: cert.email,
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: unknown) {
    console.error('Send emails error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Mail gönderme hatası';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

