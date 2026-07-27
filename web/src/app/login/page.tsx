import Link from 'next/link';
import { AuthError } from 'next-auth';

import { AppShell } from '@/components/shell/AppShell';
import { readDemoAuth, signIn } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function emailSignIn(formData: FormData) {
  'use server';
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return;
  try {
    await signIn('nodemailer', { email, redirectTo: '/filing' });
  } catch (error) {
    if (error instanceof AuthError) return;
    throw error;
  }
}

async function googleSignIn() {
  'use server';
  await signIn('google', { redirectTo: '/filing' });
}

async function demoSignIn() {
  'use server';
  const demo = readDemoAuth();
  if (!demo.enabled || !demo.password) return;
  try {
    await signIn('demo', {
      email: demo.email,
      password: demo.password,
      redirectTo: '/filing',
    });
  } catch (error) {
    if (error instanceof AuthError) return;
    throw error;
  }
}

async function demoPasswordSignIn(formData: FormData) {
  'use server';
  const demo = readDemoAuth();
  if (!demo.enabled) return;
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  try {
    await signIn('demo', { email, password, redirectTo: '/filing' });
  } catch (error) {
    if (error instanceof AuthError) return;
    throw error;
  }
}

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
  );
  const demo = readDemoAuth();

  return (
    <AppShell>
      <main className="ntx-page flex max-w-lg flex-1 flex-col justify-center py-16">
        <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
          Sign in
        </p>
        <h1 className="ntx-display-sm mt-3 text-[var(--ink)]">No Indian mobile needed</h1>
        <p className="mt-3 text-[var(--text-muted)]">
          We email you a link, or you can use Google. In local development the link is printed in
          the terminal when SMTP is not configured.
        </p>
        <hr className="ntx-double-rule mt-6 max-w-xs" />

        {demo.enabled ? (
          <div className="ntx-panel mt-8 space-y-3 p-5">
            <h2 className="text-[var(--h3)] font-semibold">Demo account</h2>
            <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
              Direct login for testing — no email required.
            </p>
            <p className="font-mono text-[var(--body-sm)] text-[var(--ink)]">
              {demo.email}
            </p>
            <form action={demoSignIn}>
              <button type="submit" className="ntx-btn ntx-btn-credit w-full">
                Sign in as demo
              </button>
            </form>
            <form action={demoPasswordSignIn} className="space-y-2 border-t border-[var(--rule)] pt-3">
              <label className="ntx-label" htmlFor="demo-email">
                Or enter demo credentials
              </label>
              <input
                id="demo-email"
                name="email"
                type="email"
                defaultValue={demo.email}
                autoComplete="username"
                className="ntx-input"
              />
              <input
                id="demo-password"
                name="password"
                type="password"
                placeholder="Demo password"
                autoComplete="current-password"
                required
                className="ntx-input"
              />
              <button type="submit" className="ntx-btn ntx-btn-secondary w-full">
                Sign in with password
              </button>
            </form>
          </div>
        ) : null}

        <form action={emailSignIn} className="mt-8 flex flex-col gap-3">
          <label className="ntx-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="ntx-input"
          />
          <button type="submit" className="ntx-btn ntx-btn-primary">
            Email me a sign-in link
          </button>
        </form>

        {googleEnabled ? (
          <form action={googleSignIn} className="mt-3">
            <button type="submit" className="ntx-btn ntx-btn-secondary w-full">
              Continue with Google
            </button>
          </form>
        ) : null}

        <Link href="/" className="mt-8 text-[var(--body-sm)] text-[var(--primary)]">
          Back home
        </Link>
      </main>
    </AppShell>
  );
}
