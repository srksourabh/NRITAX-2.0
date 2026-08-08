/**
 * Session-only cache of the portal prefill JSON artifact.
 * Never written to the database; replaced on a new fetch (another PAN/AY).
 */

export const PREFILL_ARTIFACT_KEY = 'nritax.prefillArtifact';

export type PrefillArtifactCache = {
  pan: string;
  assessmentYear: string;
  form: 'ITR2' | 'ITR3';
  artifactJson: string;
  savedAt: string;
};

export function readPrefillArtifact(): PrefillArtifactCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFILL_ARTIFACT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrefillArtifactCache;
    if (!parsed?.artifactJson || !parsed.pan) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePrefillArtifact(cache: PrefillArtifactCache): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PREFILL_ARTIFACT_KEY, JSON.stringify(cache));
}

export function clearPrefillArtifact(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PREFILL_ARTIFACT_KEY);
}
