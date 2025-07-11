import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'travelspeak_auth';
const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD || 'travel2024';

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Ścieżki które nie wymagają autentykacji
  const publicPaths = ['/', '/api/auth'];
  const isPublicPath = publicPaths.some(p => path === p);

  // Sprawdzamy czy użytkownik jest zalogowany
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  let isAuthenticated = false;

  if (authCookie) {
    try {
      const decoded = Buffer.from(authCookie.value, 'base64').toString();
      const [password] = decoded.split(':');
      isAuthenticated = password === FAMILY_PASSWORD;
    } catch (e) {
      isAuthenticated = false;
    }
  }

  // Logika przekierowań
  if (!isAuthenticated && !isPublicPath) {
    // Niezalogowany próbuje dostać się do chronionej strony
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isAuthenticated && path === '/') {
    // Zalogowany na stronie logowania -> przekieruj do aplikacji
    return NextResponse.redirect(new URL('/translate', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};