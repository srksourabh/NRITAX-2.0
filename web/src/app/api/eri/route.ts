import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getEntitlement, hasPaidAccess } from '@/lib/billing/entitlements';
import { getEriProvider } from '@/lib/eri';
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
  };

  const provider = getEriProvider();

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
      return NextResponse.json({ ok: true, consent, provider: provider.name });
    }

    if (payload.action === 'upload') {
      const data = payload.data;
      const consentId = payload.consentId;
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
      return NextResponse.json({ ok: true, upload: result, provider: provider.name });
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
      return NextResponse.json({ ok: true, status, provider: provider.name });
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
