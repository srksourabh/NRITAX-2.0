import { useMockMode } from './config.js';
import {
  continueBrowserbaseAfterLive,
  runBrowserbasePrefill,
} from './flows/download-prefill.js';
import {
  continueMockAfterLive,
  continueMockAfterOtp,
  runMockPrefill,
} from './flows/mock-prefill.js';

/** Start Mode A (mock or Browserbase). Fire-and-forget. */
export function startPrefetch(jobId: string): void {
  const run = useMockMode() ? runMockPrefill : runBrowserbasePrefill;
  void run(jobId).catch(() => {
    /* errors applied as FAIL inside flows */
  });
}

export function resumeAfterOtp(jobId: string): void {
  if (useMockMode()) {
    void continueMockAfterOtp(jobId);
    return;
  }
  // Browserbase OTP wait loop is inside runBrowserbasePrefill; setOtp unblocks it.
  // No extra resume needed for live Browserbase OTP path.
}

export function resumeAfterLive(jobId: string): void {
  if (useMockMode()) {
    void continueMockAfterLive(jobId);
    return;
  }
  void continueBrowserbaseAfterLive(jobId).catch(() => {
    /* FAIL inside flow */
  });
}
