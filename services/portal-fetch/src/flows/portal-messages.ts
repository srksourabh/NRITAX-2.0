/**
 * Best-effort extraction of visible Income Tax portal error / status text.
 * Prefer surfacing the portal's own wording over a generic NRITAX message.
 */

const AUTH_FAILURE =
  /invalid credentials|incorrect password|wrong password|login failed|invalid (user|password)|pan does not exist|user id does not exist|account (has been )?locked|too many (unsuccessful|failed)|authentication failed|please try again/i;

const NOISE =
  /cookie|javascript|browser|copyright|income tax department|government of india|skip to main/i;

export function isPortalAuthFailure(text: string): boolean {
  return AUTH_FAILURE.test(text);
}

/**
 * Pull a short human-readable message from page HTML / innerText.
 * Returns null when nothing useful is found.
 */
export function extractPortalMessage(raw: string): string | null {
  if (!raw.trim()) return null;

  // Prefer role=alert / error-ish class snippets from HTML.
  const alertMatches = [
    ...raw.matchAll(
      /(?:role=["']alert["']|class=["'][^"']*(?:error|alert|toast|mat-error|invalid)[^"']*["'])[^>]*>([^<]{8,240})</gi,
    ),
  ]
    .map((m) => clean(m[1] ?? ''))
    .filter((s) => s.length >= 8 && !NOISE.test(s));

  if (alertMatches[0]) return truncate(alertMatches[0]);

  // Fall back: first line that looks like a portal auth error.
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

  const lines = text
    .split(/[\n.]+/)
    .map((l) => clean(l))
    .filter((l) => l.length >= 12 && l.length <= 220);

  for (const line of lines) {
    if (isPortalAuthFailure(line)) return truncate(line);
  }

  // Broader: any short "error-ish" sentence near login wording.
  for (const line of lines) {
    if (/password|user id|pan|otp|locked|credentials/i.test(line) && /invalid|incorrect|fail|error|locked|exist/i.test(line)) {
      return truncate(line);
    }
  }

  return null;
}

export function formatPortalFailure(portalText: string | null, fallback: string): string {
  if (portalText) {
    const trimmed = portalText.trim();
    if (/^income tax|^portal:/i.test(trimmed)) return trimmed;
    return `Income Tax portal: ${trimmed}`;
  }
  return fallback;
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function truncate(s: string, max = 220): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
