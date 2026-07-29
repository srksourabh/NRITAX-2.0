'use client';

import { PortfolioConnect, type ParsedData, type PortfolioConnectError } from '@cas-parser/connect';
import { useCallback, useEffect, useState } from 'react';

import { applyCasToReturn } from '@/lib/cas/apply-cas';
import { mapPortfolioConnectToCasResult } from '@/lib/casparser/map-portfolio-connect';
import type { ReturnData } from '@/lib/itr/types';

type SoftJson = {
  ok: boolean;
  message?: string;
  accessToken?: string;
};

/**
 * Portfolio Connect widget: mint at_ token from our backend, then open the
 * casparser import modal (upload / CDSL OTP / MF generator).
 */
export function PortfolioImport({
  data,
  setData,
  setActiveId,
  setNotice,
  prefill,
}: {
  data: ReturnData;
  setData: (next: ReturnData | ((prev: ReturnData) => ReturnData)) => void;
  setActiveId: (id: string) => void;
  setNotice: (message: string | null) => void;
  prefill?: { pan?: string; dob?: string; phone?: string };
}) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);

  const mintToken = useCallback(async () => {
    setLoadingToken(true);
    setTokenError(null);
    try {
      const res = await fetch('/api/casparser/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryMinutes: 30 }),
      });
      const json = (await res.json()) as SoftJson;
      if (!json.ok || !json.accessToken) {
        setAccessToken(null);
        setTokenError(
          json.message ??
            'CASPARSER_API_KEY missing. Paste your Pro key in web/.env.local.',
        );
        return;
      }
      setAccessToken(json.accessToken);
    } catch {
      setAccessToken(null);
      setTokenError('Could not mint a CAS Parser token. Try again after signing in.');
    } finally {
      setLoadingToken(false);
    }
  }, []);

  useEffect(() => {
    void mintToken();
  }, [mintToken]);

  function onSuccess(result: ParsedData) {
    const cas = mapPortfolioConnectToCasResult(result);
    if (!cas) {
      setNotice(
        'Portfolio Connect returned no usable investor data. Try another statement, or enter gains by hand.',
      );
      return;
    }
    const applied = applyCasToReturn(data, cas);
    setData(applied.data);
    setActiveId('CG');
    const pan = cas.investor.pan ? ` · PAN ${cas.investor.pan}` : '';
    setNotice(
      `Portfolio Connect · ${cas.source}${pan} · ${applied.fieldsApplied} CG fields · ${applied.rowsApplied} Schedule 112A rows. Review carefully.`,
    );
  }

  function onError(error: PortfolioConnectError) {
    setNotice(
      error.message ||
        'Portfolio import failed. Upload a CAS PDF, or enter capital gains by hand.',
    );
  }

  if (loadingToken) {
    return (
      <button type="button" className="ntx-btn ntx-btn-secondary" disabled>
        Preparing import…
      </button>
    );
  }

  if (!accessToken) {
    return (
      <div className="space-y-2">
        <p className="text-[var(--body-sm)] text-[var(--notice-text)]">
          {tokenError ?? 'Access token unavailable.'}
        </p>
        <button type="button" className="ntx-btn ntx-btn-secondary" onClick={() => void mintToken()}>
          Retry token
        </button>
      </div>
    );
  }

  return (
    <PortfolioConnect
      accessToken={accessToken}
      config={{
        enableGenerator: true,
        enableCdslFetch: true,
        enableInbox: false,
        title: 'Import investments into NRITAX',
        subtitle: 'Upload CAS, fetch CDSL via OTP, or request a mutual-fund statement',
        prefill: {
          pan: prefill?.pan,
          dob: prefill?.dob,
          phone: prefill?.phone,
        },
        theme: {
          mode: 'light',
          primary: '#1a3a2f',
        },
        successBehavior: 'close',
      }}
      onSuccess={onSuccess}
      onError={onError}
    >
      {({ open, isReady }) => (
        <button
          type="button"
          className="ntx-btn ntx-btn-credit"
          disabled={!isReady}
          onClick={open}
        >
          Import portfolio (CAS / CDSL)
        </button>
      )}
    </PortfolioConnect>
  );
}
