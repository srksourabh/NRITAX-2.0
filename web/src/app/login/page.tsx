import Link from 'next/link';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

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
    if (error instanceof AuthError) {
      redirect('/login?error=email');
    }
    throw error;
  }
}

async function googleSignIn() {
  'use server';
  try {
    await signIn('google', { redirectTo: '/filing' });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=google');
    }
    throw error;
  }
}

async function demoSignIn() {
  'use server';
  const demo = readDemoAuth();
  if (!demo.enabled || !demo.password) {
    redirect('/login?error=demo-disabled');
  }
  try {
    await signIn('demo', {
      email: demo.email,
      password: demo.password,
      redirectTo: '/filing',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=demo');
    }
    throw error;
  }
}

async function demoPasswordSignIn(formData: FormData) {
  'use server';
  const demo = readDemoAuth();
  if (!demo.enabled) {
    redirect('/login?error=demo-disabled');
  }
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  try {
    await signIn('demo', { email, password, redirectTo: '/filing' });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=demo');
    }
    throw error;
  }
}

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case 'demo':
      return 'Demo sign-in failed. Check AUTH_DEMO_PASSWORD on the server, or try again.';
    case 'demo-disabled':
      return 'Demo login is not configured (AUTH_DEMO_PASSWORD missing).';
    case 'email':
      return 'Could not send a sign-in link. Try again or use demo login.';
    case 'google':
      return 'Google sign-in failed. Try demo login instead.';
    default:
      return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
  );
  const demo = readDemoAuth();
  const params = searchParams ? await searchParams : {};
  const rawError = params.error;
  const errorCode = Array.isArray(rawError) ? rawError[0] : rawError;
  const notice = errorMessage(errorCode);

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

        {notice ? (
          <p className="ntx-panel mt-6 border-[var(--notice)] px-4 py-3 text-[var(--body-sm)] text-[var(--notice-text)]">
            {notice}
          </p>
        ) : null}

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
