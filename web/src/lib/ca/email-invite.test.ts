import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendCaIcsInvite } from '@/lib/ca/email-invite';

describe('sendCaIcsInvite', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('no-ops when AUTH_EMAIL_SERVER is unset', async () => {
    vi.stubEnv('AUTH_EMAIL_SERVER', '');
    const result = await sendCaIcsInvite({
      to: 'filer@example.com',
      ics: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR',
      startsAt: new Date('2026-08-10T10:00:00Z'),
      endsAt: new Date('2026-08-10T10:45:00Z'),
    });
    expect(result.sent).toBe(false);
    if (result.sent) return;
    expect(result.reason).toMatch(/AUTH_EMAIL_SERVER/i);
  });

  it('sends multipart ICS when transport is provided', async () => {
    type MailArg = {
      from: string;
      to: string;
      subject: string;
      text: string;
      attachments: Array<{
        filename: string;
        content: string;
        contentType: string;
      }>;
    };
    const calls: MailArg[] = [];
    const sendMail = async (options: MailArg) => {
      calls.push(options);
      return { messageId: 'test' };
    };
    const result = await sendCaIcsInvite({
      to: 'filer@example.com',
      ics: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR',
      startsAt: new Date('2026-08-10T10:00:00Z'),
      endsAt: new Date('2026-08-10T10:45:00Z'),
      caBrief: 'NRI with Schedule FA questions.',
      sendMail,
    });
    expect(result).toEqual({ sent: true });
    expect(calls).toHaveLength(1);
    const arg = calls[0]!;
    expect(arg.to).toBe('filer@example.com');
    expect(arg.subject).toMatch(/CA review/i);
    expect(arg.text).toMatch(/Schedule FA/);
    expect(arg.attachments[0]?.filename).toBe('nritax-ca-review.ics');
    expect(arg.attachments[0]?.contentType).toMatch(/text\/calendar/);
  });

  it('soft-fails send errors', async () => {
    const sendMail = async () => {
      throw new Error('SMTP down');
    };
    const result = await sendCaIcsInvite({
      to: 'filer@example.com',
      ics: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR',
      startsAt: new Date('2026-08-10T10:00:00Z'),
      endsAt: new Date('2026-08-10T10:45:00Z'),
      sendMail,
    });
    expect(result.sent).toBe(false);
    if (result.sent) return;
    expect(result.reason).toMatch(/SMTP down/);
  });
});
