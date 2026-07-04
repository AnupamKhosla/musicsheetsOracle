import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { isManagedPlatform } from '@/lib/platform';

const MAINT_FILE = path.join(process.cwd(), 'MAINTENANCE');

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
    pathname === '/maintenance' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  if (isMaintenance()) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}
