import type { JobRecord } from '../store.js';
import { store } from '../store.js';
import { specimenPrefillJson } from './specimen.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock Mode A/B when Browserbase keys are absent or PORTAL_FETCH_MOCK=1.
 * Password containing "captcha" (case-insensitive) forces Mode B.
 */
export async function runMockPrefill(jobId: string): Promise<void> {
  const job = store.get(jobId);
  if (!job?.secrets) return;

  store.apply(jobId, { type: 'START_LOGIN' }, {
    message: 'Signing in to the e-Filing portal (mock)…',
  });
  await sleep(400);

  const password = job.secrets.password;
  if (/captcha/i.test(password)) {
    store.apply(jobId, { type: 'NEED_LIVE_ASSIST' }, {
      message:
        'CAPTCHA or bot check detected. Open live assist, finish login, then click Done.',
      liveViewUrl: 'https://www.browserbase.com/overview',
    });
    return;
  }

  if (/^wrong/i.test(password)) {
    store.apply(jobId, { type: 'FAIL' }, {
      message: 'Login failed. Check your portal password, or upload JSON manually.',
    });
    return;
  }

  store.apply(jobId, { type: 'NEED_OTP' }, {
    message: 'Enter the OTP sent to your registered mobile or email.',
  });
}

export async function continueMockAfterOtp(jobId: string): Promise<void> {
  const job = store.get(jobId);
  if (!job) return;

  store.apply(jobId, { type: 'OTP_SUBMITTED' }, {
    message: 'OTP received. Completing login…',
  });
  await sleep(300);
  await finishMockDownload(jobId, job);
}

export async function continueMockAfterLive(jobId: string): Promise<void> {
  const job = store.get(jobId);
  if (!job) return;
  store.apply(jobId, { type: 'LIVE_ASSIST_DONE' }, {
    message: 'Resuming prefill download…',
  });
  await sleep(300);
  await finishMockDownload(jobId, job);
}

async function finishMockDownload(jobId: string, job: JobRecord): Promise<void> {
  const current = store.get(jobId);
  if (!current) return;
  // After OTP we are logging_in; after live-done we are already downloading.
  if (current.status === 'logging_in') {
    store.apply(jobId, { type: 'START_DOWNLOAD' }, {
      message: 'Downloading pre-filled JSON…',
    });
  } else {
    store.patch(jobId, { message: 'Downloading pre-filled JSON…' });
  }
  await sleep(400);
  const latest = store.get(jobId) ?? job;
  const artifact = specimenPrefillJson(latest);
  store.apply(jobId, { type: 'SUCCESS' }, {
    message: 'Prefill downloaded. Review every field before filing.',
    artifactJson: artifact,
  });
}
