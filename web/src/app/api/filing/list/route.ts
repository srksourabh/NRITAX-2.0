import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { runMigrations } from '@/lib/db';
import { listDrafts } from '@/lib/filing/drafts';

export const dynamic = 'force-dynamic';

/** List draft summaries for the signed-in user. */
export async function GET() {
  await runMigrations();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in to list drafts.' }, { status: 401 });
  }

  const result = await listDrafts(userId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message, drafts: [] });
  }

  return NextResponse.json({ ok: true, drafts: result.drafts });
}
