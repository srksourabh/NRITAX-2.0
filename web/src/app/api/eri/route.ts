import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getEntitlement, hasPaidAccess } from '@/lib/billing/entitlements';
import { getEriProvider } from '@/lib/eri';
import {
  loadEriConsentId,
  persistEriConsentId,
} from '@/lib/eri/consent-persist';
import type { ConsentRequest } from '@/lib/eri/types';
import { buildReturnJson } from '@/lib/itr/build-json';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

function panFrom(data: ReturnData): string {
  return String(data.fields['GEN.pan'] ?? data.fields['GEN.PAN'] ?? '')
    .trim()
    .toUpperCase();
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  const entitlement = await getEntitlement(session.user.id);
  if (!hasPaidAccess(entitlement.plan)) {
    return NextResponse.json({
      ok: false,
      message: 'ERI submit requires a paid plan. Download JSON remains free.',
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON body required.' });
  }

  const payload = body as {
    action?: 'consent' | 'upload' | 'status';
    data?: ReturnData;
    consentId?: string;
    acknowledgementNumber?: string;
    filingId?: string;
  };

  const provider = getEriProvider();
  const filingId =
    typeof payload.filingId === 'string' ? payload.filingId.trim() : '';

  try {
    if (payload.action === 'consent') {
      const data = payload.data;
      if (!data?.meta) {
        return NextResponse.json({ ok: false, message: 'data required for consent.' });
      }
      const pan = panFrom(data);
      if (!pan) {
        return NextResponse.json({ ok: false, message: 'PAN required in Part A.' });
      }
      const consentReq: ConsentRequest = {
        pan,
        assessmentYear: data.meta.assessmentYear,
        name: String(data.fields['GEN.name'] ?? data.fields['GEN.surName'] ?? 'Taxpayer'),
        dateOfBirth: data.meta.dateOfBirth || String(data.fields['GEN.dob'] ?? '1990-01-01'),
        email: session.user.email || 'taxpayer@example.com',
        mobile: String(data.fields['GEN.mobile'] ?? ''),
        returnUrl: `${new URL(req.url).origin}/filing`,
      };
      const consent = await provider.requestConsent(consentReq);
      const warnings: string[] = [];
      if (filingId) {
        const persisted = await persistEriConsentId(filingId, consent.consentId);
        if (!persisted.ok) warnings.push(persisted.warning);
      }
      return NextResponse.json({
        ok: true,
        consent,
        provider: provider.name,
        ...(warnings.length ? { warnings } : {}),
      });
    }

    if (payload.action === 'upload') {
      const data = payload.data;
      let consentId =
        typeof payload.consentId === 'string' ? payload.consentId.trim() : '';
      if (!consentId && filingId) {
        const loaded = await loadEriConsentId(filingId);
        if (loaded.ok && loaded.consentId) consentId = loaded.consentId;
      }
      if (!data?.meta || !consentId) {
        return NextResponse.json({ ok: false, message: 'data and consentId required.' });
      }
      const built = buildReturnJson(data);
      const pan = panFrom(data);
      const result = await provider.uploadReturn({
        pan,
        consentId,
        assessmentYear: data.meta.assessmentYear,
        form: data.meta.form,
        json: built.json,
      });
      const warnings: string[] = [];
      if (filingId) {
        const persisted = await persistEriConsentId(filingId, consentId);
        if (!persisted.ok) warnings.push(persisted.warning);
      }
      return NextResponse.json({
        ok: true,
        upload: result,
        provider: provider.name,
        consentId,
        ...(warnings.length ? { warnings } : {}),
      });
    }

    if (payload.action === 'status') {
      const acknowledgementNumber = payload.acknowledgementNumber;
      const data = payload.data;
      if (!acknowledgementNumber || !data) {
        return NextResponse.json({
          ok: false,
          message: 'acknowledgementNumber and data (for PAN) required.',
        });
      }
      const status = await provider.getFilingStatus({
        pan: panFrom(data),
        acknowledgementNumber,
      });
      let eriConsentId: string | null = null;
      if (filingId) {
        const loaded = await loadEriConsentId(filingId);
        if (loaded.ok) eriConsentId = loaded.consentId;
      }
      return NextResponse.json({
        ok: true,
        status,
        provider: provider.name,
        ...(eriConsentId ? { eriConsentId } : {}),
      });
    }

    return NextResponse.json({
      ok: false,
      message: 'action must be consent, upload, or status.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ERI call failed.';
    return NextResponse.json({ ok: false, message });
  }
}
