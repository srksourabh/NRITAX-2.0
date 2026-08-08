import Browserbase from '@browserbasehq/sdk';
import { chromium, type Page } from 'playwright-core';

import {
  browserbaseApiKey,
  browserbaseProjectId,
  PORTAL_HOME,
  PORTAL_LOGIN,
} from '../config.js';import type { JobRecord } from '../store.js';
import { store } from '../store.js';
import {
  extractPortalMessage,
  formatPortalFailure,
  isPortalAccountLocked,
  isPortalAuthFailure,
} from './portal-messages.js';
import { runPrefillDownload } from './file-itr-prefill.js';
import { formTypeLabel } from './prefill-answers.js';

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
      message: 'Signing in with PAN as User ID…',
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

    // Browserbase: allow downloads into the session downloads dir (API ZIP fallback).
    try {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: 'downloads',
        eventsEnabled: true,
      });
    } catch {
      /* optional */
    }

    await page.goto(PORTAL_HOME, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await openLoginIfNeeded(page);
    // Prefer the SPA login hash — homepage Login can land before Angular mounts inputs.
    if (
      !(await page
        .locator('input[placeholder*="User ID" i], input[name="userId"], input[type="text"]')
        .first()
        .isVisible({ timeout: 4000 })
        .catch(() => false))
    ) {
      await page.goto(PORTAL_LOGIN, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(1500);
    }
    await page
      .locator('input[placeholder*="User ID" i], input[name="userId"], input[type="text"]')
      .first()
      .waitFor({ state: 'visible', timeout: 45_000 })
      .catch(() => undefined);

    if (await looksLikeCaptcha(page)) {
      await escalateLive(jobId, liveViewUrl, 'CAPTCHA detected. Complete login in live assist.');
      return;
    }

    const loginResult = await tryFillLogin(page, job);
    if (loginResult === 'auth_failed') {
      if (await visibleAccountLocked(page)) {
        const portalText = await readPortalMessage(page);
        store.apply(jobId, { type: 'FAIL' }, {
          message: formatPortalFailure(
            portalText,
            'Login failed. Check your PAN (User ID) and e-Filing password, or upload JSON manually.',
          ),
        });
        return;
      }
      if (await looksLikeBadPassword(page)) {
        store.apply(jobId, { type: 'FAIL' }, {
          message:
            'Income Tax portal rejected the password. Check your e-Filing password, or upload JSON manually.',
        });
        return;
      }
      await escalateLive(
        jobId,
        liveViewUrl,
        'Login did not complete automatically. Finish login in live assist, then click Done.',
      );
      return;
    }
    if (loginResult === 'missing_fields') {
      await escalateLive(
        jobId,
        liveViewUrl,
        'Could not locate login fields. Complete login in live assist, then click Done.',
      );
      return;
    }

    await page.waitForTimeout(2000);

    if (await looksLikeCaptcha(page) || (await looksLikeBotWall(page))) {
      await escalateLive(jobId, liveViewUrl, 'Bot check detected. Finish login in live assist.');
      return;
    }

    if (await looksLikeBadPassword(page)) {
      store.apply(jobId, { type: 'FAIL' }, {
        message:
          'Income Tax portal rejected the password. Check your e-Filing password, or upload JSON manually.',
      });
      return;
    }

    if (await looksLikeOtp(page)) {
      store.apply(jobId, { type: 'NEED_OTP' }, {
        message:
          'Income Tax portal asked for OTP. Enter the code sent to your registered mobile or email (Aadhaar-linked numbers may apply).',
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
      if (await looksLikeBadPassword(page) || (await visibleAccountLocked(page))) {
        const otpMsg = await readPortalMessage(page);
        store.apply(jobId, { type: 'FAIL' }, {
          message: formatPortalFailure(otpMsg, 'OTP was rejected by the Income Tax portal.'),
        });
        return;
      }
    }

    if (!(await looksLoggedIn(page))) {
      if (await looksLikeCaptcha(page) || (await looksLikeBotWall(page))) {
        await escalateLive(jobId, liveViewUrl, 'Complete login in live assist, then click Done.');
        return;
      }
      if (await visibleAccountLocked(page)) {
        const portalText = await readPortalMessage(page);
        store.apply(jobId, { type: 'FAIL' }, {
          message: formatPortalFailure(
            portalText,
            'Portal login did not complete. Check PAN/password, or upload JSON manually.',
          ),
        });
        return;
      }
      await escalateLive(
        jobId,
        liveViewUrl,
        'Portal login did not finish automatically. Complete login in live assist, then click Done.',
      );
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
      message: formatPortalFailure(
        msg.length < 180 ? msg : null,
        'Portal changed or session failed. Upload the prefill JSON manually.',
      ),
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
  const formLabel = formTypeLabel(job.formType ?? 'ITR2');
  store.apply(jobId, { type: 'START_DOWNLOAD' }, {
    message: `Downloading prefill JSON · AY ${job.assessmentYear} (${formLabel})…`,
  });

  try {
    await dismissBlockingModals(page);
    const result = await runPrefillDownload(page, job);
    if (result?.artifactJson) {
      store.apply(jobId, { type: 'SUCCESS' }, {
        message: `Prefill downloaded (${result.source}) for ${formLabel}. Review every field before filing.`,
        artifactJson: result.artifactJson,
      });
      return;
    }
  } catch {
    /* fall through */
  }

  // Legacy: any visible prefill download link on the current page.
  try {
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
    /* fall through */
  }

  const live = store.get(jobId)?.liveViewUrl;
  if (live) {
    await escalateLive(
      jobId,
      live,
      `Could not finish ${formLabel} prefill automatically. Open e-File → Income Tax Return → Download Prefilled Data, pick AY, download JSON, then click Done.`,
    );
    return;
  }

  store.apply(jobId, { type: 'FAIL' }, {
    message:
      'Could not download prefill JSON from the portal. Upload the file manually.',
  });
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

async function tryFillLogin(
  page: Page,
  job: JobRecord,
): Promise<'ok' | 'missing_fields' | 'auth_failed'> {
  const password = job.secrets?.password;
  if (!password) return 'missing_fields';

  const userSelectors = [
    'input[placeholder*="User ID" i]',
    'input[name="userId"]',
    'input[name="userid"]',
    'input[id*="userId" i]',
    'input[id*="userid" i]',
    'input[placeholder*="PAN" i]',
    'input[aria-label*="User ID" i]',
    'input[aria-label*="PAN" i]',
    'input[type="text"]',
  ];
  const passSelectors = [
    '#loginPasswordField',
    'input[name="loginPasswordField"]',
    'input[type="password"]',
    'input[name="password"]',
    'input[id*="pass" i]',
    'input[aria-label*="Password" i]',
  ];

  let userFilled = false;
  for (const sel of userSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 4000 }).catch(() => false)) {
      await el.fill(job.pan);
      userFilled = true;
      break;
    }
  }
  if (!userFilled) {
    // Last resort: go straight to SPA login.
    await page.goto(PORTAL_LOGIN, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);
    const el = page.locator('input[placeholder*="User ID" i], input[type="text"]').first();
    if (await el.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await el.fill(job.pan);
      userFilled = true;
    }
  }
  if (!userFilled) return 'missing_fields';

  // ITD login is usually two-step: User ID (PAN) → Continue → Password.
  // On a single-step form the password field is already visible — do not Continue yet.
  let passwordAlreadyVisible = false;
  for (const sel of passSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 400 }).catch(() => false)) {
      passwordAlreadyVisible = true;
      break;
    }
  }
  if (!passwordAlreadyVisible) {
    await clickContinue(page);
    await page.waitForTimeout(1200);
  }

  const afterUserId = await readPortalMessage(page);
  if (afterUserId && isPortalAuthFailure(afterUserId)) {
    return 'auth_failed';
  }

  // Checkbox first — Angular Material keeps Continue disabled until it is checked.
  await confirmSecureAccessMessage(page);

  let passFilled = false;
  for (const sel of passSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 4000 }).catch(() => false)) {
      await el.click();
      await el.fill('');
      // pressSequentially fires key events Angular Material needs to mark ng-valid.
      await el.pressSequentially(password, { delay: 35 });
      await el.blur().catch(() => undefined);
      passFilled = true;
      break;
    }
  }
  if (!passFilled) return 'missing_fields';

  // Re-assert checkbox in case password focus cleared it.
  await confirmSecureAccessMessage(page);
  // Give Angular forms a beat to enable Continue after checkbox + password.
  await page.waitForTimeout(800);

  // Wait until Continue is enabled, then click.
  const continueBtn = page
    .locator('button.large-button-primary', { hasText: /^Continue/i })
    .or(page.getByRole('button', { name: /^continue/i }))
    .first();
  for (let i = 0; i < 16; i += 1) {
    const visible = await continueBtn.isVisible({ timeout: 500 }).catch(() => false);
    if (!visible) break;
    const disabled =
      (await continueBtn.getAttribute('disabled')) != null ||
      (await continueBtn.getAttribute('aria-disabled')) === 'true' ||
      (await continueBtn.isDisabled().catch(() => false));
    if (!disabled) break;
    if (i === 6) await confirmSecureAccessMessage(page);
    await page.waitForTimeout(400);
  }
  await continueBtn.click({ force: true }).catch(() => clickContinue(page));

  // Dual login: "Session already active" → click Login Here to take over.
  await handleDualLogin(page);

  // Wait for navigation away from the password step (OTP / dashboard).
  for (let i = 0; i < 24; i += 1) {
    await page.waitForTimeout(500);
    await handleDualLogin(page);
    if (await visibleAccountLocked(page)) return 'auth_failed';
    if (await looksLikeOtp(page)) return 'ok';
    if (await looksLoggedIn(page)) {
      await dismissBlockingModals(page);
      return 'ok';
    }
    const url = page.url();
    if (!/#\/login(\/password)?\/?$/i.test(url) && !/#\/login$/i.test(url)) {
      if (!/#\/login/i.test(url)) {
        await dismissBlockingModals(page);
        return 'ok';
      }
    }
  }

  if (await visibleAccountLocked(page)) return 'auth_failed';

  const afterPassword = await readPortalMessage(page);
  if (afterPassword && isPortalAuthFailure(afterPassword) && !/#\/login\/password/i.test(page.url())) {
    return 'auth_failed';
  }
  if (await looksLikeBadPassword(page)) {
    return 'auth_failed';
  }

  // Still on password with no clear visible error — outer flow can escalate live.
  return 'ok';
}

async function confirmSecureAccessMessage(page: Page): Promise<void> {
  // Stable ITD ids: #passwordCheckBox / #passwordCheckBox-input
  const mat = page.locator('#passwordCheckBox');
  const native = page.locator('#passwordCheckBox-input');
  if (await mat.isVisible({ timeout: 2000 }).catch(() => false)) {
    const checked = await native.isChecked().catch(() => false);
    if (!checked) {
      await mat.click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(200);
    }
    if (!(await native.isChecked().catch(() => false))) {
      await page
        .locator('label[for="passwordCheckBox-input"]')
        .click({ force: true })
        .catch(() => undefined);
    }
    return;
  }

  // ITD password step: "Please confirm your secure access message…"
  const label = page.getByText(/confirm your secure access message/i).first();
  if (await label.isVisible({ timeout: 1500 }).catch(() => false)) {
    const row = label.locator(
      'xpath=ancestor::*[contains(@class,"checkbox") or self::mat-checkbox or self::label][1]',
    );
    const box = row.locator('input[type="checkbox"], [role="checkbox"]').first();
    if (await box.isVisible({ timeout: 800 }).catch(() => false)) {
      const checked =
        (await box.getAttribute('aria-checked')) === 'true' ||
        (await box.isChecked().catch(() => false));
      if (!checked) await box.click({ force: true }).catch(() => label.click());
    } else {
      await label.click().catch(() => undefined);
    }
    return;
  }

  const byLabel = page
    .getByLabel(/secure access message|confirm your secure access/i)
    .first();
  if (await byLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
    const checked = await byLabel.isChecked().catch(() => false);
    if (!checked) await byLabel.check({ force: true }).catch(() => byLabel.click());
  }
}

/** Close post-login security / disclaimer / accidental logout prompts. */
async function dismissBlockingModals(page: Page): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    // Accidental logout confirm — always choose No.
    if (
      await page
        .getByText(/sure you want to Logout/i)
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false)
    ) {
      await page
        .getByRole('button', { name: /^no$/i })
        .first()
        .click({ force: true })
        .catch(() => undefined);
      await page.waitForTimeout(500);
      continue;
    }

    const security = page.locator('#securityReasonPopup.modal.show, #securityReasonPopup.show');
    if (await security.isVisible({ timeout: 500 }).catch(() => false)) {
      const text = (await security.innerText().catch(() => '')) || '';
      if (/logout/i.test(text)) {
        await security
          .getByRole('button', { name: /^no$/i })
          .click({ force: true })
          .catch(() => undefined);
      } else {
        const ok = security
          .getByRole('button', { name: /ok|continue|close|got it|confirm|agree/i })
          .first();
        if (await ok.isVisible({ timeout: 600 }).catch(() => false)) {
          await ok.click({ force: true }).catch(() => undefined);
        } else {
          await page.keyboard.press('Escape').catch(() => undefined);
        }
      }
      await page.waitForTimeout(400);
      continue;
    }

    const disclaimerConfirm = page.locator('#continueBtnNav, #confirmBtnFooter').first();
    if (await disclaimerConfirm.isVisible({ timeout: 300 }).catch(() => false)) {
      await disclaimerConfirm.click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(300);
      continue;
    }

    const notif = page.locator('#efNotificationPopUp_continue');
    if (await notif.isVisible({ timeout: 300 }).catch(() => false)) {
      await notif.click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(300);
      continue;
    }
    break;
  }
}

/** EF00177 Session already active — Dual Login Detected dialog. */
async function handleDualLogin(page: Page): Promise<boolean> {
  const dual =
    (await page.getByText(/Dual Login Detected/i).isVisible({ timeout: 600 }).catch(() => false)) ||
    (await page.getByText(/session is currently active in another/i).isVisible({ timeout: 400 }).catch(() => false));
  if (!dual) return false;
  const loginHere = page.getByRole('button', { name: /login here/i }).first();
  if (await loginHere.isVisible({ timeout: 1500 }).catch(() => false)) {
    await loginHere.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(2000);
    return true;
  }
  return false;
}

async function clickContinue(page: Page): Promise<void> {
  const continueBtn = page
    .getByRole('button', {
      name: /continue|login|sign in|submit|proceed/i,
    })
    .first();
  if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await continueBtn.click();
    return;
  }
  await page.keyboard.press('Enter');
}

async function openLoginIfNeeded(page: Page): Promise<void> {
  const loginLink = page.getByRole('link', { name: /^login$/i }).first();
  if (await loginLink.isVisible({ timeout: 2500 }).catch(() => false)) {
    await loginLink.click();
    await page.waitForTimeout(800);
    return;
  }
  const loginBtn = page.getByRole('button', { name: /^login$/i }).first();
  if (await loginBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await loginBtn.click();
    await page.waitForTimeout(800);
  }
}

async function readPortalMessage(page: Page): Promise<string | null> {
  // Prefer visible dialog / alert text — SPA HTML embeds unused i18n lock copy.
  const dialog = page
    .locator('[role="alertdialog"], [role="alert"], .mat-mdc-dialog-container, mat-dialog-container, .mat-mdc-dialog-content, mat-dialog-content')
    .first();
  if (await dialog.isVisible({ timeout: 800 }).catch(() => false)) {
    const dialogText = (await dialog.innerText().catch(() => '')) || '';
    const fromDialog = extractPortalMessage(dialogText);
    if (fromDialog) return fromDialog;
  }

  if (await visibleAccountLocked(page)) {
    const t =
      (await page
        .getByText(/Your e-filing account has been locked/i)
        .first()
        .innerText()
        .catch(() => '')) || '';
    return t || 'Your e-filing account has been locked due to security reasons';
  }

  // Visible body text only for credential errors (not lock templates).
  const text = (await page.locator('body').innerText().catch(() => '')) || '';
  const fromText = extractPortalMessage(text);
  if (fromText && !isPortalAccountLocked(fromText)) return fromText;
  if (fromText && (await visibleAccountLocked(page))) return fromText;

  return null;
}

async function visibleAccountLocked(page: Page): Promise<boolean> {
  const loc = page.getByText(/Your e-filing account has been locked/i).first();
  return loc.isVisible({ timeout: 800 }).catch(() => false);
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
  if (/#\/login\/.*(otp|passcode)/i.test(page.url())) return true;
  const otpField = page
    .locator('input[name*="otp" i], input[id*="otp" i], input[placeholder*="OTP" i], input[autocomplete="one-time-code"]')
    .first();
  return otpField.isVisible({ timeout: 800 }).catch(() => false);
}

async function looksLikeCaptcha(page: Page): Promise<boolean> {
  const frame = page.locator('iframe[src*="captcha" i], iframe[src*="recaptcha" i], iframe[src*="hcaptcha" i]').first();
  if (await frame.isVisible({ timeout: 500 }).catch(() => false)) return true;
  const text = (await page.locator('body').innerText().catch(() => '')) || '';
  return /verify you are human|complete the captcha/i.test(text);
}

async function looksLikeBotWall(page: Page): Promise<boolean> {
  const text = (await page.locator('body').innerText().catch(() => '')) || '';
  return /access denied|bot detection|unusual traffic|cloudflare/i.test(text);
}

async function looksLikeBadPassword(page: Page): Promise<boolean> {
  if (await visibleAccountLocked(page)) return true;
  const invalid = page.getByText(/invalid credentials|incorrect password|wrong password/i).first();
  return invalid.isVisible({ timeout: 600 }).catch(() => false);
}

async function looksLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  if (/#\/dashboard/i.test(url)) return true;
  if (/#\/login/i.test(url)) return false;
  const logout = page.getByRole('link', { name: /log ?out/i }).or(
    page.getByRole('button', { name: /log ?out/i }),
  );
  if (await logout.first().isVisible({ timeout: 600 }).catch(() => false)) return true;
  const profile = page.getByText(/session time/i).first();
  return profile.isVisible({ timeout: 600 }).catch(() => false);
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
