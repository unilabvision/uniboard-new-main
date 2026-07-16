// middleware.ts (root dizinde)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/tr',
  '/en',
  '/tr/hakkimizda(.*)',
  '/tr/certificates(.*)',
  '/en/certificates(.*)',
  '/tr/internship(.*)',
  '/en/internship(.*)',
  '/tr/site-applications(.*)',
  '/en/site-applications(.*)',
  '/tr/events(.*)',
  '/en/events(.*)',
  '/tr/lms(.*)',
  '/en/lms(.*)',
  '/tr/lms-2(.*)',
  '/en/lms-2(.*)',
  '/tr/students(.*)',
  '/en/students(.*)',
  '/tr/analytics(.*)',
  '/en/analytics(.*)',
  '/tr/reports(.*)',
  '/en/reports(.*)',
  '/tr/settings(.*)',
  '/en/settings(.*)',
  '/tr/help(.*)',
  '/en/help(.*)',
  '/en/about(.*)',
  '/tr/kariyer(.*)',
  '/en/career(.*)',
  '/en/careers(.*)',
  '/tr/login(.*)', // Auth routes
  '/en/login(.*)', // Auth routes
  '/tr/sign-up(.*)', // Auth routes
  '/en/sign-in(.*)', // Auth routes
  '/en/sign-up(.*)', // Auth routes
  '/tr/sign-in(.*)', // Auth routes
  '/tr/forgot-password', // Forgot password
  '/en/forgot-password', // Forgot password
  '/tr/verify-email', // Email verification
  '/en/verify-email', // Email verification
  '/tr/sso-callback', // OAuth callback
  '/en/sso-callback', // OAuth callback
  '/tr/complete-profile', // Profile completion
  '/en/complete-profile', // Profile completion
  '/tr/auth(.*)',
  '/en/auth(.*)',
  '/en/career(.*)',
  '/tr/iletisim(.*)',
  '/tr/kurs(.*)', // TR için course route'ları - course detail pages
  '/en/course(.*)', // EN için course route'ları - course detail pages
  '/en/contact(.*)',
  '/tr/blog(.*)',
  '/en/blog(.*)',
  '/tr/gizlilik(.*)',
  '/en/privacy(.*)',
  '/tr/projelerimiz(.*)',
  '/en/projects(.*)',
  '/tr/bultenimiz(.*)',
  '/en/newsletter(.*)',
  '/tr/sartlar-ve-kosullar(.*)',
  '/en/terms(.*)',
  '/tr/search(.*)',
  '/en/search(.*)',
  '/tr/soon(.*)',
  '/en/soon(.*)',
  '/tr/temsilcilik(.*)',
  '/en/temsilcilik(.*)',
  // Payment success pages (public to handle redirects)
  '/tr/payment-success(.*)',
  '/en/payment-success(.*)',
  '/tr/payment-failed(.*)', 
  '/en/payment-failed(.*)',
  '/tr/egitmen-ol(.*)',
  '/en/egitmen-ol(.*)',
  '/tr/basvuru(.*)',
  '/en/application(.*)',
  '/tr/etkinlik-basvuru(.*)',
  '/en/event-application(.*)',
  '/tr/ekip-basvuru(.*)',
  '/en/team-application(.*)',
  '/tr/etkinlik/(.*)/basvuru(.*)',
  '/en/event/(.*)/basvuru(.*)',
  // API routes
  '/api/public(.*)',
  '/api/sitemap.xml',
  '/api/shopier-payment', // Shopier payment endpoint
  '/api/shopier-callback', // Shopier callback (webhook)
  '/api/shopier-return', // Shopier return (user redirect)
  '/api/comments',
  '/api/forms/submit',
  '/api/site-applications/submit',
  '/api/site-applications/public(.*)',
  '/api/public/events(.*)',
  '/api/events(.*)',
  '/api/site-applications/files/upload-url',
  '/api/site-applications/payments/confirm',
  '/api/site-applications/cleanup',
  '/api/certificates/issuance/sync',
  '/api/contact',
  '/api/newsletter',
  '/api/content',
  '/api/search',
  // Static files
  '/sitemap.xml',
  '/tr/sitemap.xml',
  '/en/sitemap.xml',
  '/tr/404',
  '/en/404',
  '/robots.txt',
]);

// Auth routes - these are for sign-in/sign-up and related authentication flows
const isAuthRoute = createRouteMatcher([
  '/tr/sign-in(.*)',
  '/tr/sign-up(.*)',
  '/en/sign-in(.*)',
  '/en/sign-up(.*)',
  '/tr/login(.*)',
  '/en/login(.*)',
  '/tr/forgot-password',
  '/en/forgot-password',
  '/tr/verify-email',
  '/en/verify-email',
  '/tr/sso-callback',
  '/en/sso-callback',
  '/tr/complete-profile',
  '/en/complete-profile',
]);

// Protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/tr/watch/(.*)', // Course watching pages require auth
  '/en/watch/(.*)', // Course watching pages require auth
  '/tr/dashboard(.*)', // Dashboard requires auth
  '/en/dashboard(.*)', // Dashboard requires auth
  '/tr/profile(.*)', // User profile pages
  '/en/profile(.*)', // User profile pages
  '/tr/member(.*)', // Member pages
  '/en/member(.*)', // Member pages
  '/tr/checkout(.*)', // Checkout requires auth
  '/en/checkout(.*)', // Checkout requires auth
  '/tr/influencer(.*)', // Influencer panel requires auth
  '/en/influencer(.*)',
]);

// Payment-related routes that need special handling
const isPaymentRoute = createRouteMatcher([
  '/tr/checkout(.*)',
  '/en/checkout(.*)',
  '/tr/payment-success(.*)',
  '/en/payment-success(.*)',
  '/tr/payment-failed(.*)',
  '/en/payment-failed(.*)',
  '/api/shopier-payment',
  '/api/shopier-callback',
  '/api/shopier-return',
]);

// Valid routes
const isValidRoute = createRouteMatcher([
  '/',
  '/tr',
  '/en',
  '/tr/hakkimizda(.*)',
  '/tr/influencer(.*)',
  '/en/influencer(.*)',
  '/tr/settings(.*)',
  '/en/settings(.*)',
  '/tr/certificates(.*)',
  '/en/certificates(.*)',
  '/tr/internship(.*)',
  '/en/internship(.*)',
  '/tr/site-applications(.*)',
  '/en/site-applications(.*)',
  '/tr/events(.*)',
  '/en/events(.*)',
  '/tr/lms(.*)',
  '/en/lms(.*)',
  '/tr/lms-2(.*)',
  '/en/lms-2(.*)',
  '/tr/students(.*)',
  '/en/students(.*)',
  '/tr/analytics(.*)',
  '/en/analytics(.*)',
  '/tr/reports(.*)',
  '/en/reports(.*)',
  '/tr/help(.*)',
  '/en/help(.*)',
  '/en/about(.*)',
  '/tr/kurs(.*)',
  '/tr/sign-in(.*)',
  '/tr/sign-up(.*)',
  '/en/sign-in(.*)',
  '/en/sign-up(.*)',
  '/tr/login(.*)', // Auth routes
  '/en/login(.*)', // Auth routes
  '/tr/forgot-password',
  '/en/forgot-password',
  '/tr/verify-email',
  '/en/verify-email',
  '/tr/auth(.*)',
  '/en/auth(.*)',
  '/tr/sso-callback',
  '/en/sso-callback',
  '/tr/complete-profile',
  '/en/complete-profile',
  '/en/course(.*)', 
  '/tr/watch(.*)', // Course watching pages
  '/en/watch(.*)', // Course watching pages
  '/tr/kariyer(.*)',
  '/en/career(.*)',
  '/en/careers(.*)',
  '/en/career(.*)',
  '/tr/iletisim(.*)',
  '/en/contact(.*)',
  '/tr/blog(.*)',
  '/en/blog(.*)',
  '/tr/soon(.*)',
  '/en/soon(.*)',
  '/tr/projelerimiz(.*)',
  '/en/projects(.*)',
  '/tr/egitmen-ol(.*)',
  '/en/egitmen-ol(.*)',
  '/tr/basvuru(.*)',
  '/en/application(.*)',
  '/tr/etkinlik-basvuru(.*)',
  '/en/event-application(.*)',
  '/tr/ekip-basvuru(.*)',
  '/en/team-application(.*)',
  '/tr/etkinlik/(.*)/basvuru(.*)',
  '/en/event/(.*)/basvuru(.*)',
  '/tr/search(.*)',
  '/en/search(.*)',
  '/tr/gizlilik(.*)',
  '/en/privacy(.*)',
  '/tr/bultenimiz(.*)',
  '/en/newsletter(.*)',
  '/tr/sartlar-ve-kosullar(.*)',
  '/en/terms(.*)',
  '/tr/dashboard(.*)',
  '/en/dashboard(.*)',
  '/tr/profile(.*)',
  '/en/profile(.*)',
  '/tr/member(.*)',
  '/en/member(.*)',
  '/tr/temsilcilik(.*)',
  '/en/temsilcilik(.*)',
  '/en/representative/application',
  '/tr/representative/application',
  // Payment routes
  '/tr/checkout(.*)',
  '/en/checkout(.*)',
  '/tr/payment-success(.*)',
  '/en/payment-success(.*)',
  '/tr/payment-failed(.*)',
  '/en/payment-failed(.*)',
  // Static and API routes
  '/sitemap.xml',
  '/tr/sitemap.xml',
  '/en/sitemap.xml',
  '/api/sitemap.xml',
  '/api(.*)',
  '/404',
  '/tr/404',
  '/en/404',
  '/robots.txt',
]);

// Routes that should be accessible to authenticated users only but are part of auth flow
const isAuthFlowRoute = createRouteMatcher([
  '/tr/verify-email',
  '/en/verify-email',
  '/tr/complete-profile',
  '/en/complete-profile',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { userId } = await auth();

  // Handle large file uploads for Vimeo API
  if (pathname === '/api/vimeo/upload') {
    // Set headers for large file uploads
    const response = NextResponse.next();
    response.headers.set('x-body-size-limit', '1073741824'); // 1GB
    return response;
  }

  // Influencer APIs require a signed-in session (handlers also check module access)
  if (pathname.startsWith('/api/influencer')) {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Course-preview route'larını özel olarak handle et (next.config.js'te rewrite var)
  if (pathname.startsWith('/course-preview/')) {
    console.log('🔄 Course preview route detected, allowing through for rewrite');
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware Debug:', {
      pathname,
      userId: !!userId,
      isValidRoute: isValidRoute(req),
      isAuthRoute: isAuthRoute(req),
      isPublicRoute: isPublicRoute(req),
      isProtectedRoute: isProtectedRoute(req),
      isPaymentRoute: isPaymentRoute(req),
      isAuthFlowRoute: isAuthFlowRoute(req),
    });
  }

  // Handle robots.txt - allow indexing in production
  if (pathname === '/robots.txt') {
    const robotsTxt = process.env.NODE_ENV === 'production' 
      ? `User-agent: *\nAllow: /\nSitemap: ${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
      : `User-agent: *\nDisallow: /`;
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Check for valid route first
  if (!isValidRoute(req)) {
    console.log('❌ Invalid route detected:', pathname);
    const locale = pathname.startsWith('/tr') ? 'tr' : 'en';
    return NextResponse.redirect(new URL(`/${locale}/404`, req.url));
  }

  // Special handling for payment routes
  if (isPaymentRoute(req)) {
    // Shopier API endpoints should always be accessible (webhooks)
    if (pathname.startsWith('/api/shopier-')) {
      console.log('✅ Allowing access to Shopier API endpoint');
      return response;
    }
    
    // Payment success/failed pages should be accessible (redirects from Shopier)
    if (pathname.includes('/payment-success') || pathname.includes('/payment-failed')) {
      console.log('✅ Allowing access to payment result page');
      return response;
    }
    
    // Checkout pages require authentication
    if (pathname.includes('/checkout')) {
      if (!userId) {
        console.log('🔄 Non-signed user accessing checkout, redirecting to auth');
        const locale = pathname.startsWith('/tr') ? 'tr' : 'en';
        const signInUrl = `/${locale}/login?tab=signin&redirect=${encodeURIComponent(pathname)}`;
        return NextResponse.redirect(new URL(signInUrl, req.url));
      }
    }
  }

  // Special handling for auth flow routes (verify-email, complete-profile)
  if (isAuthFlowRoute(req)) {
    if (userId && pathname.includes('/complete-profile')) {
      console.log('✅ Allowing access to complete-profile for signed-in user');
      return response;
    }
    
    if (pathname.includes('/verify-email')) {
      console.log('✅ Allowing access to verify-email');
      return response;
    }
    
    return response;
  }

  // If user is signed in and trying to access auth routes, redirect to homepage
  if (userId && isAuthRoute(req)) {
    if (pathname.includes('/complete-profile') || pathname.includes('/verify-email')) {
      console.log('✅ Allowing signed-in user to access auth flow routes');
      return response;
    }
    
    console.log('🔄 Signed in user accessing auth route, redirecting to homepage');
    const locale = pathname.startsWith('/tr') ? 'tr' : 'en';
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  // If user is not signed in and trying to access protected routes, redirect to auth
  if (!userId && isProtectedRoute(req)) {
    console.log('🔄 Non-signed user accessing protected route, redirecting to auth');
    const locale = pathname.startsWith('/tr') ? 'tr' : 'en';
    const signInUrl = `/${locale}/login?tab=signin&redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(new URL(signInUrl, req.url));
  }

  // Public routes and auth routes are allowed
  if (isPublicRoute(req) || isAuthRoute(req)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Allowing access to public/auth route');
    }
    return response;
  }

  // For any other routes, continue without auth requirement
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Allowing access to other route');
  }
  return response;
});

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
  // Increase body size limit for middleware
  maxDuration: 300, // 5 minutes
};