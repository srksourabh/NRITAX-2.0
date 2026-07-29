'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

import { readDemoAuth, signIn } from '@/lib/auth';

function safeCallbackUrl(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? '').trim();
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return '/filing';
}

/**
 * One-click demo / test sign-in.
 * Uses redirect:false so we always land on /filing after the session cookie is set.
 */
export async function demoTestSignIn(formData: FormData) {
  const demo = readDemoAuth();
  if (!demo.enabled || !demo.password) {
    redirect('/login?error=demo-disabled');
  }

  const redirectTo = safeCallbackUrl(formData.get('callbackUrl'));

  try {
    const result = await signIn('demo', {
      email: demo.email,
      password: demo.password,
      redirectTo,
      redirect: false,
    });

    if (result?.error) {
      redirect('/login?error=demo');
    }
  } catch (error) {
    // Auth.js may still throw a redirect; let Next handle it.
    if (error instanceof AuthError) {
      redirect('/login?error=demo');
    }
    throw error;
  }

  redirect(redirectTo);
}
