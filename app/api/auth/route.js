import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD || 'travel2024';
const AUTH_COOKIE_NAME = 'travelspeak_auth';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 dni

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Hasło jest wymagane' },
        { status: 400 }
      );
    }

    // Sprawdzamy hasło
    if (password === FAMILY_PASSWORD) {
      // Tworzymy prosty token (w produkcji użyj crypto)
      const token = Buffer.from(`${password}:${Date.now()}`).toString('base64');
      
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
      return NextResponse.json(
        { error: 'Nieprawidłowe hasło' },
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
        const [password, timestamp] = decoded.split(':');
        
        if (password === FAMILY_PASSWORD) {
          return NextResponse.json({ authenticated: true });
        }
      } catch (e) {
        // Invalid token
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