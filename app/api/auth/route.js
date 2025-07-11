import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD || 'travel2024';
const AUTH_COOKIE_NAME = 'travelspeak_auth';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 dni

// Track login attempts
const loginAttempts = new Map();
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW = 3600000; // 1 hour

// Cleanup old attempts every 10 minutes
if (typeof global !== 'undefined' && !global.loginAttemptsCleanupInterval) {
  global.loginAttemptsCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
      if (now > value.resetTime) {
        loginAttempts.delete(key);
      }
    }
  }, 600000);
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    // Check login attempts
    let attempts = loginAttempts.get(ip) || { count: 0, resetTime: now + LOGIN_ATTEMPT_WINDOW };
    
    if (now > attempts.resetTime) {
      attempts = { count: 0, resetTime: now + LOGIN_ATTEMPT_WINDOW };
    }
    
    if (attempts.count >= LOGIN_ATTEMPT_LIMIT) {
      const remainingTime = attempts.resetTime - now;
      return NextResponse.json(
        { 
          error: `Za dużo prób logowania. Spróbuj ponownie za ${Math.ceil(remainingTime / 60000)} minut.`,
          retryAfter: Math.ceil(remainingTime / 1000)
        },
        { status: 429 }
      );
    }
    
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Hasło jest wymagane' },
        { status: 400 }
      );
    }

    // Sprawdzamy hasło
    if (password === FAMILY_PASSWORD) {
      // Clear login attempts on success
      loginAttempts.delete(ip);
      
      // Generate secure token
      const sessionId = crypto.randomBytes(32).toString('hex');
      const timestamp = Date.now();
      const tokenData = `${sessionId}:${timestamp}:${password}`;
      const token = Buffer.from(tokenData).toString('base64');
      
      // Ustawiamy cookie
      cookies().set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      // Increment failed attempts
      attempts.count++;
      loginAttempts.set(ip, attempts);
      
      return NextResponse.json(
        { 
          error: 'Nieprawidłowe hasło',
          attemptsRemaining: LOGIN_ATTEMPT_LIMIT - attempts.count
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (authCookie) {
      // Sprawdzamy czy token jest ważny
      try {
        const decoded = Buffer.from(authCookie.value, 'base64').toString();
        const [sessionId, timestamp, password] = decoded.split(':');
        
        // Check if token is valid and not expired (30 days)
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = COOKIE_MAX_AGE * 1000;
        
        if (password === FAMILY_PASSWORD && tokenAge < maxAge) {
          return NextResponse.json({ authenticated: true });
        }
      } catch (e) {
        // Invalid token
        console.error('Invalid auth token:', e);
      }
    }

    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  try {
    cookies().delete(AUTH_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas wylogowania' },
      { status: 500 }
    );
  }
}