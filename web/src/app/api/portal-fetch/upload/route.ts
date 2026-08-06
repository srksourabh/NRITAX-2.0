import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

/**
 * Portal JSON upload via browser automation.
 * Soft-fails when the worker is down or has no upload route — UI falls back to manual upload.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to file on the portal.' },
      { status: 401 },
    );
  }

  let body: {
    pan?: string;
    password?: string;
    mobile?: string;
    assessmentYear?: string;
    consentUpload?: boolean;
    returnJson?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.consentUpload) {
    return NextResponse.json(
      { ok: false, message: 'Confirm consent to upload via browser automation.' },
      { status: 400 },
    );
  }

  const pan = String(body.pan ?? '')
    .trim()
    .toUpperCase();
  const password = String(body.password ?? '');
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan) || !password) {
    return NextResponse.json(
      {
        ok: false,
        message: 'PAN and portal password are required for upload automation.',
      },
      { status: 400 },
    );
  }
  if (body.returnJson == null) {
    return NextResponse.json({ ok: false, message: 'Return JSON is required.' }, { status: 400 });
  }

  const client = createPortalFetchClient();
  const healthy = await client.checkHealth();
  if (!healthy) {
    return NextResponse.json(
      {
        ok: false,
        code: 'WORKER_DOWN',
        message:
          'Portal upload automation is offline. Download the JSON and upload it on the Income Tax e-Filing portal (e-File → Upload JSON).',
      },
      { status: 503 },
    );
  }

  // Prefer a dedicated upload endpoint when the worker exposes it.
  try {
    const baseUrl = (process.env.PORTAL_FETCH_URL ?? '').replace(/\/+$/, '');
    const token = process.env.PORTAL_FETCH_SECRET ?? '';
    if (!baseUrl || !token) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UPLOAD_UNSUPPORTED',
          message:
            'Upload automation is not configured. Download JSON and upload manually on the e-Filing portal.',
        },
        { status: 501 },
      );
    }

    const res = await fetch(`${baseUrl}/jobs/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Portal-Fetch-Token': token,
      },
      body: JSON.stringify({
        userId: session.user.id ?? session.user.email ?? 'user',
        pan,
        password,
        mobile: body.mobile,
        assessmentYear: body.assessmentYear ?? '2026-27',
        returnJson: body.returnJson,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.status === 404 || res.status === 501) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UPLOAD_UNSUPPORTED',
          message:
            'Upload automation is not available yet on this worker. Download JSON and upload manually — prefill fetch still works.',
        },
        { status: 501 },
      );
    }

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || json.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          message:
            typeof json.message === 'string'
              ? json.message
              : 'Upload job failed. Download JSON and upload manually.',
        },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    return NextResponse.json({ ok: true, ...json });
  } catch (error) {
    const timedOut =
      (error instanceof Error && error.name === 'TimeoutError') ||
      (error instanceof DOMException && error.name === 'TimeoutError');
    return NextResponse.json(
      {
        ok: false,
        code: timedOut ? 'UPLOAD_TIMEOUT' : 'WORKER_DOWN',
        message: timedOut
          ? 'The upload job did not start in time. Try again, or download the JSON and upload it manually on the e-Filing portal.'
          : 'Portal upload automation is unreachable. Download the JSON and upload it manually on the e-Filing portal.',
      },
      { status: timedOut ? 504 : 503 },
    );
  }
}
