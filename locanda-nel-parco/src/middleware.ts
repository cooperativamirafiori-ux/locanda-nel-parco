import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'locanda_admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteggi tutte le rotte /admin tranne /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get(SESSION_COOKIE);
    if (session?.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Proteggi le API admin tranne login/logout
  if (
    pathname.startsWith('/api/admin') &&
    !pathname.startsWith('/api/admin/login') &&
    !pathname.startsWith('/api/admin/logout')
  ) {
    const session = request.cookies.get(SESSION_COOKIE);
    if (session?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
