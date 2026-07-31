/**
 * Soft-fail ICS invite email for CA bookings.
 * No-op when AUTH_EMAIL_SERVER is unset — download path remains.
 */

import nodemailer from 'nodemailer';

export type SendCaIcsInviteInput = {
  to: string;
  ics: string;
  startsAt: Date;
  endsAt: Date;
  caBrief?: string;
  /** Injected for tests. */
  sendMail?: (options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    attachments: Array<{
      filename: string;
      content: string;
      contentType: string;
    }>;
  }) => Promise<unknown>;
};

export type SendCaIcsInviteResult =
  | { sent: true }
  | { sent: false; reason: string };

function formatWhen(d: Date): string {
  try {
    return d.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return d.toISOString();
  }
}

export async function sendCaIcsInvite(
  input: SendCaIcsInviteInput,
): Promise<SendCaIcsInviteResult> {
  const server = process.env.AUTH_EMAIL_SERVER?.trim();
  if (!server && !input.sendMail) {
    return { sent: false, reason: 'AUTH_EMAIL_SERVER unset' };
  }

  const from =
    process.env.AUTH_EMAIL_FROM?.trim() || 'NRITAX 2.0 <ca@nritax.app>';
  const to = input.to.trim();
  if (!to || !to.includes('@')) {
    return { sent: false, reason: 'Attendee email missing' };
  }

  const brief = input.caBrief?.trim();
  const text = [
    'Your NRITAX 2.0 CA review call is booked.',
    '',
    `When: ${formatWhen(input.startsAt)} – ${formatWhen(input.endsAt)} (Asia/Kolkata).`,
    '',
    brief ? `Brief for the CA:\n${brief.slice(0, 1500)}` : 'Bring Form 16 / 26AS / AIS if asked.',
    '',
    'A calendar invite (.ics) is attached. Add it to your calendar.',
  ].join('\n');

  const mail = {
    from,
    to,
    subject: 'NRITAX 2.0 CA review call',
    text,
    attachments: [
      {
        filename: 'nritax-ca-review.ics',
        content: input.ics,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  };

  try {
    if (input.sendMail) {
      await input.sendMail(mail);
    } else {
      const transport = nodemailer.createTransport(server);
      await transport.sendMail({
        ...mail,
        icalEvent: {
          method: 'REQUEST',
          content: input.ics,
        },
      });
    }
    return { sent: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Send failed';
    return { sent: false, reason };
  }
}
