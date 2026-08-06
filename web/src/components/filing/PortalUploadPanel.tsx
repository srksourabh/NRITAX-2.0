'use client';

import { useState } from 'react';

import { ITD_PORTAL_HOME, ITD_PORTAL_LABEL } from '@/lib/itd/portal';
import { buildReturnJson } from '@/lib/itr/build-json';
import type { ReturnData } from '@/lib/itr/types';
import { readFilingSession } from '@/lib/session/filing-session';

/**
 * Export JSON, then attempt portal upload automation (with manual fallback).
 * Upload automation uses the same session password as prefill fetch.
 */
export function PortalUploadPanel({
  data,
  canUpload,
  jsonDownloaded = false,
  onNotice,
  onDownloaded,
}: {
  data: ReturnData;
  canUpload: boolean;
  /** True when JSON was already downloaded from the workspace header. */
  jsonDownloaded?: boolean;
  onNotice: (message: string) => void;
  onDownloaded?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const readyToUpload = downloaded || jsonDownloaded;

  function downloadJson() {
    const built = buildReturnJson(data);
    const blob = new Blob([JSON.stringify(built.json, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = built.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setDownloaded(true);
    onDownloaded?.();
    onNotice(
      `Downloaded ${built.fileName}. Next: file on the ${ITD_PORTAL_LABEL} via automation or manual upload.`,
    );
  }

  async function startUploadAutomation() {
    setBusy(true);
    try {
      const session = readFilingSession();
      if (!session?.password || !session.consentAutomation) {
        onNotice(
          'No session password. Re-enter your e-Filing password on the landing page, or upload the JSON manually on the portal.',
        );
        return;
      }

      const built = buildReturnJson(data);
      const res = await fetch('/api/portal-fetch/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan: session.pan,
          password: session.password,
          mobile: session.mobile,
          assessmentYear: data.meta.assessmentYear,
          consentUpload: true,
          returnJson: built.json,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        status?: string;
        liveViewUrl?: string;
      };

      if (!json.ok) {
        onNotice(
          json.message ??
            `Automation unavailable. Download the JSON and upload at ${ITD_PORTAL_HOME} → e-File → Upload JSON.`,
        );
        return;
      }

      onNotice(
        json.message ??
          'Portal upload job started. Complete any OTP or live assist if prompted.',
      );
      if (json.liveViewUrl) {
        window.open(json.liveViewUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      onNotice(
        `Could not reach upload automation. Upload manually at ${ITD_PORTAL_HOME}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ntx-panel space-y-3 p-4">
      <h3 className="text-[var(--h3)] font-semibold text-[var(--ink)]">File on the portal</h3>
      <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
        Export the departmental JSON, then push it with browser automation using your session
        password. If automation fails, upload the same file yourself on the official portal.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ntx-btn ntx-btn-secondary" onClick={downloadJson}>
          Download JSON
        </button>
        <button
          type="button"
          className="ntx-btn ntx-btn-primary"
          disabled={busy || !canUpload || !readyToUpload}
          onClick={() => void startUploadAutomation()}
        >
          {busy ? 'Starting upload…' : 'Upload via browser automation'}
        </button>
        <a
          className="ntx-btn ntx-btn-quiet"
          href={ITD_PORTAL_HOME}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open e-Filing portal
        </a>
      </div>
      {!canUpload ? (
        <p className="text-[var(--caption)] text-[var(--notice)]">
          Run Validate first. Cat A blocks should be clear before filing.
        </p>
      ) : null}
    </div>
  );
}
