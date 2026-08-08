/**
 * portal-fetch worker — ephemeral ITD prefill download via Browserbase/Playwright.
 *
 * Auth: header X-Portal-Fetch-Token must match PORTAL_FETCH_SECRET.
 * Mock: PORTAL_FETCH_MOCK=1 or missing BROWSERBASE_* keys.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { listenPort, portalFetchToken, useMockMode } from './config.js';
import { resumeAfterLive, resumeAfterOtp, startPrefetch } from './runner.js';
import { store } from './store.js';

const TOKEN = portalFetchToken();

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function unauthorized(res: ServerResponse) {
  json(res, 401, { ok: false, message: 'Unauthorized.' });
}

function requireToken(req: IncomingMessage, res: ServerResponse): boolean {
  if (!TOKEN) {
    json(res, 503, {
      ok: false,
      message: 'PORTAL_FETCH_SECRET is not set on the worker.',
    });
    return false;
  }
  const got = req.headers['x-portal-fetch-token'];
  if (got !== TOKEN) {
    unauthorized(res);
    return false;
  }
  return true;
}

function pathParts(url: string): string[] {
  const path = url.split('?')[0] ?? '';
  return path.split('/').filter(Boolean);
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const method = req.method ?? 'GET';
  const parts = pathParts(req.url ?? '/');

  if (method === 'GET' && parts.length === 1 && parts[0] === 'health') {
    json(res, 200, {
      status: 'ok',
      mock: useMockMode(),
    });
    return;
  }

  if (!requireToken(req, res)) return;

  // POST /jobs
  if (method === 'POST' && parts.length === 1 && parts[0] === 'jobs') {
    let body: Record<string, unknown>;
    try {
      body = (await readBody(req)) as Record<string, unknown>;
    } catch {
      json(res, 400, { ok: false, message: 'Invalid JSON body.' });
      return;
    }

    const pan = String(body.pan ?? '')
      .trim()
      .toUpperCase();
    const name = String(body.name ?? '').trim() || 'TAXPAYER';
    const dob = String(body.dob ?? '').trim();
    const password = String(body.password ?? '');
    const mobile = String(body.mobile ?? '').replace(/\D/g, '');
    const assessmentYear = String(body.assessmentYear ?? '2026-27').trim();
    const formType = String(body.formType ?? 'ITR2').toUpperCase() === 'ITR3' ? 'ITR3' : 'ITR2';
    // Always offline original + non-political — client cannot override.
    const politicallyExposed = false;
    const filingType = 'original' as const;
    const userId = String(body.userId ?? 'unknown');

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      json(res, 400, { ok: false, message: 'Enter a valid PAN.' });
      return;
    }
    if (!password) {
      json(res, 400, {
        ok: false,
        message: 'PAN and portal password are required.',
      });
      return;
    }

    const job = store.create({
      userId,
      pan,
      name,
      dob: dob || '',
      mobile,
      password,
      assessmentYear,
      formType,
      politicallyExposed,
      filingType,
    });
    startPrefetch(job.id);
    json(res, 200, store.toPublic(job));
    return;
  }

  // GET /jobs/:id
  if (method === 'GET' && parts.length === 2 && parts[0] === 'jobs') {
    const job = store.get(parts[1]!);
    if (!job) {
      json(res, 404, { ok: false, message: 'Job not found.' });
      return;
    }
    json(res, 200, store.toPublic(job));
    return;
  }

  // POST /jobs/:id/otp
  if (
    method === 'POST' &&
    parts.length === 3 &&
    parts[0] === 'jobs' &&
    parts[2] === 'otp'
  ) {
    let body: Record<string, unknown>;
    try {
      body = (await readBody(req)) as Record<string, unknown>;
    } catch {
      json(res, 400, { ok: false, message: 'Invalid JSON body.' });
      return;
    }
    const otp = String(body.otp ?? '').trim();
    if (!/^\d{4,8}$/.test(otp)) {
      json(res, 400, { ok: false, message: 'Enter a valid OTP.' });
      return;
    }
    const job = store.setOtp(parts[1]!, otp);
    if (!job) {
      json(res, 400, {
        ok: false,
        message: 'Job is not awaiting OTP.',
      });
      return;
    }
    resumeAfterOtp(job.id);
    json(res, 200, store.toPublic(job));
    return;
  }

  // POST /jobs/:id/live — escalate / refresh live URL
  if (
    method === 'POST' &&
    parts.length === 3 &&
    parts[0] === 'jobs' &&
    parts[2] === 'live'
  ) {
    const job = store.get(parts[1]!);
    if (!job) {
      json(res, 404, { ok: false, message: 'Job not found.' });
      return;
    }
    const updated =
      job.status === 'needs_live_assist'
        ? store.patch(job.id, {
            message:
              job.message ||
              'Open live assist, finish login, then click Done.',
          })
        : store.apply(job.id, { type: 'NEED_LIVE_ASSIST' }, {
            message:
              'Open live assist, finish login on the portal, then click Done.',
            liveViewUrl:
              job.liveViewUrl || 'https://www.browserbase.com/overview',
          });
    if (!updated) {
      json(res, 400, {
        ok: false,
        message: 'Cannot open live assist for this job state.',
      });
      return;
    }
    json(res, 200, store.toPublic(updated));
    return;
  }

  // POST /jobs/:id/live-done
  if (
    method === 'POST' &&
    parts.length === 3 &&
    parts[0] === 'jobs' &&
    parts[2] === 'live-done'
  ) {
    const job = store.get(parts[1]!);
    if (!job) {
      json(res, 404, { ok: false, message: 'Job not found.' });
      return;
    }
    if (job.status !== 'needs_live_assist') {
      json(res, 400, {
        ok: false,
        message: 'Job is not waiting for live assist.',
      });
      return;
    }
    resumeAfterLive(job.id);
    const latest = store.get(job.id) ?? job;
    json(res, 200, store.toPublic(latest));
    return;
  }

  json(res, 404, { ok: false, message: 'Not found.' });
}

if (!TOKEN) {
  console.error('PORTAL_FETCH_SECRET is required');
  process.exit(1);
}

const port = listenPort();
createServer((req, res) => {
  void handle(req, res).catch(() => {
    json(res, 500, { ok: false, message: 'Internal error.' });
  });
}).listen(port, () => {
  console.log(
    `portal-fetch listening on :${port} mock=${useMockMode() ? '1' : '0'}`,
  );
});
