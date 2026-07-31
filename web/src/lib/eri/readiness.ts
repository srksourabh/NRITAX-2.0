/**
 * Explains which ERI / handoff path is configured so the UI can guide the user.
 */

import { readEriConfig } from '@/lib/eri';
import { sandboxEriReady } from '@/lib/eri/sandbox-compliance';
import { quickoReferUrl } from '@/lib/eri/quicko-refer';
import type { EriConfig, EriProviderName } from '@/lib/eri/types';
import { PLACEHOLDER_SOFTWARE_ID } from '@/lib/itr/validate';

export interface EriReadiness {
  provider: EriProviderName;
  live: boolean;
  mode: 'mock' | 'sandbox_eri' | 'quicko_refer' | 'unavailable';
  summary: string;
  nextSteps: string[];
  referUrl?: string;
  missing: string[];
}

export function describeEriReadiness(config: EriConfig = readEriConfig()): EriReadiness {
  if (config.provider === 'mock') {
    return {
      provider: 'mock',
      live: true,
      mode: 'mock',
      summary: 'Offline mock ERI (demo acknowledgements only).',
      nextSteps: [
        'Recommended path: optional browser-automation prefill → complete the return → Download JSON → upload on the Income Tax portal.',
        'Live ERI submit is deferred until you register as an ERI or rent Compliance APIs with ITD credentials.',
      ],
      missing: [],
    };
  }

  if (config.provider === 'quicko') {
    const id = config.quickoAffiliateId?.trim() ?? '';
    if (!id) {
      return {
        provider: 'quicko',
        live: false,
        mode: 'unavailable',
        summary: 'Quicko Refer selected but QUICKO_AFFILIATE_ID is missing.',
        nextSteps: [
          'Create a Quicko partner / Clique affiliate id.',
          'Set QUICKO_AFFILIATE_ID and redeploy.',
        ],
        missing: ['QUICKO_AFFILIATE_ID'],
      };
    }
    return {
      provider: 'quicko',
      live: true,
      mode: 'quicko_refer',
      summary: 'Quicko Refer handoff ready — taxpayer files on Quicko.',
      nextSteps: [
        'Download NRITAX JSON first if you want a local copy.',
        'Use ERI consent to open Quicko and finish filing there.',
      ],
      referUrl: quickoReferUrl(id),
      missing: [],
    };
  }

  if (config.provider === 'sandbox') {
    const missing: string[] = [];
    if (!config.apiKey?.trim()) missing.push('ERI_API_KEY');
    if (!config.apiSecret?.trim()) missing.push('ERI_API_SECRET');
    if (!config.eriUserId?.trim()) missing.push('ERI_USER_ID');
    if (!config.eriPassword?.trim()) missing.push('ERI_PASSWORD');
    const sw = config.softwareId?.trim() ?? '';
    if (!sw || sw === PLACEHOLDER_SOFTWARE_ID) missing.push('ERI_SOFTWARE_ID (real SW…, not placeholder)');
    if (!sandboxEriReady(config)) {
      return {
        provider: 'sandbox',
        live: false,
        mode: 'unavailable',
        summary: 'Sandbox Compliance ERI is not fully configured.',
        nextSteps: [
          'Register as e-Return Intermediary on the Income Tax portal.',
          'Ask Sandbox support to enable Income Tax Compliance / ERI APIs.',
          `Set missing env: ${missing.join(', ') || 'check credentials'}.`,
        ],
        missing,
      };
    }
    return {
      provider: 'sandbox',
      live: true,
      mode: 'sandbox_eri',
      summary: 'Sandbox Compliance ERI credentials present.',
      nextSteps: [
        'Add the taxpayer as an ERI client before submit (OTP UI coming next).',
        'Paid plan required for submit in the product UI.',
      ],
      missing: [],
    };
  }

  return {
    provider: config.provider,
    live: false,
    mode: 'unavailable',
    summary: `Provider "${config.provider}" is named but not implemented yet.`,
    nextSteps: [
      'Use ERI_PROVIDER=quicko for immediate handoff, or sandbox after ITD ERI registration.',
    ],
    missing: ['partner contract'],
  };
}
