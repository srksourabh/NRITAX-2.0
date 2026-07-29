import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth.middleware';
import { isProtectedPath } from '@/lib/auth.config';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }
  if (req.auth?.user) {
    return NextResponse.next();
  }
  const login = new URL('/login', req.nextUrl.origin);
  login.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: ['/filing/:path*', '/dashboard/:path*'],
};
