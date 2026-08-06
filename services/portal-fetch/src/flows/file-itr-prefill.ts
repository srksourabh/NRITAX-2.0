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

/**
 * Drive File Income Tax Return → select AY / ITR / political answers →
 * capture prefill JSON (API intercept or download).
 *
 * Selectors are resilient; returns null when the portal UI drifted so Mode B
 * can take over.
 */
export async function runFileItrPrefillDownload(
  page: Page,
  job: JobRecord,
): Promise<{ artifactJson: string; source: 'api' | 'download' } | null> {
  const formType = (job.formType ?? 'ITR2') as PortalFormType;
  const ay = job.assessmentYear || '2026-27';
  const pep = Boolean(job.politicallyExposed);
  const filingType = (job.filingType ?? 'original') as PortalFilingType;

  // Prefer intercepting the portal's own prefill API (seen in Browserbase session).
  const apiWait = page
    .waitForResponse(
      (res) =>
        /getPrefill/i.test(res.url()) &&
        res.request().method() !== 'OPTIONS' &&
        res.status() < 500,
      { timeout: 90_000 },
    )
    .catch(() => null);

  await page.goto(FILE_ITR_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await page.waitForTimeout(2000);

  await clickIfVisible(page, /e-?file/i, 'link', 3000);
  await clickIfVisible(page, /income tax returns?/i, 'link', 3000);
  await clickIfVisible(page, /file income tax return/i, 'link', 3000);
  await page.waitForTimeout(1500);

  // Assessment year
  await selectOptionByLabel(page, /assessment year/i, ay);
  await clickTextOption(page, ay);

  // Mode: Offline JSON matches the session path (.../offlineJsonSubmission).
  await clickTextOption(page, /offline/i);
  await clickIfVisible(page, /continue|proceed|let'?s get started|next/i, 'button', 4000);

  await clickTextOption(page, /individual/i);
  await clickIfVisible(page, /continue|proceed|next/i, 'button', 4000);

  // Filing type (Original / Revised / …)
  await clickTextOption(page, new RegExp(filingTypeLabel(filingType), 'i'));
  await clickIfVisible(page, /continue|proceed|next/i, 'button', 3000);

  // ITR form
  await clickTextOption(page, new RegExp(formTypeLabel(formType), 'i'));
  await clickIfVisible(page, /continue|proceed|next|start/i, 'button', 4000);

  // Politically Exposed Person
  await answerYesNo(
    page,
    /politically exposed|political(ly)? exposed person|\bpep\b/i,
    pep,
  );
  await clickIfVisible(page, /continue|proceed|next|ok|submit/i, 'button', 4000);

  // Offline JSON submission / download prefill CTAs
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

  const apiRes = await apiWait;
  if (apiRes) {
    try {
      const body = await apiRes.json();
      const artifact = extractJsonArtifact(body);
      if (artifact) {
        return { artifactJson: artifact, source: 'api' };
      }
    } catch {
      /* try download path */
    }
  }

  const downloaded = await tryClickDownload(page);
  if (downloaded) return { artifactJson: downloaded, source: 'download' };

  // Last resort: Download Pre-Filled Data menu (AY only).
  const menu = await tryDownloadPrefillMenu(page, ay);
  if (menu) return { artifactJson: menu, source: 'download' };

  return null;
}

async function tryDownloadPrefillMenu(page: Page, ay: string): Promise<string | null> {
  await clickIfVisible(page, /e-?file/i, 'link', 3000);
  await clickIfVisible(page, /income tax returns?/i, 'link', 3000);
  const opened = await clickIfVisible(
    page,
    /download pre-?filled data|download pre-?fill/i,
    'link',
    4000,
  );
  if (!opened) return null;
  await page.waitForTimeout(1000);
  await selectOptionByLabel(page, /assessment year/i, ay);
  await clickTextOption(page, ay);
  return tryClickDownload(page);
}

async function tryClickDownload(page: Page): Promise<string | null> {
  const btn = page
    .getByRole('button', { name: /download/i })
    .or(page.getByRole('link', { name: /download/i }))
    .first();
  if (!(await btn.isVisible({ timeout: 5000 }).catch(() => false))) return null;
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 45_000 }),
      btn.click(),
    ]);
    const path = await download.path();
    if (!path) return null;
    const { readFile } = await import('node:fs/promises');
    const text = await readFile(path, 'utf8');
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) return text;
  } catch {
    return null;
  }
  return null;
}

function extractJsonArtifact(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === 'string') {
    const t = body.trim();
    if (t.startsWith('{') || t.startsWith('[')) return t;
    return null;
  }
  if (typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;

  // Direct ITD shape
  if ('Form_ITR2' in obj || 'Form_ITR3' in obj) {
    return JSON.stringify(obj);
  }

  for (const key of [
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
  const body = ((await page.locator('body').innerText().catch(() => '')) || '').toLowerCase();
  if (!question.test(body)) {
    // Still try generic Yes/No near PEP wording
  }
  const label = yes ? /^(yes|y)$/i : /^(no|n)$/i;
  await clickTextOption(page, label);
  // Radio near question
  const q = page.getByText(question).first();
  if (await q.isVisible({ timeout: 1500 }).catch(() => false)) {
    const row = q.locator('xpath=ancestor::*[self::div or self::section or self::mat-form-field][1]');
    const opt = row.getByText(yes ? /^yes$/i : /^no$/i).first();
    if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await opt.click();
    }
  }
}

async function selectOptionByLabel(
  page: Page,
  label: RegExp,
  value: string,
): Promise<void> {
  const lab = page.getByText(label).first();
  if (!(await lab.isVisible({ timeout: 2000 }).catch(() => false))) return;
  const select = page.locator('select').first();
  if (await select.isVisible({ timeout: 1500 }).catch(() => false)) {
    await select.selectOption({ label: value }).catch(async () => {
      await select.selectOption({ value }).catch(() => undefined);
    });
  }
}

async function clickTextOption(page: Page, text: string | RegExp): Promise<boolean> {
  const pattern = typeof text === 'string' ? new RegExp(escapeRegExp(text), 'i') : text;
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
