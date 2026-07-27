import Link from 'next/link';
import { AuthError } from 'next-auth';

import { AppShell } from '@/components/shell/AppShell';
import { signIn } from '@/lib/auth';

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

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
  );

  return (
    <AppShell>
      <main className="ntx-page flex max-w-lg flex-1 flex-col justify-center py-16">
        <p className="text-[var(--caption)] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
          Sign in
        </p>
        <h1 className="ntx-display-sm mt-3 text-[var(--ink)]">No Indian mobile needed</h1>
        <p className="mt-3 text-[var(--text-muted)]">
          We email you a link, or you can use Google. In local development the link is printed in
          the terminal when SMTP is not configured.
        </p>
        <hr className="ntx-double-rule mt-6 max-w-xs" />

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
