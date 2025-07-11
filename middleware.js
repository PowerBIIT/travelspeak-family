import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'travelspeak_auth';
const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD || 'travel2024';

// Rate limiting configuration
const rateLimitMap = new Map();
// Rate limiting configuration from environment variables
const RATE_LIMITS = {
  '/api/translate': { 
    requests: parseInt(process.env.RATE_LIMIT_TRANSLATE || '200'), 
    window: 3600000 
  },
  '/api/whisper': { 
    requests: parseInt(process.env.RATE_LIMIT_WHISPER || '100'), 
    window: 3600000 
  },
  '/api/tts': { 
    requests: parseInt(process.env.RATE_LIMIT_TTS || '200'), 
    window: 3600000 
  },
  '/api/ocr': { 
    requests: parseInt(process.env.RATE_LIMIT_OCR || '50'), 
    window: 3600000 
  },
  '/api/auth': { 
    requests: parseInt(process.env.RATE_LIMIT_AUTH || '20'), 
    window: 3600000 
  }
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

export function middleware(request) {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Check if rate limiting is enabled
  const rateLimitingEnabled = process.env.ENABLE_RATE_LIMITING !== 'false';

  // Rate limiting check for API endpoints
  if (rateLimitingEnabled && RATE_LIMITS[path]) {
    const limit = RATE_LIMITS[path];
    const key = `${ip}:${path}`;
    const now = Date.now();
    
    const userLimit = rateLimitMap.get(key) || { count: 0, resetTime: now + limit.window };
    
    // Reset if window expired
    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + limit.window;
    }
    
    // Check if limit exceeded
    if (userLimit.count >= limit.requests) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Za dużo żądań. Spróbuj ponownie później.',
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limit.requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(userLimit.resetTime),
            'Retry-After': String(Math.ceil((userLimit.resetTime - now) / 1000))
          }
        }
      );
    }
    
    // Increment counter
    userLimit.count++;
    rateLimitMap.set(key, userLimit);
    
    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit.requests));
    response.headers.set('X-RateLimit-Remaining', String(limit.requests - userLimit.count));
    response.headers.set('X-RateLimit-Reset', String(userLimit.resetTime));
    return response;
  }

  // Ścieżki które nie wymagają autentykacji
  const publicPaths = ['/', '/api/auth'];
  const isPublicPath = publicPaths.some(p => path === p);

  // Sprawdzamy czy użytkownik jest zalogowany
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  let isAuthenticated = false;

  if (authCookie) {
    try {
      const decoded = Buffer.from(authCookie.value, 'base64').toString();
      const [sessionId, timestamp, password] = decoded.split(':');
      
      // Check if token is valid and not expired
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
      
      isAuthenticated = password === FAMILY_PASSWORD && tokenAge < maxAge;
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