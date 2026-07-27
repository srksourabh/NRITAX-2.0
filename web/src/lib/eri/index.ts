/**
 * Picks the ERI provider the environment asks for.
 *
 * With ERI_PROVIDER unset, or set to "mock", the whole filing flow runs offline
 * against src/lib/eri/mock.ts. Every other name goes to the REST adapter, which
 * needs ERI_BASE_URL and ERI_API_KEY. Nothing here logs, so no key can leak
 * through this module.
 */

import { createMockProvider } from '@/lib/eri/mock';
import { createSandboxProvider } from '@/lib/eri/sandbox';
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
    softwareId: read(env.ERI_SOFTWARE_ID),
  };
}

/** The provider to file through. Defaults to the offline mock. */
export function getEriProvider(config: EriConfig = readEriConfig()): EriProvider {
  return config.provider === 'mock' ? createMockProvider() : createSandboxProvider(config);
}
