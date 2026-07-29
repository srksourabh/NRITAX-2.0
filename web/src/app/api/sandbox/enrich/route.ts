import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { applyIdentityToReturn } from '@/lib/sandbox/apply-identity';
import { applyIfscToReturn } from '@/lib/sandbox/apply-ifsc';
import { createSandboxClient } from '@/lib/sandbox/client';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * Collects minimum identity (+ optional IFSC), writes into the return, then
 * verifies via Sandbox KYC with response cache enabled. Soft JSON except 401.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to fetch Sandbox enrichment.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      data?: ReturnData;
      pan?: unknown;
      fullName?: unknown;
      dateOfBirth?: unknown;
      aadhaar?: unknown;
      ifsc?: unknown;
      consent?: unknown;
    };

    if (!body.data || typeof body.data !== 'object') {
      return NextResponse.json({
        ok: false,
        message: 'A return draft is required, or enter particulars by hand.',
      });
    }

    if (body.consent !== true && body.consent !== 'Y' && body.consent !== 'y') {
      return NextResponse.json({
        ok: false,
        message: 'Confirm consent to verify identity against Sandbox KYC, or enter details by hand.',
      });
    }

    const pan = String(body.pan ?? '').trim().toUpperCase();
    const fullName = String(body.fullName ?? '').trim();
    const dateOfBirth = String(body.dateOfBirth ?? '').trim();
    const aadhaar = String(body.aadhaar ?? '').trim();
    const ifsc = String(body.ifsc ?? '').trim().toUpperCase();

    if (!pan || !PAN_RE.test(pan)) {
      return NextResponse.json({
        ok: false,
        message: 'Enter a valid 10-character PAN, for example ABCDE1234F.',
      });
    }
    if (fullName.trim().length < 2) {
      return NextResponse.json({
        ok: false,
        message: 'Enter the full name as printed on the PAN card.',
      });
    }
    if (!dateOfBirth) {
      return NextResponse.json({
        ok: false,
        message: 'Enter the date of birth linked to the PAN.',
      });
    }

    const form = body.data.meta.form;
    let next = body.data;
    const appliedKeys: string[] = [];
    const skippedKeys: string[] = [];
    const notices: string[] = [];

    const identityApplied = applyIdentityToReturn(
      next,
      {
        pan,
        fullName,
        dateOfBirth,
        aadhaar: aadhaar || undefined,
      },
      form,
      { overwrite: true },
    );
    next = identityApplied.data;
    appliedKeys.push(...identityApplied.fieldsApplied);
    skippedKeys.push(...identityApplied.skipped);

    const sandbox = createSandboxClient();
    const verify = await sandbox.verifyPan({
      pan,
      name: fullName,
      dateOfBirth,
    });

    if (!verify.ok) {
      return NextResponse.json({
        ok: false,
        code: verify.code,
        message: verify.message,
        data: next,
        fieldsApplied: appliedKeys,
      });
    }

    notices.push(
      verify.status === 'valid'
        ? 'PAN verified against the department.'
        : `PAN check completed${verify.status ? ` (${verify.status})` : ''}.`,
    );
    if (verify.nameMatch === false) notices.push('Name did not match PAN records.');
    if (verify.dobMatch === false) notices.push('Date of birth did not match PAN records.');
    if (verify.aadhaarSeedingStatus) {
      notices.push(
        /^y/i.test(verify.aadhaarSeedingStatus)
          ? 'Aadhaar seeding status: linked.'
          : `Aadhaar seeding status: ${verify.aadhaarSeedingStatus}.`,
      );
    }

    const link = await sandbox.panAadhaarLink({
      pan,
      aadhaar: aadhaar || undefined,
    });
    if (link.ok) {
      notices.push(
        link.message ??
          (link.linked ? 'PAN is linked to Aadhaar.' : 'PAN–Aadhaar link not confirmed.'),
      );
    } else if (link.message) {
      notices.push(link.message);
    }

    let ifscResult = null;
    if (ifsc) {
      const lookedUp = await sandbox.lookupIfsc(ifsc);
      if (lookedUp.ok) {
        const bankApplied = applyIfscToReturn(next, lookedUp, form, { overwrite: true });
        next = bankApplied.data;
        appliedKeys.push(...bankApplied.fieldsApplied);
        skippedKeys.push(...bankApplied.skipped);
        ifscResult = lookedUp;
        notices.push(
          lookedUp.bank
            ? `IFSC filled · ${lookedUp.bank}${lookedUp.branch ? ` · ${lookedUp.branch}` : ''}`
            : 'IFSC looked up and written to bank details.',
        );
      } else {
        notices.push(lookedUp.message);
      }
    }

    return NextResponse.json({
      ok: true,
      data: next,
      fieldsApplied: appliedKeys,
      skipped: skippedKeys,
      verify,
      ifsc: ifscResult,
      message: `${notices.join(' · ')} Review Part A and bank details by hand.`,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'Sandbox enrichment is unavailable right now. Enter details by hand.',
    });
  }
}
