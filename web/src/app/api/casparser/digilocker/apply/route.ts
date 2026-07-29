import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';
import { toDigilockerIdentity } from '@/lib/casparser/map-identity';
import { applyDigilockerToReturn } from '@/lib/sandbox/apply-digilocker';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

/**
 * Read DigiLocker result, optional PAN KYC status, write blank Part A fields.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to apply DigiLocker.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: unknown;
      data?: unknown;
    };
    const sessionId =
      typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const data = body.data as ReturnData | undefined;
    if (!sessionId || !data || typeof data !== 'object' || !data.meta) {
      return NextResponse.json({
        ok: false,
        message: 'Missing DigiLocker session or return data.',
      });
    }

    const client = createCasparserClient();
    const result = await client.digilockerResult({
      sessionId,
      fetchDocuments: ['pan', 'aadhaar'],
    });
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        message: result.message,
        code: result.code,
      });
    }

    const identity = toDigilockerIdentity({
      identity: result.identity,
      fetchedPan: result.fetchedPan,
    });
    const applied = applyDigilockerToReturn(data, identity);

    let panStatus: {
      kycCompliant?: boolean;
      kycStatus?: string;
      activeKra?: string | null;
    } | null = null;
    const pan = identity.pan;
    if (pan) {
      const status = await client.panKycStatus(pan);
      if (status.ok) {
        panStatus = {
          kycCompliant: status.kycCompliant,
          kycStatus: status.kycStatus,
          activeKra: status.activeKra,
        };
      }
    }

    const statusBit = panStatus
      ? ` · PAN KYC ${panStatus.kycStatus}${panStatus.kycCompliant ? ' (compliant)' : ''}`
      : '';

    return NextResponse.json({
      ok: true,
      data: applied.data,
      fieldsApplied: applied.fieldsApplied,
      skipped: applied.skipped,
      identity,
      panStatus,
      mock: Boolean(result.mock),
      message: `DigiLocker · ${applied.fieldsApplied.length} fields written${statusBit}. Review Part A by hand.`,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'Could not apply DigiLocker. Enter identity by hand.',
    });
  }
}
