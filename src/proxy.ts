import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { isManagedPlatform } from '@/lib/platform';

const MAINT_FILE = path.join(process.cwd(), 'MAINTENANCE');
const MAINT_HTML = path.join(process.cwd(), 'maintenance.html');

function isMaintenance(): boolean {
  return (
    !isManagedPlatform() &&
    fs.existsSync(MAINT_FILE) &&
    fs.readFileSync(MAINT_FILE, 'utf-8').trim() === '1'
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  if (isMaintenance()) {
    const html = fs.existsSync(MAINT_HTML)
      ? fs.readFileSync(MAINT_HTML, 'utf-8')
      : '<!DOCTYPE html><html><body style="background:#0a0a0f;color:#c9d1d9;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;">musicsheets — maintenance</body></html>';

    return new Response(html, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return NextResponse.next();
}
