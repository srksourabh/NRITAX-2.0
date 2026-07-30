/**
 * CA booking — slots, ICS invite, filing status.
 */

import { getServiceClient } from '@/lib/db/client';

export type CaBookingStatus =
  | 'requested'
  | 'scheduled'
  | 'ca_changes_needed'
  | 'approved'
  | 'cancelled';

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildIcsInvite(input: {
  uid: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  organizerEmail: string;
  attendeeEmail: string;
}): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NRITAX 2.0//CA Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(input.startsAt)}`,
    `DTEND:${formatIcsDate(input.endsAt)}`,
    `SUMMARY:${input.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${input.description.replace(/\n/g, '\\n')}`,
    `ORGANIZER:mailto:${input.organizerEmail}`,
    `ATTENDEE:mailto:${input.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

/** Ensure a few future slots exist for demo / local booking. */
export async function ensureDemoSlots(): Promise<void> {
  const db = getServiceClient();
  const { data: existing } = await db
    .from('ca_slot')
    .select('id')
    .gte('startsAt', new Date().toISOString())
    .limit(1);

  if (existing && existing.length > 0) return;

  const soon = new Date();
  soon.setUTCDate(soon.getUTCDate() + 2);
  soon.setUTCHours(10, 0, 0, 0);

  const inserts = Array.from({ length: 5 }, (_, i) => {
    const startsAt = new Date(soon);
    startsAt.setUTCDate(soon.getUTCDate() + i);
    const endsAt = new Date(startsAt);
    endsAt.setUTCMinutes(endsAt.getUTCMinutes() + 45);
    return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), capacity: 1, reserved: 0 };
  });

  await db.from('ca_slot').insert(inserts);
}

export async function listOpenSlots() {
  const db = getServiceClient();
  await ensureDemoSlots();
  const { data: rows } = await db
    .from('ca_slot')
    .select('*')
    .gte('startsAt', new Date().toISOString())
    .order('startsAt', { ascending: true });

  return (rows ?? []).filter((s) => s.reserved < s.capacity).map((s) => ({
    ...s,
    startsAt: new Date(s.startsAt),
    endsAt: new Date(s.endsAt),
  }));
}

export async function bookSlot(input: {
  userId: string;
  filingId?: string;
  slotId: string;
  attendeeEmail: string;
  caBrief?: string;
}): Promise<{ bookingId: string; ics: string; startsAt: Date; endsAt: Date }> {
  const db = getServiceClient();

  const { data: slots } = await db.from('ca_slot').select('*').eq('id', input.slotId).limit(1);
  const slot = slots?.[0];
  if (!slot) throw new Error('Slot not found.');
  if (slot.reserved >= slot.capacity) throw new Error('Slot is full.');

  await db
    .from('ca_slot')
    .update({ reserved: slot.reserved + 1 })
    .eq('id', slot.id)
    .eq('reserved', slot.reserved);

  const bookingId = crypto.randomUUID();
  await db.from('ca_booking').insert({
    id: bookingId,
    userId: input.userId,
    filingId: input.filingId ?? null,
    slotId: slot.id,
    status: 'scheduled',
    attendeeEmail: input.attendeeEmail,
    caBrief: input.caBrief ?? null,
  });

  if (input.filingId) {
    await db
      .from('filing')
      .update({ caStatus: 'scheduled', updatedAt: new Date().toISOString() })
      .eq('id', input.filingId);
  }

  const organizer = process.env.AUTH_EMAIL_FROM?.trim() || 'ca@nritax.app';
  const ics = buildIcsInvite({
    uid: `${bookingId}@nritax.app`,
    title: 'NRITAX 2.0 CA review call',
    description:
      input.caBrief?.slice(0, 1500) ||
      'CA review of your NRITAX 2.0 draft return. Bring Form 16 / 26AS / AIS if asked.',
    startsAt: new Date(slot.startsAt),
    endsAt: new Date(slot.endsAt),
    organizerEmail: organizer.replace(/.*<|>.*/g, '') || 'ca@nritax.app',
    attendeeEmail: input.attendeeEmail,
  });

  return { bookingId, ics, startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt) };
}

export async function setCaFilingStatus(
  filingId: string,
  status: CaBookingStatus,
): Promise<void> {
  const db = getServiceClient();
  await db
    .from('filing')
    .update({ caStatus: status, updatedAt: new Date().toISOString() })
    .eq('id', filingId);
}
