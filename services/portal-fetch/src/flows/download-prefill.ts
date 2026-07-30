import Browserbase from '@browserbasehq/sdk';
import { chromium, type Page } from 'playwright-core';

import {
  browserbaseApiKey,
  browserbaseProjectId,
  PORTAL_HOME,
} from '../config.js';
import type { JobRecord } from '../store.js';
import { store } from '../store.js';

const OTP_WAIT_MS = 5 * 60 * 1000;
const LIVE_WAIT_MS = 8 * 60 * 1000;
const POLL_MS = 1500;

/**
 * Mode A: headless login via Browserbase + Playwright.
 * Pauses for OTP (awaiting_otp). Escalates to Mode B on CAPTCHA/hard fail.
 * Selectors are best-effort — portal churn falls back to live assist or fail.
 */
export async function runBrowserbasePrefill(jobId: string): Promise<void> {
  const job = store.get(jobId);
  if (!job?.secrets) return;

  store.apply(jobId, { type: 'START_LOGIN' }, {
    message: 'Opening e-Filing portal…',
  });

  const bb = new Browserbase({ apiKey: browserbaseApiKey() });
  let sessionId: string | undefined;
  let browser;

  try {
    const session = await bb.sessions.create({
      projectId: browserbaseProjectId(),
      browserSettings: {
        // Prefer not retaining recordings of credential entry when supported.
        recordSession: false,
      },
    });
    sessionId = session.id;
    const liveViewUrl = debuggerUrl(session);
    store.patch(jobId, {
      message: 'Signing in…',
      liveViewUrl,
      browserbaseSessionId: sessionId,
    });

    const connectUrl = session.connectUrl;
    if (!connectUrl) {
      store.apply(jobId, { type: 'FAIL' }, {
        message: 'Browserbase session has no connect URL.',
      });
      return;
    }
    browser = await chromium.connectOverCDP(connectUrl);
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());

    await page.goto(PORTAL_HOME, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    if (await looksLikeCaptcha(page)) {
      await escalateLive(jobId, liveViewUrl, 'CAPTCHA detected. Complete login in live assist.');
      return;
    }

    const filled = await tryFillLogin(page, job);
    if (!filled) {
      await escalateLive(
        jobId,
        liveViewUrl,
        'Could not locate login fields. Complete login in live assist, then click Done.',
      );
      return;
    }

    await page.waitForTimeout(1500);

    if (await looksLikeCaptcha(page) || (await looksLikeBotWall(page))) {
      await escalateLive(jobId, liveViewUrl, 'Bot check detected. Finish login in live assist.');
      return;
    }

    if (await looksLikeBadPassword(page)) {
      store.apply(jobId, { type: 'FAIL' }, {
        message: 'Login failed. Check your portal password, or upload JSON manually.',
      });
      return;
    }

    if (await looksLikeOtp(page)) {
      store.apply(jobId, { type: 'NEED_OTP' }, {
        message: 'Enter the OTP sent to your registered mobile or email.',
        liveViewUrl,
      });
      const otp = await waitForOtp(jobId, OTP_WAIT_MS);
      if (!otp) {
        store.apply(jobId, { type: 'TIMEOUT' }, {
          message: 'OTP timed out. Retry or upload the prefill JSON manually.',
        });
        return;
      }
      store.apply(jobId, { type: 'OTP_SUBMITTED' }, {
        message: 'Submitting OTP…',
      });
      const otpOk = await tryFillOtp(page, otp);
      if (!otpOk) {
        await escalateLive(
          jobId,
          liveViewUrl,
          'Could not enter OTP automatically. Finish in live assist.',
        );
        return;
      }
      await page.waitForTimeout(2000);
    }

    if (!(await looksLoggedIn(page))) {
      if (await looksLikeCaptcha(page) || (await looksLikeBotWall(page))) {
        await escalateLive(jobId, liveViewUrl, 'Complete login in live assist, then click Done.');
        return;
      }
      store.apply(jobId, { type: 'FAIL' }, {
        message:
          'Portal login did not complete. Portal UI may have changed — upload JSON manually.',
      });
      return;
    }

    await downloadPrefill(jobId, page, job);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Portal fetch failed';
    const live = store.get(jobId)?.liveViewUrl;
    if (live && /timeout|captcha|blocked|navigation/i.test(msg)) {
      await escalateLive(
        jobId,
        live,
        'Automation stalled. Complete login in live assist, then click Done.',
      );
      return;
    }
    store.apply(jobId, { type: 'FAIL' }, {
      message:
        'Portal changed or session failed. Upload the prefill JSON manually.',
    });
  } finally {
    try {
      await browser?.close();
    } catch {
      /* ignore */
    }
  }
}

export async function continueBrowserbaseAfterLive(jobId: string): Promise<void> {
  const job = store.get(jobId);
  if (!job?.browserbaseSessionId) {
    // No live session — finish with specimen only in mock-less fail path
    store.apply(jobId, { type: 'FAIL' }, {
      message: 'Live session missing. Retry fetch or upload JSON manually.',
    });
    return;
  }

  store.apply(jobId, { type: 'LIVE_ASSIST_DONE' }, {
    message: 'Resuming prefill download…',
  });

  const bb = new Browserbase({ apiKey: browserbaseApiKey() });
  let browser;
  try {
    const session = await bb.sessions.retrieve(job.browserbaseSessionId);
    const connectUrl = session.connectUrl;
    if (!connectUrl) {
      store.apply(jobId, { type: 'FAIL' }, {
        message: 'Browserbase session has no connect URL.',
      });
      return;
    }
    browser = await chromium.connectOverCDP(connectUrl);
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());

    if (!(await looksLoggedIn(page))) {
      store.apply(jobId, { type: 'FAIL' }, {
        message:
          'Still not logged in after live assist. Retry or upload JSON manually.',
      });
      return;
    }

    const fresh = store.get(jobId);
    if (!fresh) return;
    await downloadPrefill(jobId, page, fresh);
  } catch {
    store.apply(jobId, { type: 'FAIL' }, {
      message: 'Could not resume session. Upload the prefill JSON manually.',
    });
  } finally {
    try {
      await browser?.close();
    } catch {
      /* ignore */
    }
  }
}

async function downloadPrefill(
  jobId: string,
  page: Page,
  job: JobRecord,
): Promise<void> {
  store.apply(jobId, { type: 'START_DOWNLOAD' }, {
    message: 'Downloading pre-filled JSON…',
  });

  try {
    // Best-effort navigation; portals differ by season.
    const link = page
      .getByRole('link', { name: /pre-?fill|prefill|download.*json/i })
      .first();
    if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        link.click(),
      ]);
      const path = await download.path();
      if (path) {
        const { readFile } = await import('node:fs/promises');
        const text = await readFile(path, 'utf8');
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          store.apply(jobId, { type: 'SUCCESS' }, {
            message: 'Prefill downloaded. Review every field before filing.',
            artifactJson: text,
          });
          return;
        }
      }
    }
  } catch {
    /* fall through to specimen fallback only if mock-like; else fail */
  }

  // Without a reliable download path, fail clearly rather than inventing data
  // when Browserbase is configured (real Mode A).
  store.apply(jobId, { type: 'FAIL' }, {
    message:
      'Could not download prefill JSON from the portal. Upload the file manually.',
  });
  void job;
}

async function escalateLive(
  jobId: string,
  liveViewUrl: string,
  message: string,
): Promise<void> {
  const job = store.get(jobId);
  if (!job) return;
  if (job.status === 'needs_live_assist') {
    job.message = message;
    job.liveViewUrl = liveViewUrl;
    job.updatedAt = Date.now();
    return;
  }
  store.apply(jobId, { type: 'NEED_LIVE_ASSIST' }, { message, liveViewUrl });
}

function debuggerUrl(session: { id: string; debuggerFullscreenUrl?: string }): string {
  if (session.debuggerFullscreenUrl) return session.debuggerFullscreenUrl;
  return `https://www.browserbase.com/sessions/${session.id}`;
}

async function tryFillLogin(page: Page, job: JobRecord): Promise<boolean> {
  const password = job.secrets?.password;
  if (!password) return false;

  const userSelectors = [
    'input[name="userId"]',
    'input[id*="user" i]',
    'input[placeholder*="User" i]',
    'input[placeholder*="PAN" i]',
    'input[type="text"]',
  ];
  const passSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[id*="pass" i]',
  ];

  let userFilled = false;
  for (const sel of userSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.fill(job.pan);
      userFilled = true;
      break;
    }
  }
  let passFilled = false;
  for (const sel of passSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.fill(password);
      passFilled = true;
      break;
    }
  }
  if (!userFilled || !passFilled) return false;

  const continueBtn = page.getByRole('button', {
    name: /continue|login|sign in|submit/i,
  }).first();
  if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await continueBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }
  return true;
}

async function tryFillOtp(page: Page, otp: string): Promise<boolean> {
  const selectors = [
    'input[name*="otp" i]',
    'input[id*="otp" i]',
    'input[placeholder*="OTP" i]',
    'input[type="tel"]',
    'input[autocomplete="one-time-code"]',
  ];
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.fill(otp);
      const btn = page.getByRole('button', {
        name: /verify|submit|continue|confirm/i,
      }).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      return true;
    }
  }
  return false;
}

async function waitForOtp(jobId: string, timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = store.get(jobId);
    if (!job || job.status === 'timed_out' || job.status === 'failed') return null;
    if (job.status === 'needs_live_assist') return null;
    const otp = job.secrets?.otp;
    if (otp) return otp;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return null;
}

async function looksLikeOtp(page: Page): Promise<boolean> {
  const text = ((await page.content().catch(() => '')) || '').toLowerCase();
  return /otp|one.?time|verification code/.test(text);
}

async function looksLikeCaptcha(page: Page): Promise<boolean> {
  const text = ((await page.content().catch(() => '')) || '').toLowerCase();
  return /captcha|recaptcha|hcaptcha|cf-turnstile/.test(text);
}

async function looksLikeBotWall(page: Page): Promise<boolean> {
  const text = ((await page.content().catch(() => '')) || '').toLowerCase();
  return /access denied|bot detection|unusual traffic|cloudflare/.test(text);
}

async function looksLikeBadPassword(page: Page): Promise<boolean> {
  const text = ((await page.content().catch(() => '')) || '').toLowerCase();
  return /invalid (user|password|credentials)|incorrect password|login failed/.test(
    text,
  );
}

async function looksLoggedIn(page: Page): Promise<boolean> {
  const text = ((await page.content().catch(() => '')) || '').toLowerCase();
  return /dashboard|logout|log out|my account|e-file|file income tax return/.test(
    text,
  );
}

// silence unused LIVE_WAIT if we later poll live; keep export for Mode B wait helper
export async function waitUntilLiveDone(jobId: string): Promise<boolean> {
  const deadline = Date.now() + LIVE_WAIT_MS;
  while (Date.now() < deadline) {
    const job = store.get(jobId);
    if (!job) return false;
    if (job.status === 'downloading' || job.status === 'succeeded') return true;
    if (job.status === 'failed' || job.status === 'timed_out') return false;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return false;
}
