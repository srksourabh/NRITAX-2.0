import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import {
  applyDigilockerToReturn,
  mergeDigilockerIdentity,
} from '@/lib/sandbox/apply-digilocker';
import { createSandboxClient } from '@/lib/sandbox/client';
import type { DigilockerIdentity } from '@/lib/sandbox/types';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

const SUCCESS_STATUSES = new Set([
  'succeeded',
  'success',
  'completed',
  'authenticated',
  'ready',
]);

/**
 * Fetch DigiLocker PAN + Aadhaar docs for a finished session and map blank GEN
 * fields. Soft JSON except 401. Never persists document bytes.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to apply DigiLocker details.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      data?: ReturnData;
    };
    const sessionId = String(body.sessionId ?? '').trim();
    const data = body.data;

    if (!sessionId || !data?.meta || !data.fields || !data.tables) {
      return NextResponse.json({
        ok: false,
        message: 'Provide sessionId and the current return data.',
      });
    }

    const client = createSandboxClient();
    const status = await client.digilockerStatus(sessionId);
    if (!status.ok) {
      return NextResponse.json({ ok: false, message: status.message, code: status.code });
    }

    if (!SUCCESS_STATUSES.has(status.status.toLowerCase())) {
      return NextResponse.json({
        ok: false,
        message: `DigiLocker session is still "${status.status}". Finish sign-in, then apply again.`,
        status: status.status,
      });
    }

    const [panDoc, aadhaarDoc] = await Promise.all([
      client.fetchDigilockerDocument({ sessionId, docType: 'pan' }),
      client.fetchDigilockerDocument({ sessionId, docType: 'aadhaar' }),
    ]);

    const parts: DigilockerIdentity[] = [];
    if (panDoc.ok && panDoc.identity) parts.push(panDoc.identity);
    if (aadhaarDoc.ok && aadhaarDoc.identity) parts.push(aadhaarDoc.identity);

    const identity = mergeDigilockerIdentity(...parts);
    if (
      !identity.pan &&
      !identity.aadhaar &&
      !identity.fullName &&
      !identity.firstName &&
      !identity.dateOfBirth
    ) {
      return NextResponse.json({
        ok: false,
        message:
          'DigiLocker documents did not yield name, PAN, or Aadhaar fields. Enter identity details by hand.',
      });
    }

    const applied = applyDigilockerToReturn(data, identity, data.meta.form);
    return NextResponse.json({
      ok: true,
      data: applied.data,
      fieldsApplied: applied.fieldsApplied,
      skipped: applied.skipped,
      message:
        applied.fieldsApplied.length > 0
          ? `Applied ${applied.fieldsApplied.length} field(s) from DigiLocker.`
          : 'DigiLocker had nothing new to fill — those fields were already set.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'DigiLocker apply is unavailable right now. Enter identity details by hand.',
    });
  }
}
