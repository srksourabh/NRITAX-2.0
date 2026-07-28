/**
 * Auth.js v5. Email magic link, optional Google, and optional demo credentials.
 *
 * Sessions use JWT so the Credentials (demo) provider can sign in without a
 * mail round-trip. The drizzle adapter still creates/links users for email and
 * Google. Demo login upserts a fixed test user when AUTH_DEMO_PASSWORD is set.
 *
 * NextAuth is created on first use so `next build` can import this module
 * without opening PGlite during static analysis.
 */

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Nodemailer from 'next-auth/providers/nodemailer';

import { authConfig } from '@/lib/auth.config';
import { getDb, runMigrations } from '@/lib/db';
import { accounts, sessions, users, verificationTokens } from '@/lib/db/schema';

const emailServer = process.env.AUTH_EMAIL_SERVER?.trim();
const emailFrom = process.env.AUTH_EMAIL_FROM?.trim() || 'NRITAX <no-reply@localhost>';

export function readDemoAuth(): {
  enabled: boolean;
  email: string;
  password: string | null;
} {
  const email = (process.env.AUTH_DEMO_EMAIL?.trim() || 'demo@nritax.app').toLowerCase();
  const password = process.env.AUTH_DEMO_PASSWORD?.trim() || null;
  const disabled = process.env.AUTH_DEMO_LOGIN?.trim() === '0';
  return {
    enabled: Boolean(password) && !disabled,
    email,
    password,
  };
}

/**
 * With AUTH_EMAIL_SERVER unset there is no SMTP server to send through, so the
 * sign-in URL is printed to the terminal and the developer pastes it into the
 * browser. Development only: set AUTH_EMAIL_SERVER and Nodemailer sends the
 * mail itself, and this branch is never taken.
 */
const emailProvider = emailServer
  ? Nodemailer({ server: emailServer, from: emailFrom })
  : Nodemailer({
      server: { host: 'localhost', port: 1025, secure: false },
      from: emailFrom,
      sendVerificationRequest({ identifier, url }) {
        console.info(`\n  Sign-in link for ${identifier}\n  ${url}\n`);
      },
    });

const demoProvider = Credentials({
  id: 'demo',
  name: 'Demo',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    const demo = readDemoAuth();
    if (!demo.enabled || !demo.password) return null;

    const email = String(credentials?.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(credentials?.password ?? '');
    if (email !== demo.email || password !== demo.password) return null;

    // Stable id so JWT sessions stay consistent when the DB is in-memory
    // (Vercel without DATABASE_URL) and recreated per invoke.
    const fallbackUser = {
      id: '00000000-0000-4000-8000-000000000001',
      email: demo.email,
      name: 'Demo Taxpayer',
    };

    try {
      await runMigrations();
      const db = getDb();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, demo.email))
        .limit(1);

      if (existing[0]) {
        return {
          id: existing[0].id,
          email: existing[0].email,
          name: existing[0].name ?? 'Demo Taxpayer',
        };
      }

      await db.insert(users).values({
        id: fallbackUser.id,
        email: demo.email,
        name: 'Demo Taxpayer',
        emailVerified: new Date(),
      });
      return fallbackUser;
    } catch {
      // Auth must not depend on durable storage — JWT carries the user.
      return fallbackUser;
    }
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
    // JWT required for Credentials (demo) direct login.
    session: { strategy: 'jwt' },
    providers: [...authConfig.providers, emailProvider, demoProvider],
    callbacks: {
      ...authConfig.callbacks,
      async jwt({ token, user }) {
        if (user?.id) token.sub = user.id;
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
    },
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
