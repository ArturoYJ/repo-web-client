import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

const ALLOWED_SEGMENT = /^[\w\-]+$/;

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  if (!path.every((segment) => ALLOWED_SEGMENT.test(segment))) {
    return new NextResponse(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUrl = `${API_URL}/api/v1/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  const apiRes = await fetch(targetUrl, init);

  const resHeaders = new Headers();
  resHeaders.set('Content-Type', 'application/json');

  const setCookie = apiRes.headers.get('set-cookie');
  if (setCookie) {
    resHeaders.set('set-cookie', setCookie);
  }

  const body = await apiRes.text();

  return new NextResponse(body, {
    status: apiRes.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;