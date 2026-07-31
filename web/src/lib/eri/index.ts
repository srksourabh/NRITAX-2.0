/**
 * Picks the ERI / filing-handoff provider from the environment.
 *
 * - mock     — offline specimen (default)
 * - quicko   — Quicko Refer redirect (fastest third-party path; needs affiliate id)
 * - sandbox  — Sandbox IT Compliance ERI proxy (needs ITD ERI user + password + SW id)
 * - suvit    — reserved name until a contract exists
 */

import { createMockProvider } from '@/lib/eri/mock';
import { createQuickoReferProvider } from '@/lib/eri/quicko-refer';
import { createSandboxComplianceProvider } from '@/lib/eri/sandbox-compliance';
import { EriError } from '@/lib/eri/types';
import type { EriConfig, EriProvider, EriProviderName } from '@/lib/eri/types';

const PROVIDER_NAMES: readonly EriProviderName[] = ['mock', 'sandbox', 'quicko', 'suvit'];

/** Trimmed value, or undefined when the variable is absent or empty. */
function read(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

/**
 * Builds the provider configuration from environment variables. Throws when
 * ERI_PROVIDER names a provider we do not have, rather than quietly filing
 * nothing through the mock.
 */
export function readEriConfig(
  env: Record<string, string | undefined> = process.env,
): EriConfig {
  const name = read(env.ERI_PROVIDER)?.toLowerCase() ?? 'mock';
  const provider = PROVIDER_NAMES.find((p) => p === name);
  if (!provider) {
    throw new EriError(
      `ERI_PROVIDER is "${name}"; expected one of ${PROVIDER_NAMES.join(', ')}.`,
      'ERI_CONFIG',
    );
  }

  return {
    provider,
    baseUrl: read(env.ERI_BASE_URL),
    apiKey: read(env.ERI_API_KEY),
    apiSecret: read(env.ERI_API_SECRET),
    eriUserId: read(env.ERI_USER_ID),
    eriPassword: read(env.ERI_PASSWORD),
    softwareId: read(env.ERI_SOFTWARE_ID),
    quickoAffiliateId: read(env.QUICKO_AFFILIATE_ID),
  };
}

/** The provider to file through. Defaults to the offline mock. */
export function getEriProvider(config: EriConfig = readEriConfig()): EriProvider {
  switch (config.provider) {
    case 'mock':
      return createMockProvider();
    case 'quicko':
      return createQuickoReferProvider(config);
    case 'sandbox':
      return createSandboxComplianceProvider(config);
    case 'suvit':
      throw new EriError(
        'ERI_PROVIDER=suvit needs a partner contract. Use quicko (Refer) or sandbox (Compliance ERI) meanwhile.',
        'ERI_CONFIG',
      );
    default: {
      const _exhaustive: never = config.provider;
      throw new EriError(`Unknown ERI provider: ${_exhaustive}`, 'ERI_CONFIG');
    }
  }
}
