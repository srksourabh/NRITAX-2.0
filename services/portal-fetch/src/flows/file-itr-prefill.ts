import type { Page } from 'playwright-core';

import type { JobRecord } from '../store.js';
import {
  filingTypeLabel,
  formTypeLabel,
  type PortalFilingType,
  type PortalFormType,
} from './prefill-answers.js';

const FILE_ITR_URL =
  'https://eportal.incometax.gov.in/iec/foservices/#/dashboard/fileIncomeTaxReturn';

const DOWNLOAD_PREFILL_URLS = [
  'https://eportal.incometax.gov.in/iec/foservices/#/dashboard/downloadPreFilledData',
  'https://eportal.incometax.gov.in/iec/foservices/#/dashboard/downloadPrefilledData',
  'https://eportal.incometax.gov.in/iec/foservices/#/dashboard/downloadPrefillData',
];

export type PrefillDownloadResult = {
  artifactJson: string;
  source: 'api' | 'download';
};

/**
 * Primary path (matches Browserbase reverse-engineering):
 * e-File → Income Tax Return → Download Prefilled Data → AY → Download JSON.
 * File ITR wizard is a fallback only.
 */
export async function runPrefillDownload(
  page: Page,
  job: JobRecord,
): Promise<PrefillDownloadResult | null> {
  const ay = job.assessmentYear || '2026-27';
  await dismissPortalModals(page);

  // Primary: dedicated Download Prefilled Data page (confirmed URL).
  try {
    const menu = await runDownloadPrefillDataPage(page, ay);
    if (menu) return menu;
  } catch {
    /* File ITR fallback */
  }

  // Fallback only — slower multi-step wizard.
  try {
    return await runFileItrPrefillDownload(page, job);
  } catch {
    return null;
  }
}

/**
 * Dedicated "Download Prefilled Data" page: AY dropdown + Download.
 */
export async function runDownloadPrefillDataPage(
  page: Page,
  ay: string,
): Promise<PrefillDownloadResult | null> {
  let opened = false;
  for (const url of DOWNLOAD_PREFILL_URLS) {
    await page
      .goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      .catch(() => undefined);
    await page.waitForTimeout(1500);
    if (
      await page
        .getByText(/download pre-?filled data/i)
        .first()
        .isVisible({ timeout: 2500 })
        .catch(() => false)
    ) {
      opened = true;
      break;
    }
  }

  if (!opened) {
    await clickIfVisible(page, /e-?file/i, 'link', 3000);
    await clickIfVisible(page, /income tax returns?/i, 'link', 3000);
    opened = await clickIfVisible(
      page,
      /download pre-?filled data|download pre-?fill/i,
      'link',
      4000,
    );
    if (!opened) {
      opened = await clickTextOption(page, /download pre-?filled data/i);
    }
    await page.waitForTimeout(1200);
  }

  if (
    !opened &&
    !(await page
      .getByText(/download pre-?filled data/i)
      .first()
      .isVisible({ timeout: 1500 })
      .catch(() => false))
  ) {
    return null;
  }

  await selectAssessmentYear(page, ay);
  await page.waitForTimeout(1000);

  return tryCapturePrefillAfterDownloadClick(page);
}

/**
 * Click Download and capture either a file download or an XHR/JSON body.
 * Live portal serves getPrefillCurrentYr JSON (often wrapped in { content }).
 * Browserbase often cancels Playwright saveAs — prefer the network body.
 */
async function tryCapturePrefillAfterDownloadClick(
  page: Page,
): Promise<PrefillDownloadResult | null> {
  const btn = page
    .locator('button.large-button-primary')
    .filter({ hasText: /^\s*Download\s*$/i })
    .or(page.getByRole('button', { name: /^download$/i }))
    .or(page.getByRole('button', { name: /download/i }))
    .first();
  if (!(await btn.isVisible({ timeout: 5000 }).catch(() => false))) return null;

  for (let i = 0; i < 25; i += 1) {
    const disabled =
      (await btn.getAttribute('disabled')) != null ||
      (await btn.getAttribute('aria-disabled')) === 'true' ||
      (await btn.isDisabled().catch(() => false));
    if (!disabled) break;
    await page.waitForTimeout(400);
  }

  const isPrefillResponse = (url: string) =>
    /getPrefillCurrentYr|getPrefill|preFilled|pre-?fill/i.test(url) &&
    !/static\.incometax|i18n|chunk\/map|preLoginMenu/i.test(url);

  const apiPromise = page
    .waitForResponse(
      (res) => {
        if (res.request().method() === 'OPTIONS') return false;
        if (res.status() >= 400) return false;
        return isPrefillResponse(res.url());
      },
      { timeout: 60_000 },
    )
    .catch(() => null);

  const downloadPromise = page
    .waitForEvent('download', { timeout: 60_000 })
    .then(async (download) => {
      const path = await download.path();
      if (!path) return null;
      const { readFile } = await import('node:fs/promises');
      const text = await readFile(path, 'utf8');
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return unwrapPrefillText(text);
      }
      return null;
    })
    .catch(() => null);

  await btn.click().catch(() => undefined);

  const winner = await Promise.race([
    downloadPromise.then((json) => (json ? ({ kind: 'file' as const, json }) : null)),
    apiPromise.then(async (res) => {
      if (!res) return null;
      try {
        const text = await res.text();
        const artifact = unwrapPrefillText(text);
        if (artifact) return { kind: 'api' as const, json: artifact };
      } catch {
        /* ignore */
      }
      return null;
    }),
  ]);

  if (winner?.json) {
    return {
      artifactJson: winner.json,
      source: winner.kind === 'file' ? 'download' : 'api',
    };
  }

  const fileLater = await downloadPromise;
  if (fileLater) return { artifactJson: fileLater, source: 'download' };

  const apiLater = await apiPromise;
  if (apiLater) {
    try {
      const artifact = unwrapPrefillText(await apiLater.text());
      if (artifact) return { artifactJson: artifact, source: 'api' };
    } catch {
      /* ignore */
    }
  }

  return null;
}

/**
 * Drive File Income Tax Return → select AY / ITR / answers →
 * capture prefill JSON. Fallback when the dedicated download page is unavailable.
 */
export async function runFileItrPrefillDownload(
  page: Page,
  job: JobRecord,
): Promise<PrefillDownloadResult | null> {
  const formType = (job.formType ?? 'ITR2') as PortalFormType;
  const ay = job.assessmentYear || '2026-27';
  // Product defaults: offline path, original return, never politically exposed.
  const pep = false;
  const filingType: PortalFilingType = 'original';

  const apiWait = waitForPrefillApi(page, 90_000);

  await page.goto(FILE_ITR_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await page.waitForTimeout(2000);

  await clickIfVisible(page, /e-?file/i, 'link', 3000);
  await clickIfVisible(page, /income tax returns?/i, 'link', 3000);
  await clickIfVisible(page, /file income tax return/i, 'link', 3000);
  await page.waitForTimeout(1500);

  await selectAssessmentYear(page, ay);

  await clickTextOption(page, /offline/i);
  await clickIfVisible(page, /continue|proceed|let'?s get started|next/i, 'button', 4000);

  await clickTextOption(page, /individual/i);
  await clickIfVisible(page, /continue|proceed|next/i, 'button', 4000);

  await clickTextOption(page, new RegExp(filingTypeLabel(filingType), 'i'));
  await clickTextOption(page, /139\s*\(1\)|original return/i);
  await clickIfVisible(page, /continue|proceed|next/i, 'button', 3000);

  await answerYesNo(
    page,
    /audited u\/?s\s*44AB|political party as per section 13A/i,
    false,
  );

  await clickTextOption(page, new RegExp(formTypeLabel(formType), 'i'));
  await clickIfVisible(page, /continue|proceed|next|start/i, 'button', 4000);

  await answerYesNo(
    page,
    /politically exposed|political(ly)? exposed person|\bpep\b/i,
    pep,
  );
  await clickIfVisible(page, /continue|proceed|next|ok|submit/i, 'button', 4000);

  await clickIfVisible(
    page,
    /download pre-?fill|download prefill|pre-?fill(ed)? (data|json)|get pre-?fill|prefill and/i,
    'button',
    6000,
  );
  await clickIfVisible(
    page,
    /download pre-?fill|download prefill|pre-?fill(ed)? (data|json)/i,
    'link',
    4000,
  );
  await clickIfVisible(page, /offline|json submission|upload json/i, 'link', 3000);

  const captured = await tryCapturePrefillAfterDownloadClick(page);
  if (captured) return captured;

  const apiRes = await apiWait;
  if (apiRes) {
    try {
      const artifact = unwrapPrefillText(await apiRes.text());
      if (artifact) {
        return { artifactJson: artifact, source: 'api' };
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

function waitForPrefillApi(page: Page, timeout: number) {
  return page
    .waitForResponse(
      (res) =>
        /getPrefillCurrentYr|getPrefill|prefill|preFilled|pre-?fill/i.test(res.url()) &&
        !/static\.incometax|i18n|chunk\/map|preLoginMenu/i.test(res.url()) &&
        res.request().method() !== 'OPTIONS' &&
        res.status() < 500,
      { timeout },
    )
    .catch(() => null);
}

async function selectAssessmentYear(page: Page, ay: string): Promise<void> {
  await dismissPortalModals(page);

  // Live portal: required mat-select on Download Prefill / File ITR (not language).
  const mat = page
    .locator('mat-select.mat-mdc-select-required')
    .or(page.locator('mat-select#filterStyleForChip'))
    .or(page.locator('mat-select:not(#langMatSelect)'))
    .first();
  if (await mat.isVisible({ timeout: 2500 }).catch(() => false)) {
    await mat.click({ force: true });
    await page.waitForTimeout(600);
    await dismissPortalModals(page);
    const opt = page
      .locator('mat-option')
      .filter({ hasText: new RegExp(`${escapeRegExp(ay)}|current\\s*a\\.?y`, 'i') })
      .first();
    if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await opt.click();
      await page.waitForTimeout(800);
      return;
    }
  }

  await selectOptionByLabel(page, /assessment year/i, ay);
  const field = page.locator('mat-form-field').filter({ hasText: /assessment year/i }).first();
  if (await field.isVisible({ timeout: 1500 }).catch(() => false)) {
    await field.click().catch(() => undefined);
    await page.waitForTimeout(500);
  } else {
    const opened = await clickTextOption(
      page,
      /select assessment year|assessment year/i,
    );
    if (opened) await page.waitForTimeout(400);
  }
  await clickTextOption(
    page,
    new RegExp(`${escapeRegExp(ay)}.*current\\s*a\\.?y|${escapeRegExp(ay)}`, 'i'),
  );
  await clickTextOption(page, ay);
}

/** Turn getPrefillCurrentYr (or file) body into importer-ready JSON text. */
export function unwrapPrefillText(text: string): string | null {
  const t = text.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(t) as unknown;
    return extractJsonArtifact(parsed) ?? (looksLikePrefillObject(parsed) ? t : null);
  } catch {
    return looksLikePrefillRaw(t) ? t : null;
  }
}

function looksLikePrefillRaw(t: string): boolean {
  return /Form_ITR|personalInfo|PersonalInfo|AssessmentYear|"ITR3"|"ITR2"/i.test(t);
}

function looksLikePrefillObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    'Form_ITR2' in o ||
    'Form_ITR3' in o ||
    'personalInfo' in o ||
    'PersonalInfo' in o ||
    'ITR' in o
  );
}

export function extractJsonArtifact(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === 'string') {
    const t = body.trim();
    if (!(t.startsWith('{') || t.startsWith('['))) return null;
    try {
      return extractJsonArtifact(JSON.parse(t)) ?? (looksLikePrefillRaw(t) ? t : null);
    } catch {
      return looksLikePrefillRaw(t) ? t : null;
    }
  }
  if (typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;

  if (looksLikePrefillObject(obj)) {
    return JSON.stringify(obj);
  }

  // getPrefillCurrentYr: { responseCode, content: "<json string>" }
  for (const key of [
    'content',
    'data',
    'prefillData',
    'prefill',
    'json',
    'payload',
    'result',
    'responseData',
  ]) {
    const nested = obj[key];
    if (typeof nested === 'string' && nested.trim().startsWith('{')) {
      const inner = extractJsonArtifact(nested);
      if (inner) return inner;
      return nested;
    }
    if (nested && typeof nested === 'object') {
      const inner = extractJsonArtifact(nested);
      if (inner) return inner;
    }
  }
  return null;
}

async function answerYesNo(
  page: Page,
  question: RegExp,
  yes: boolean,
): Promise<void> {
  const q = page.getByText(question).first();
  if (await q.isVisible({ timeout: 1500 }).catch(() => false)) {
    const row = q.locator(
      'xpath=ancestor::*[self::div or self::section or self::mat-form-field][1]',
    );
    const opt = row.getByText(yes ? /^yes$/i : /^no$/i).first();
    if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await opt.click();
      return;
    }
  }

  const label = yes ? /^(yes|y)$/i : /^(no|n)$/i;
  await clickTextOption(page, label);
}

async function selectOptionByLabel(
  page: Page,
  label: RegExp,
  value: string,
): Promise<void> {
  const lab = page.getByText(label).first();
  if (!(await lab.isVisible({ timeout: 2000 }).catch(() => false))) return;

  const near = lab
    .locator(
      'xpath=ancestor::*[self::div or self::section or self::mat-form-field or self::label][1]//select',
    )
    .first();
  const select = (await near.isVisible({ timeout: 800 }).catch(() => false))
    ? near
    : page.locator('select').first();

  if (await select.isVisible({ timeout: 1500 }).catch(() => false)) {
    await select.selectOption({ label: value }).catch(async () => {
      await select.selectOption({ value }).catch(() => undefined);
    });
  }
}

async function clickTextOption(
  page: Page,
  text: string | RegExp,
): Promise<boolean> {
  const pattern =
    typeof text === 'string' ? new RegExp(escapeRegExp(text), 'i') : text;
  const candidates = [
    page.getByRole('radio', { name: pattern }),
    page.getByRole('option', { name: pattern }),
    page.getByRole('button', { name: pattern }),
    page.getByRole('link', { name: pattern }),
    page.getByText(pattern, { exact: false }),
  ];
  for (const loc of candidates) {
    const el = loc.first();
    if (await el.isVisible({ timeout: 1200 }).catch(() => false)) {
      await el.click().catch(() => undefined);
      await page.waitForTimeout(400);
      return true;
    }
  }
  return false;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function dismissPortalModals(page: Page): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    if (
      await page
        .getByText(/sure you want to Logout/i)
        .first()
        .isVisible({ timeout: 400 })
        .catch(() => false)
    ) {
      await page
        .getByRole('button', { name: /^no$/i })
        .first()
        .click({ force: true })
        .catch(() => undefined);
      await page.waitForTimeout(400);
      continue;
    }
    const security = page.locator(
      '#securityReasonPopup.modal.show, #securityReasonPopup.show, #securityReasonPopup',
    );
    if (await security.first().isVisible({ timeout: 400 }).catch(() => false)) {
      const text = (await security.first().innerText().catch(() => '')) || '';
      if (/logout/i.test(text)) {
        await security
          .first()
          .getByRole('button', { name: /^no$/i })
          .click({ force: true })
          .catch(() => undefined);
      } else {
        const btn = security
          .first()
          .getByRole('button', { name: /ok|continue|close|got it|confirm|agree/i })
          .first();
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          await btn.click({ force: true }).catch(() => undefined);
        } else {
          await page.keyboard.press('Escape').catch(() => undefined);
        }
      }
      await page.waitForTimeout(300);
      continue;
    }
    const confirm = page.locator('#continueBtnNav, #confirmBtnFooter, #efNotificationPopUp_continue').first();
    if (await confirm.isVisible({ timeout: 250 }).catch(() => false)) {
      await confirm.click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(250);
      continue;
    }
    break;
  }
}

async function clickIfVisible(
  page: Page,
  name: RegExp,
  role: 'button' | 'link',
  timeout: number,
): Promise<boolean> {
  const el = page.getByRole(role, { name }).first();
  if (await el.isVisible({ timeout }).catch(() => false)) {
    await el.click().catch(() => undefined);
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}
