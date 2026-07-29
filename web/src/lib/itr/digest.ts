/**
 * Software ID + payload digest helpers for CreationInfo integrity.
 * Works in both Node and the browser (js-sha256).
 */

import { sha256 } from 'js-sha256';

import { PLACEHOLDER_SOFTWARE_ID } from '@/lib/itr/validate';

export function resolveSoftwareId(explicit?: string): string {
  const fromEnv =
    typeof process === 'undefined' ? undefined : process.env.ERI_SOFTWARE_ID?.trim();
  return (explicit?.trim() || fromEnv || PLACEHOLDER_SOFTWARE_ID).trim();
}

export function isPlaceholderSoftwareId(softwareId: string): boolean {
  return softwareId === PLACEHOLDER_SOFTWARE_ID || !softwareId;
}

/**
 * Stable SHA-256 hex digest of the departmental JSON body.
 * Keys are serialized with sorted order so identical payloads hash identically.
 */
export function digestReturnJson(json: unknown): string {
  return sha256(JSON.stringify(sortKeys(json)));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortKeys(obj[key]);
    }
    return out;
  }
  return value;
}
