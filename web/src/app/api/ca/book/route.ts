import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getEntitlement, hasCaAccess } from '@/lib/billing/entitlements';
import { bookSlot, listOpenSlots, setCaFilingStatus } from '@/lib/ca/booking';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }
  const entitlement = await getEntitlement(session.user.id);
  if (!hasCaAccess(entitlement.plan)) {
    return NextResponse.json({
      ok: false,
      message: 'CA booking requires the CA-assisted plan.',
      entitlement,
    });
  }
  const slots = await listOpenSlots();
  return NextResponse.json({
    ok: true,
    slots: slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }
  const entitlement = await getEntitlement(session.user.id);
  if (!hasCaAccess(entitlement.plan)) {
    return NextResponse.json({ ok: false, message: 'CA booking requires the CA-assisted plan.' });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON body required.' });
  }

  const payload = body as {
    slotId?: string;
    filingId?: string;
    caBrief?: string;
    action?: 'book' | 'approve' | 'changes_needed';
  };

  if (payload.action === 'approve' || payload.action === 'changes_needed') {
    if (!payload.filingId) {
      return NextResponse.json({ ok: false, message: 'filingId required.' });
    }
    await setCaFilingStatus(
      payload.filingId,
      payload.action === 'approve' ? 'approved' : 'ca_changes_needed',
    );
    return NextResponse.json({ ok: true, caStatus: payload.action === 'approve' ? 'approved' : 'ca_changes_needed' });
  }

  if (!payload.slotId) {
    return NextResponse.json({ ok: false, message: 'slotId required.' });
  }

  const email = session.user.email;
  if (!email) {
    return NextResponse.json({ ok: false, message: 'Account email required for calendar invite.' });
  }

  try {
    const booked = await bookSlot({
      userId: session.user.id,
      slotId: payload.slotId,
      filingId: payload.filingId,
      attendeeEmail: email,
      caBrief: payload.caBrief,
    });
    return NextResponse.json({
      ok: true,
      bookingId: booked.bookingId,
      startsAt: booked.startsAt.toISOString(),
      endsAt: booked.endsAt.toISOString(),
      ics: booked.ics,
      emailSent: booked.emailSent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Booking failed.';
    return NextResponse.json({ ok: false, message });
  }
}
