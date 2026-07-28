/**
 * CA booking — slots, ICS invite, filing status.
 */

import { and, eq, gte } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { caBookings, caSlots, filings } from '@/lib/db/schema';

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
    'PRODID:-//NRITAX//CA Booking//EN',
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
  const db = getDb();
  const soon = new Date();
  soon.setUTCDate(soon.getUTCDate() + 2);
  soon.setUTCHours(10, 0, 0, 0);

  const existing = await db
    .select()
    .from(caSlots)
    .where(gte(caSlots.startsAt, new Date()))
    .limit(1);
  if (existing.length > 0) return;

  for (let i = 0; i < 5; i++) {
    const startsAt = new Date(soon);
    startsAt.setUTCDate(soon.getUTCDate() + i);
    const endsAt = new Date(startsAt);
    endsAt.setUTCMinutes(endsAt.getUTCMinutes() + 45);
    await db.insert(caSlots).values({
      startsAt,
      endsAt,
      capacity: 1,
      reserved: 0,
    });
  }
}

export async function listOpenSlots() {
  const db = getDb();
  await ensureDemoSlots();
  const rows = await db
    .select()
    .from(caSlots)
    .where(gte(caSlots.startsAt, new Date()));
  return rows.filter((s) => s.reserved < s.capacity);
}

export async function bookSlot(input: {
  userId: string;
  filingId?: string;
  slotId: string;
  attendeeEmail: string;
  caBrief?: string;
}): Promise<{ bookingId: string; ics: string; startsAt: Date; endsAt: Date }> {
  const db = getDb();
  const slots = await db.select().from(caSlots).where(eq(caSlots.id, input.slotId)).limit(1);
  const slot = slots[0];
  if (!slot) throw new Error('Slot not found.');
  if (slot.reserved >= slot.capacity) throw new Error('Slot is full.');

  await db
    .update(caSlots)
    .set({ reserved: slot.reserved + 1 })
    .where(and(eq(caSlots.id, slot.id), eq(caSlots.reserved, slot.reserved)));

  const bookingId = crypto.randomUUID();
  await db.insert(caBookings).values({
    id: bookingId,
    userId: input.userId,
    filingId: input.filingId,
    slotId: slot.id,
    status: 'scheduled',
    attendeeEmail: input.attendeeEmail,
    caBrief: input.caBrief,
  });

  if (input.filingId) {
    await db
      .update(filings)
      .set({ caStatus: 'scheduled', updatedAt: new Date() })
      .where(eq(filings.id, input.filingId));
  }

  const organizer = process.env.AUTH_EMAIL_FROM?.trim() || 'ca@nritax.app';
  const ics = buildIcsInvite({
    uid: `${bookingId}@nritax.app`,
    title: 'NRITAX CA review call',
    description:
      input.caBrief?.slice(0, 1500) ||
      'CA review of your NRITAX draft return. Bring Form 16 / 26AS / AIS if asked.',
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    organizerEmail: organizer.replace(/.*<|>.*/g, '') || 'ca@nritax.app',
    attendeeEmail: input.attendeeEmail,
  });

  return { bookingId, ics, startsAt: slot.startsAt, endsAt: slot.endsAt };
}

export async function setCaFilingStatus(
  filingId: string,
  status: CaBookingStatus,
): Promise<void> {
  const db = getDb();
  await db
    .update(filings)
    .set({ caStatus: status, updatedAt: new Date() })
    .where(eq(filings.id, filingId));
}
