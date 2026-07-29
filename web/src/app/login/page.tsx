import Link from 'next/link';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

import { TestLoginButton } from '@/components/auth/TestLoginButton';
import { AppShell } from '@/components/shell/AppShell';
import { readDemoAuth, signIn } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function safeCallbackUrl(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? '').trim();
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return '/filing';
}

async function emailSignIn(formData: FormData) {
  'use server';
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return;
  const redirectTo = safeCallbackUrl(formData.get('callbackUrl'));
  try {
    await signIn('nodemailer', { email, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=email');
    }
    throw error;
  }
}

async function googleSignIn(formData: FormData) {
  'use server';
  const redirectTo = safeCallbackUrl(formData.get('callbackUrl'));
  try {
    await signIn('google', { redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=google');
    }
    throw error;
  }
}

async function demoPasswordSignIn(formData: FormData) {
  'use server';
  const demo = readDemoAuth();
  if (!demo.enabled || !demo.password) {
    redirect('/login?error=demo-disabled');
  }
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectTo = safeCallbackUrl(formData.get('callbackUrl'));
  try {
    const result = await signIn('demo', {
      email,
      password,
      redirectTo,
      redirect: false,
    });
    if (result?.error) {
      redirect('/login?error=demo');
    }
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=demo');
    }
    throw error;
  }
  redirect(redirectTo);
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
  const emailEnabled = Boolean(
    process.env.AUTH_EMAIL_SERVER?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
  const demo = readDemoAuth();
  const params = searchParams ? await searchParams : {};
  const rawError = params.error;
  const errorCode = Array.isArray(rawError) ? rawError[0] : rawError;
  const notice = errorMessage(errorCode);
  const rawCallback = params.callbackUrl;
  const callbackCandidate = Array.isArray(rawCallback) ? rawCallback[0] : rawCallback;
  const callbackUrl =
    typeof callbackCandidate === 'string' &&
    callbackCandidate.startsWith('/') &&
    !callbackCandidate.startsWith('//')
      ? callbackCandidate
      : '/filing';

  return (
    <AppShell>
      <main className="ntx-page flex max-w-lg flex-1 flex-col justify-center py-16">
        <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
          Sign in
        </p>
        <h1 className="ntx-display-sm mt-3 text-[var(--ink)]">No Indian mobile needed</h1>
        <p className="mt-3 text-[var(--text-muted)]">
          {demo.enabled
            ? 'Use test login below to enter the filing app immediately. Email and Google are optional when configured.'
            : 'We email you a link, or you can use Google, when those providers are configured.'}
        </p>
        <hr className="ntx-double-rule mt-6 max-w-xs" />

        {notice ? (
          <p className="ntx-panel mt-6 border-[var(--notice)] px-4 py-3 text-[var(--body-sm)] text-[var(--notice-text)]">
            {notice}
          </p>
        ) : null}

        {demo.enabled ? (
          <div className="ntx-panel mt-8 space-y-3 border-[var(--credit)] p-5">
            <h2 className="text-[var(--h3)] font-semibold text-[var(--ink)]">Test login</h2>
            <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
              Skip email and enter the filing app immediately as{' '}
              <span className="font-mono text-[var(--ink)]">{demo.email}</span>.
            </p>
            <TestLoginButton callbackUrl={callbackUrl} className="w-full" />
            <form action={demoPasswordSignIn} className="space-y-2 border-t border-[var(--rule)] pt-3">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
                defaultValue={demo.password ?? ''}
                autoComplete="current-password"
                required
                className="ntx-input"
              />
              <button type="submit" className="ntx-btn ntx-btn-secondary w-full">
                Sign in with password
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-8 text-[var(--body-sm)] text-[var(--text-muted)]">
            Test login is off. Set <span className="font-mono">AUTH_DEMO_PASSWORD</span> in{' '}
            <span className="font-mono">.env.local</span>, or remove{' '}
            <span className="font-mono">AUTH_DEMO_LOGIN=0</span>.
          </p>
        )}

        {emailEnabled ? (
          <form action={emailSignIn} className="mt-8 flex flex-col gap-3">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
        ) : null}

        {googleEnabled ? (
          <form action={googleSignIn} className="mt-3">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
