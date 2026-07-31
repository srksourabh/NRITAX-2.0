import { describe, expect, it, vi } from 'vitest';

import { createCasparserClient } from '@/lib/casparser/client';

describe('createCasparserClient inbox', () => {
  it('soft-fails connect without API key', async () => {
    const client = createCasparserClient({
      apiKey: '',
      digilockerMock: false,
      fetch: vi.fn(),
    });
    const result = await client.inboxConnect({
      redirectUri: 'https://example.com/api/casparser/inbox/callback',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/not configured|by hand|upload/i);
  });

  it('returns oauth url from connect', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        status: 'success',
        oauth_url: 'https://accounts.google.com/o/oauth2?x=1',
        expires_in: 600,
      }),
    );
    const client = createCasparserClient({
      apiKey: 'test-key',
      digilockerMock: false,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const result = await client.inboxConnect({
      redirectUri: 'https://nritax.app/api/casparser/inbox/callback',
      state: 'abc',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.oauthUrl).toMatch(/accounts\.google\.com/);
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(call[1].body))).toEqual({
      redirect_uri: 'https://nritax.app/api/casparser/inbox/callback',
      state: 'abc',
    });
  });

  it('lists CAS files with inbox token header', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        status: 'success',
        files: [
          {
            message_id: 'm1',
            filename: 'cams_20260401.pdf',
            url: 'https://cdn.example/cas.pdf',
            cas_type: 'cams',
            message_date: '2026-04-02',
          },
        ],
        count: 1,
      }),
    );
    const client = createCasparserClient({
      apiKey: 'test-key',
      digilockerMock: false,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const result = await client.inboxListCas({ inboxToken: 'tok_abc' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.url).toBe('https://cdn.example/cas.pdf');
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = call[1].headers as Record<string, string>;
    expect(headers['x-inbox-token']).toBe('tok_abc');
  });

  it('disconnects with inbox token header', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ status: 'success', msg: 'revoked' }),
    );
    const client = createCasparserClient({
      apiKey: 'test-key',
      digilockerMock: false,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const result = await client.inboxDisconnect('tok_abc');
    expect(result).toEqual({ ok: true, message: 'revoked' });
  });
});
