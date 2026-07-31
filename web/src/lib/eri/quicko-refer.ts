/**
 * Quicko Refer — same-day third-party filing handoff (not a white-label ERI API).
 *
 * Quicko Connect full APIs need app approval from developer@quicko.com.
 * Refer only needs an affiliate_id from Clique and redirects the taxpayer to
 * https://it.quicko.com — Quicko (as ERI) completes filing on their product.
 *
 * NRITAX does not upload departmental JSON through this path. Download JSON
 * first if the taxpayer wants a local copy.
 */

import { EriError } from '@/lib/eri/types';
import type {
  ConsentRequest,
  ConsentResult,
  EriConfig,
  EriProvider,
  FilingStatus,
  PrefillPayload,
  UploadRequest,
  UploadResult,
} from '@/lib/eri/types';

const REFER_HOST = 'https://it.quicko.com';

export function quickoReferUrl(affiliateId: string): string {
  const id = affiliateId.trim();
  return `${REFER_HOST}?affiliate_id=${encodeURIComponent(id)}`;
}

export function createQuickoReferProvider(config: EriConfig): EriProvider {
  const affiliateId = config.quickoAffiliateId?.trim() ?? '';
  const referUrl = affiliateId ? quickoReferUrl(affiliateId) : undefined;

  function requireRefer(): string {
    if (!referUrl) {
      throw new EriError(
        'Quicko Refer needs QUICKO_AFFILIATE_ID. Sign up at Clique / Quicko partner, then set the id in env.',
        'ERI_CONFIG',
      );
    }
    return referUrl;
  }

  return {
    name: 'quicko',
    live: Boolean(referUrl),

    async requestConsent(_input: ConsentRequest): Promise<ConsentResult> {
      const url = requireRefer();
      return {
        consentId: `quicko-refer:${Date.now()}`,
        status: 'granted',
        redirectUrl: url,
        message:
          'Continue on Quicko to file. Download your NRITAX JSON first if you want a backup — this handoff does not upload it.',
        expiresAt: undefined,
      };
    },

    async getConsent(consentId: string): Promise<ConsentResult> {
      const url = requireRefer();
      return {
        consentId,
        status: 'granted',
        redirectUrl: url,
        message: 'Open Quicko to finish filing.',
      };
    },

    async fetchPrefill(): Promise<PrefillPayload> {
      throw new EriError(
        'Quicko Refer does not return prefill into NRITAX. Use ITD JSON upload or Sandbox helpers instead.',
        'ERI_UNSUPPORTED',
      );
    },

    async uploadReturn(_input: UploadRequest): Promise<UploadResult> {
      const url = requireRefer();
      return {
        status: 'pending_verification',
        verificationRedirectUrl: url,
        message:
          'Filing continues on Quicko (third-party ERI). NRITAX does not submit the JSON on this path.',
      };
    },

    async getFilingStatus(input): Promise<FilingStatus> {
      return {
        acknowledgementNumber: input.acknowledgementNumber,
        status: 'pending_verification',
        message: 'Check filing status in the Quicko account or on the Income Tax portal.',
      };
    },
  };
}
