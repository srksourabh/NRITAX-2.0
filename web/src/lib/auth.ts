/**
 * Auth.js v5. Sign in with an email magic link or with Google.
 *
 * Sessions live in the database rather than in a JWT, so signing out — or
 * deleting a user — takes effect immediately instead of waiting for a token to
 * expire. A tax filing is worth that round trip.
 *
 * NextAuth is created on first use so `next build` can import this module
 * without opening PGlite during static analysis.
 */

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';

import { authConfig } from '@/lib/auth.config';
import { getDb } from '@/lib/db';
import { accounts, sessions, users, verificationTokens } from '@/lib/db/schema';

const emailServer = process.env.AUTH_EMAIL_SERVER?.trim();
const emailFrom = process.env.AUTH_EMAIL_FROM?.trim() || 'NRITAX <no-reply@localhost>';

/**
 * With AUTH_EMAIL_SERVER unset there is no SMTP server to send through, so the
 * sign-in URL is printed to the terminal and the developer pastes it into the
 * browser. Development only: set AUTH_EMAIL_SERVER and Nodemailer sends the
 * mail itself, and this branch is never taken.
 */
const emailProvider = emailServer
  ? Nodemailer({ server: emailServer, from: emailFrom })
  : Nodemailer({
      // Nodemailer still wants a server object even when we never connect.
      server: { host: 'localhost', port: 1025, secure: false },
      from: emailFrom,
      sendVerificationRequest({ identifier, url }) {
        console.info(`\n  Sign-in link for ${identifier}\n  ${url}\n`);
      },
    });

type AuthInstance = ReturnType<typeof NextAuth>;

let instance: AuthInstance | null = null;

function authInstance(): AuthInstance {
  if (instance) return instance;
  instance = NextAuth({
    ...authConfig,
    trustHost: true,
    adapter: DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: 'database' },
    providers: [...authConfig.providers, emailProvider],
  });
  return instance;
}

export const auth: AuthInstance['auth'] = ((...args: Parameters<AuthInstance['auth']>) =>
  authInstance().auth(...args)) as AuthInstance['auth'];

export const signIn: AuthInstance['signIn'] = ((...args: Parameters<AuthInstance['signIn']>) =>
  authInstance().signIn(...args)) as AuthInstance['signIn'];

export const signOut: AuthInstance['signOut'] = ((...args: Parameters<AuthInstance['signOut']>) =>
  authInstance().signOut(...args)) as AuthInstance['signOut'];

export const handlers = {
  GET: (...args: Parameters<AuthInstance['handlers']['GET']>) =>
    authInstance().handlers.GET(...args),
  POST: (...args: Parameters<AuthInstance['handlers']['POST']>) =>
    authInstance().handlers.POST(...args),
};
