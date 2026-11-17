import { clerkMiddleware } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { localePrefix, locales } from './navigation';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'ko',
  localePrefix
});

const publicPages = ['/', '/login', '/signup'];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1. Run i18n middleware first to handle locale detection (cookies/headers)
  // intlMiddleware returns a response with the locale header/cookie set.
  // We will return this response at the end, unless we redirect.
  // CRITICAL FIX: Do NOT run intlMiddleware for API routes, as it rewrites them to /[locale]/api/...
  // which implies the API route must be inside [locale] folder, causing 404s or Server Action errors.
  const isApiRoute = pathname.startsWith('/api');
  const response = isApiRoute ? NextResponse.next() : intlMiddleware(req);

  // 2. Check for Legacy Auth Token
  const legacyToken = req.cookies.get('access_token')?.value;

  // 3. Check for Clerk Auth
  const { userId } = await auth();

  const isPublicPage = publicPages.includes(pathname);

  // 4. Combined Auth Logic
  const isAuthenticated = !!legacyToken || !!userId;

  if (isAuthenticated) {
    // If authenticated and trying to access root, login, or signup, redirect to dashboard
    // Handle localized paths as well (e.g. /en, /en/login)
    const isRoot = pathname === '/' || locales.some(loc => pathname === `/${loc}`);
    const isAuthPage = ['/login', '/signup'].some(page => pathname === page || locales.some(loc => pathname === `/${loc}${page}`));

    if (isRoot || isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } else {
    // If not authenticated and trying to access protected page
    if (!isPublicPage) {
      // API Routes should not redirect to login page (it breaks POST requests with "Failed to find Server Action")
      // Instead, they should return 401 Unauthorized
      if (pathname.startsWith('/api')) {
        // Allow auth routes to proceed (they handle their own logic/are public)
        if (pathname.startsWith('/api/auth')) {
          return response;
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // If we are strictly Clerk-only, we might want to redirect to Clerk?
      // But for now, ensuring redirection to our /login page covers both cases (UI handles choice)
      // NOTE: If using Clerk Protected Components, they might handle redirect themselves inside the page,
      // but blocking at middleware is safer.
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/assets`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|assets|_next|_vercel|.*\\..*).*)',
    // Always run for API routes, EXCEPT /api/v1 which is proxied to backend
    '/(api(?!/v1)|trpc)(.*)',
  ]
};
