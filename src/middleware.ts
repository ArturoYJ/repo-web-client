import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function middleware(req: NextRequest) {
  const cookie = req.headers.get('cookie') ?? '';

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { cookie },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
