/**
 * The half of the Auth.js configuration that has to run at the edge.
 *
 * Middleware imports this file, so nothing here may reach the database or a
 * Node-only module. The drizzle adapter, the database session strategy and the
 * email provider live in auth.ts.
 */

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/** Everything at or under these paths needs a signed-in user. */
export const PROTECTED_PREFIXES = ['/dashboard', '/filing'] as const;

/** True when the path is behind the sign-in gate. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const googleId = process.env.AUTH_GOOGLE_ID?.trim();
const googleSecret = process.env.AUTH_GOOGLE_SECRET?.trim();

// Google is offered only once its credentials exist. Registering it with empty
// strings produces an opaque failure on the callback rather than at start-up.
const google =
  googleId && googleSecret ? [Google({ clientId: googleId, clientSecret: googleSecret })] : [];

export const authConfig = {
  providers: google,
  callbacks: {
    authorized({ request, auth }) {
      return isProtectedPath(request.nextUrl.pathname) ? auth?.user != null : true;
    },
  },
} satisfies NextAuthConfig;
