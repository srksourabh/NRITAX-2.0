/**
 * Auth.js v5. Email magic link, optional Google, and optional demo credentials.
 *
 * JWT strategy is used throughout — Credentials (demo) provider works without
 * a mail round-trip. User upsert on demo login goes directly to Supabase.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Nodemailer from 'next-auth/providers/nodemailer';

import { authConfig } from '@/lib/auth.config';
import { getServiceClient } from '@/lib/db/client';

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

    const fallbackUser = {
      id: '00000000-0000-4000-8000-000000000001',
      email: demo.email,
      name: 'Demo Taxpayer',
    };

    try {
      const db = getServiceClient();
      const { data: rows } = await db
        .from('user')
        .select('id, email, name')
        .eq('email', demo.email)
        .limit(1);

      if (rows?.[0]) {
        return { id: rows[0].id, email: rows[0].email, name: rows[0].name ?? 'Demo Taxpayer' };
      }

      await db.from('user').upsert(
        {
          id: fallbackUser.id,
          email: demo.email,
          name: 'Demo Taxpayer',
          emailVerified: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );
      return fallbackUser;
    } catch {
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
