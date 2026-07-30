/**
 * Auth.js v5. Optional Google, optional email magic link, and demo credentials.
 *
 * JWT strategy is used throughout — Credentials (demo) works without a database
 * adapter. The Email provider is registered only when AUTH_EMAIL_SERVER is set
 * AND a Supabase adapter can be built; otherwise Auth.js throws MissingAdapter
 * and even demo sign-in fails.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Nodemailer from 'next-auth/providers/nodemailer';
import type { Provider } from 'next-auth/providers';

import { authConfig } from '@/lib/auth.config';
import { getServiceClient } from '@/lib/db/client';

const emailServer = process.env.AUTH_EMAIL_SERVER?.trim();
const emailFrom = process.env.AUTH_EMAIL_FROM?.trim() || 'NRITAX 2.0 <no-reply@localhost>';

export function readDemoAuth(): {
  enabled: boolean;
  email: string;
  password: string | null;
} {
  const email = (process.env.AUTH_DEMO_EMAIL?.trim() || 'demo@nritax.app').toLowerCase();
  const configuredPassword = process.env.AUTH_DEMO_PASSWORD?.trim() || null;
  // Local/dev always gets a working test login unless AUTH_DEMO_LOGIN=0.
  // Production requires an explicit AUTH_DEMO_PASSWORD.
  const isNonProduction = process.env.NODE_ENV !== 'production';
  const password = configuredPassword ?? (isNonProduction ? 'demo1234' : null);
  const disabled = process.env.AUTH_DEMO_LOGIN?.trim() === '0';
  return {
    enabled: Boolean(password) && !disabled,
    email,
    password,
  };
}

function supabaseReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

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

    if (!supabaseReady()) return fallbackUser;

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

function buildProviders(): Provider[] {
  const providers: Provider[] = [...authConfig.providers, demoProvider];

  // Email magic-link needs an Auth.js adapter for verification tokens.
  // Without it, Auth.js throws MissingAdapter and blocks every provider —
  // including demo credentials. Skip email until Supabase + SMTP are both set.
  if (emailServer && supabaseReady()) {
    providers.push(
      Nodemailer({
        server: emailServer,
        from: emailFrom,
      }),
    );
  }

  return providers;
}

type AuthInstance = ReturnType<typeof NextAuth>;

let instance: AuthInstance | null = null;

function authInstance(): AuthInstance {
  if (instance) return instance;
  instance = NextAuth({
    ...authConfig,
    trustHost: true,
    session: { strategy: 'jwt' },
    providers: buildProviders(),
    callbacks: {
      ...authConfig.callbacks,
      async jwt({ token, user }) {
        if (user?.id) token.sub = user.id;
        if (user?.email) token.email = user.email;
        if (user?.name) token.name = user.name;
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          if (token.sub) session.user.id = token.sub;
          if (typeof token.email === 'string') session.user.email = token.email;
          if (typeof token.name === 'string') session.user.name = token.name;
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
