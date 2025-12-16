// app/_services/emailService.js
import nodemailer from 'nodemailer';

// Send course purchase confirmation email
const sendPurchaseConfirmationEmail = async (userInfo, courseInfo, orderInfo, locale = 'tr', courseType = 'online') => {
  try {
    console.log('Starting email send process...');
    console.log('Nodemailer loaded successfully');
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('Transporter created successfully');
    
    // Verify transporter
    await transporter.verify();
    console.log('Transporter verified successfully');
    
    const isTurkish = locale === 'tr';
    const isLive = courseType === 'live';
    const isCertificate = courseType === 'certificate';
    
    // Email subject based on type
    let subject;
    if (isCertificate) {
      subject = isTurkish 
        ? `Sertifikanız Hazır - ${courseInfo.title}`
        : `Your Certificate is Ready - ${courseInfo.title}`;
    } else {
      subject = isTurkish 
        ? `${courseInfo.title} - ${isLive ? 'Canlı Eğitim Onayı' : 'Kurs Satın Alma Onayı'}`
        : `${courseInfo.title} - ${isLive ? 'Live Training Confirmation' : 'Course Purchase Confirmation'}`;
    }
    
    const greeting = isTurkish 
      ? `Sayın ${userInfo.name}`
      : `Dear ${userInfo.name}`;
    
    // Main message based on type
    let thankYou, courseReady;
    if (isCertificate) {
      thankYou = isTurkish
        ? 'Tebrikler! Sertifikanız başarıyla oluşturuldu.'
        : 'Congratulations! Your certificate has been successfully generated.';
      courseReady = isTurkish
        ? 'Sertifikanızı görüntülemek için aşağıdaki bağlantıyı kullanabilirsiniz.'
        : 'You can use the link below to view your certificate.';
    } else {
      thankYou = isTurkish
        ? 'MyUNI\'yi tercih ettiğiniz için teşekkürler.'
        : 'Thank you for choosing MyUNI.';
      courseReady = isLive 
        ? (isTurkish 
            ? 'Canlı eğitiminiz için kaydınız tamamlandı.'
            : 'Your registration for the live training is complete.')
        : (isTurkish 
            ? 'Kursunuz hazır. Hemen başlayabilirsiniz.'
            : 'Your course is ready. You can start immediately.');
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    const courseUrl = isCertificate && orderInfo.certificateUrl 
      ? orderInfo.certificateUrl 
      : `${baseUrl}/${locale}/dashboard`;
    const dashboardUrl = `${baseUrl}/${locale}/dashboard`;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #000000;
      background-color: #ffffff;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
    }
    .header {
      padding: 30px;
      border-bottom: 2px solid #990000;
      text-align: left;
    }
    .logo {
      font-size: 24px;
      font-weight: 600;
      color: #000000;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #000000;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #000000;
      line-height: 1.5;
    }
    .highlight {
      color: #990000;
      font-weight: 500;
    }
    .course-title {
      font-size: 18px;
      font-weight: 500;
      color: #000000;
      margin: 20px 0;
      padding: 15px 0;
      border-top: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
    }
    .certificate-section {
      background-color: #f8f8f8;
      padding: 25px;
      margin: 25px 0;
      text-align: left;
      border-left: 4px solid #990000;
    }
    .certificate-title {
      font-size: 18px;
      font-weight: 600;
      color: #990000;
      margin-bottom: 10px;
    }
    .certificate-number {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #000000;
      background-color: #ffffff;
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      display: inline-block;
      margin: 10px 0;
    }
    .details-section {
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;
      padding: 5px 0;
    }
    .detail-label {
      font-weight: 500;
      color: #666666;
      width: 120px;
      flex-shrink: 0;
    }
    .detail-value {
      color: #000000;
    }
    .button-section {
      text-align: left;
      margin: 35px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #990000;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #660000;
    }
    .note {
      background-color: #f8f8f8;
      padding: 20px;
      margin: 25px 0;
      font-size: 14px;
      color: #666666;
      line-height: 1.5;
      border-left: 3px solid #e0e0e0;
    }
    .steps {
      margin: 25px 0;
    }
    .steps h3 {
      font-size: 16px;
      font-weight: 500;
      color: #000000;
      margin-bottom: 15px;
    }
    .steps ol {
      padding-left: 20px;
    }
    .steps li {
      margin-bottom: 8px;
      color: #666666;
      font-size: 14px;
      line-height: 1.4;
    }
    .contact {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: left;
    }
    .contact h3 {
      font-size: 14px;
      font-weight: 500;
      color: #000000;
      margin-bottom: 8px;
    }
    .contact a {
      color: #990000;
      text-decoration: none;
      font-size: 14px;
    }
    .footer {
      padding: 20px 30px;
      background-color: #f8f8f8;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #999999;
      margin-bottom: 5px;
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header, .content {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
        margin-bottom: 12px;
      }
      .detail-label {
        width: auto;
        margin-bottom: 2px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${orderInfo.organizationName || 'MyUNI'}</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        ${greeting},
      </div>
      
      <div class="message">
        <span class="highlight">${thankYou}</span><br>
        ${courseReady}
        ${orderInfo.customMessage ? `<br><br><div style="margin-top: 15px; padding: 15px; background-color: #f8f8f8; border-left: 4px solid #990000; font-style: italic;">${orderInfo.customMessage}</div>` : ''}
      </div>
      
      <div class="course-title">
        ${courseInfo.title}
      </div>
      
      ${isCertificate ? `
      <div class="certificate-section">
        <div class="certificate-title">Sertifika Hazır</div>
        <div style="font-size: 14px; color: #666666; margin-bottom: 10px;">
          ${isTurkish ? 'Sertifika Numarası' : 'Certificate Number'}
        </div>
        <div class="certificate-number">${orderInfo.orderId}</div>
      </div>
      ` : ''}
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Kurs' : 'Course'}:</div>
          <div class="detail-value">${courseInfo.title}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isCertificate ? (isTurkish ? 'Sertifika No' : 'Certificate No') : (isTurkish ? 'Sipariş No' : 'Order ID')}:</div>
          <div class="detail-value">${orderInfo.orderId}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Tarih' : 'Date'}:</div>
          <div class="detail-value">${new Date().toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US')}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'E-posta' : 'Email'}:</div>
          <div class="detail-value">${userInfo.email}</div>
        </div>
        ${!isCertificate ? `
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Tutar' : 'Amount'}:</div>
          <div class="detail-value">${orderInfo.isFree ? (isTurkish ? 'Ücretsiz' : 'Free') : `${orderInfo.amount} ${isTurkish ? '₺' : '$'}`}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="button-section">
        <a href="${courseUrl}" class="cta-button">
          ${isCertificate 
            ? (isTurkish ? 'Sertifikayı Görüntüle' : 'View Certificate')
            : (isTurkish ? 'Kurslarım' : 'My Courses')
          }
        </a>
      </div>
      
      ${isCertificate ? `
      <div class="steps">
        <h3>${isTurkish ? 'Sertifikanızla Neler Yapabilirsiniz?' : 'What Can You Do With Your Certificate?'}</h3>
        <ol>
          <li>${isTurkish ? 'LinkedIn profilinize ekleyebilirsiniz' : 'Add it to your LinkedIn profile'}</li>
          <li>${isTurkish ? 'CV\'nizde kullanabilirsiniz' : 'Use it in your resume'}</li>
          <li>${isTurkish ? 'İş başvurularında referans gösterebilirsiniz' : 'Use it as a reference in job applications'}</li>
        </ol>
      </div>
      ` : (!isLive ? `
      <div class="steps">
        <h3>${isTurkish ? 'Nasıl Başlarım?' : 'How to Start?'}</h3>
        <ol>
          <li>${isTurkish ? 'Hesabınıza giriş yapın' : 'Login to your account'}</li>
          <li>${isTurkish ? '"Kurslarım" bölümüne gidin' : 'Go to "My Courses"'}</li>
          <li>${isTurkish ? 'Öğrenmeye başlayın' : 'Start learning'}</li>
        </ol>
      </div>
      ` : '')}
      
      <div class="note">
        ${isCertificate 
          ? (isTurkish 
              ? 'Sertifikanız kalıcı olarak saklanacak ve istediğiniz zaman erişebilirsiniz.'
              : 'Your certificate will be permanently stored and you can access it anytime.')
          : (isTurkish 
              ? 'Herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz.'
              : 'If you have any questions, please contact us.')
        }
      </div>
      
      <div class="contact">
        <h3>${isTurkish ? 'Destek' : 'Support'}</h3>
        <p style="font-size: 14px; color: #666666; margin-bottom: 5px;">${isTurkish ? 'Herhangi bir sorunuz için' : 'For any questions'}</p>
        <a href="mailto:info@myunilab.net">info@myunilab.net</a>
        <p style="font-size: 12px; color: #999999; margin-top: 8px;">${isTurkish ? 'MyUNI Destek Ekibi' : 'MyUNI Support Team'}</p>
      </div>
    </div>
    
    <div class="footer">
      <p>${isTurkish ? 'Bu e-posta otomatik olarak gönderilmiştir.' : 'This email was sent automatically.'}</p>
      <p>© 2025 ${orderInfo.organizationName || 'MyUNI'}</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
${greeting},

${thankYou}
${courseReady}
${orderInfo.customMessage ? `\n\n${orderInfo.customMessage}\n` : ''}

--- ${isCertificate ? (isTurkish ? 'SERTİFİKA DETAYLARI' : 'CERTIFICATE DETAILS') : (isTurkish ? 'SİPARİŞ DETAYLARI' : 'ORDER DETAILS')} ---
${isTurkish ? 'Kurs' : 'Course'}: ${courseInfo.title}
${isCertificate ? (isTurkish ? 'Sertifika No' : 'Certificate No') : (isTurkish ? 'Sipariş No' : 'Order ID')}: ${orderInfo.orderId}
${isTurkish ? 'Tarih' : 'Date'}: ${new Date().toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US')}
${isTurkish ? 'E-posta' : 'Email'}: ${userInfo.email}
${!isCertificate ? `${isTurkish ? 'Tutar' : 'Amount'}: ${orderInfo.isFree ? (isTurkish ? 'Ücretsiz' : 'Free') : orderInfo.amount}` : ''}

${isCertificate 
  ? `${isTurkish ? 'Sertifikanızı görüntülemek için' : 'View your certificate'}: ${courseUrl}`
  : `${isTurkish ? 'Kursunuza erişmek için' : 'Access your course'}: ${courseUrl}`
}
${isTurkish ? 'Kurslarım sayfası' : 'My Courses page'}: ${dashboardUrl}

${isTurkish ? 'Destek' : 'Support'}: info@myunilab.net
${isTurkish ? 'MyUNI Destek Ekibi' : 'MyUNI Support Team'}

${isCertificate 
  ? (isTurkish ? 'Tebrikler ve başarılar dileriz!' : 'Congratulations and best wishes!')
  : (isTurkish ? 'İyi öğrenmeler dileriz!' : 'Happy learning!')
}
${isCertificate ? (orderInfo.organizationName || (isTurkish ? 'Kurum' : 'Organization')) : (isTurkish ? 'MyUNI Ekibi' : 'MyUNI Team')}
`;

    const mailOptions = {
      from: {
        name: isCertificate ? (orderInfo.organizationName || 'MyUNI') : 'MyUNI',
        address: process.env.EMAIL_USER
      },
      to: userInfo.email,
      subject: subject,
      html: htmlContent,
      text: textContent,
      bcc: process.env.NOTIFICATION_EMAILS ? process.env.NOTIFICATION_EMAILS.split(',') : []
    };
    
    console.log('Sending email to:', userInfo.email);
    console.log('Email subject:', subject);
    console.log('Email type:', isCertificate ? 'certificate' : (isLive ? 'live course' : 'online course'));
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('Email send error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return {
      success: false,
      error: error.message
    };
  }
};

// Send certificate completion email - specialized function
const sendCertificateCompletionEmail = async (userInfo, courseInfo, certificateNumber, certificateUrl, locale = 'tr', customMessage = '', organizationName = '') => {
  console.log('sendCertificateCompletionEmail - organizationName:', organizationName);
  const orderInfo = {
    orderId: certificateNumber,
    amount: 'Sertifika',
    isFree: true,
    certificateUrl: certificateUrl,
    isCertificateEmail: true,
    customMessage: customMessage,
    organizationName: organizationName
  };
  console.log('sendCertificateCompletionEmail - orderInfo.organizationName:', orderInfo.organizationName);

  return await sendPurchaseConfirmationEmail(userInfo, courseInfo, orderInfo, locale, 'certificate');
};

// Test email functionality
const sendTestEmail = async (to, locale = 'tr') => {
  const testUserInfo = {
    name: 'Test User',
    email: to
  };
  
  const testCourseInfo = {
    title: 'Test Course - Email Functionality',
    description: 'This is a test course for email functionality verification',
    slug: 'test-course'
  };
  
  const testOrderInfo = {
    orderId: 'TEST_' + Date.now(),
    amount: '99.00',
    isFree: false
  };
  
  return await sendPurchaseConfirmationEmail(testUserInfo, testCourseInfo, testOrderInfo, locale, 'online');
};

export {
  sendPurchaseConfirmationEmail,
  sendCertificateCompletionEmail,
  sendTestEmail
};