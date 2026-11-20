import { NextRequest, NextResponse } from 'next/server';

import { ACENTE_LOGIN, OTOBUS_LOGIN, REHBER_LOGIN } from './lib/panel-routes';

type SessionProbe =
  | { authenticated: false }
  | {
      authenticated: true;
      role: string;
      actorType: string;
    };

const AGENCY_ROLES = new Set([
  'PARTNER',
  'PARTNER_STAFF',
  'AGENCY_OWNER',
  'AGENCY_ADMIN',
  'AGENCY_STAFF',
]);

const GUIDE_ROLES = new Set(['GUIDE']);

const BUS_ROLES = new Set(['BUS_COMPANY']);

const ADMIN_ROLES = new Set([
  'ADMIN',
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PLATFORM_SUPER_ADMIN',
]);

const CUSTOMER_AREA_ROLES = new Set([
  'CUSTOMER',
  'PARTNER',
  'PARTNER_STAFF',
  'ADMIN',
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PLATFORM_SUPER_ADMIN',
  'AGENCY_OWNER',
  'AGENCY_ADMIN',
  'AGENCY_STAFF',
  'GUIDE',
  'BUS_COMPANY',
]);

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return response;
}

function loginPathFor(pathname: string): string {
  if (pathname.startsWith('/acente') || pathname.startsWith('/partner')) {
    return ACENTE_LOGIN;
  }
  if (pathname.startsWith('/rehber')) return REHBER_LOGIN;
  if (pathname.startsWith('/otobus')) return OTOBUS_LOGIN;
  if (pathname.startsWith('/admin')) return '/login';
  return '/login';
}

async function probeSession(
  request: NextRequest,
): Promise<SessionProbe | null> {
  const cookie = request.headers.get('cookie');
  if (!cookie || !cookie.includes('turta_refresh=')) {
    return { authenticated: false };
  }

  const url = new URL('/api/v1/identity/session', request.url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { cookie, accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      success?: boolean;
      data?: SessionProbe;
    };
    if (!payload.success || !payload.data) return null;
    return payload.data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cookie-based role guard (RefreshToken HttpOnly via same-origin proxy).
 * Panel routes (acente/rehber/otobus): API unreachable → fail-open + no-store.
 * /admin: API unreachable → fail-closed (login redirect) — no HTML leak.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await probeSession(request);

  if (session === null) {
    if (pathname.startsWith('/admin')) {
      const cookie = request.headers.get('cookie') ?? '';
      // No refresh cookie → hard block. Probe timeout with cookie → let AdminShell decide.
      if (!cookie.includes('turta_refresh=')) {
        const login = new URL('/login', request.url);
        login.searchParams.set('next', pathname);
        return withNoStore(NextResponse.redirect(login));
      }
    }
    return withNoStore(NextResponse.next());
  }

  const isAuthed = session.authenticated === true;
  const role = isAuthed ? session.role : null;

  if (pathname.startsWith('/acente')) {
    // Login page is public
    if (pathname === ACENTE_LOGIN || pathname.startsWith(`${ACENTE_LOGIN}/`)) {
      return withNoStore(NextResponse.next());
    }
    if (!isAuthed || !role || !AGENCY_ROLES.has(role)) {
      const login = new URL(loginPathFor(pathname), request.url);
      login.searchParams.set('next', pathname);
      return withNoStore(NextResponse.redirect(login));
    }
    return withNoStore(NextResponse.next());
  }

  if (pathname.startsWith('/rehber')) {
    if (
      pathname === REHBER_LOGIN ||
      pathname.startsWith(`${REHBER_LOGIN}/`) ||
      pathname === '/rehber/kayit' ||
      pathname.startsWith('/rehber/kayit/')
    ) {
      return withNoStore(NextResponse.next());
    }
    if (!isAuthed || !role || !GUIDE_ROLES.has(role)) {
      const login = new URL(REHBER_LOGIN, request.url);
      login.searchParams.set('next', pathname);
      return withNoStore(NextResponse.redirect(login));
    }
    return withNoStore(NextResponse.next());
  }

  if (pathname.startsWith('/otobus')) {
    if (pathname === OTOBUS_LOGIN || pathname.startsWith(`${OTOBUS_LOGIN}/`)) {
      return withNoStore(NextResponse.next());
    }
    if (!isAuthed || !role || !BUS_ROLES.has(role)) {
      const login = new URL(OTOBUS_LOGIN, request.url);
      login.searchParams.set('next', pathname);
      return withNoStore(NextResponse.redirect(login));
    }
    return withNoStore(NextResponse.next());
  }

  if (pathname.startsWith('/admin')) {
    if (!isAuthed || !role || !ADMIN_ROLES.has(role)) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return withNoStore(NextResponse.redirect(login));
    }
    return withNoStore(NextResponse.next());
  }

  if (
    pathname === '/profile' ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/checkout')
  ) {
    if (!isAuthed || !role || !CUSTOMER_AREA_ROLES.has(role)) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return withNoStore(NextResponse.redirect(login));
    }
    return withNoStore(NextResponse.next());
  }

  return withNoStore(NextResponse.next());
}

export const config = {
  matcher: [
    '/acente',
    '/acente/:path*',
    '/rehber',
    '/rehber/:path*',
    '/otobus',
    '/otobus/:path*',
    '/admin/:path*',
    '/profile',
    '/profile/:path*',
    '/bookings',
    '/bookings/:path*',
    '/checkout',
    '/checkout/:path*',
  ],
};
