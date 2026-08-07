/**
 * Best-effort extraction of visible Income Tax portal error / status text.
 * Prefer surfacing the portal's own wording over a generic NRITAX message.
 */

const AUTH_FAILURE =
  /invalid credentials|incorrect password|wrong password|login failed|invalid (user|password)|pan does not exist|user id does not exist|account (has been )?locked|too many (unsuccessful|failed)|authentication failed|please try again|one attempt remaining|attempts? remaining/i;

const ACCOUNT_LOCKED =
  /account (has been )?locked|try after \d+\s*minutes|unlock your account|due to security reasons/i;

const NOISE =
  /cookie|javascript|browser|copyright|income tax department|government of india|skip to main/i;

/** Dialog chrome scraped with the real message. */
const UI_CHROME =
  /^(continue|back|ok|cancel|close|click here|yes|no|submit|login|sign in)(\s+|$)/i;

export function isPortalAuthFailure(text: string): boolean {
  return AUTH_FAILURE.test(text);
}

export function isPortalAccountLocked(text: string): boolean {
  return ACCOUNT_LOCKED.test(text);
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
      /(?:role=["']alert["']|class=["'][^"']*(?:error|alert|toast|mat-error|invalid|mat-dialog)[^"']*["'])[^>]*>([^<]{8,280})</gi,
    ),
  ]
    .map((m) => cleanChrome(m[1] ?? ''))
    .filter((s) => s.length >= 8 && !NOISE.test(s));

  const lockedAlert = alertMatches.find((s) => isPortalAccountLocked(s));
  if (lockedAlert) return truncate(lockedAlert);
  if (alertMatches[0]) return truncate(alertMatches[0]);

  // Fall back: first line that looks like a portal auth error.
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

  const cleaned = cleanChrome(text);
  if (isPortalAccountLocked(cleaned)) {
    const lockedSentence = pickLockedSentence(cleaned);
    if (lockedSentence) return truncate(lockedSentence);
  }

  const lines = cleaned
    .split(/[\n.]+/)
    .map((l) => clean(l))
    .filter((l) => l.length >= 12 && l.length <= 280);

  for (const line of lines) {
    if (isPortalAccountLocked(line)) return truncate(line);
  }
  for (const line of lines) {
    if (isPortalAuthFailure(line)) return truncate(line);
  }

  // Broader: any short "error-ish" sentence near login wording.
  for (const line of lines) {
    if (
      /password|user id|pan|otp|locked|credentials|attempt/i.test(line) &&
      /invalid|incorrect|fail|error|locked|exist|remaining|security/i.test(line)
    ) {
      return truncate(line);
    }
  }

  return null;
}

export function formatPortalFailure(portalText: string | null, fallback: string): string {
  if (portalText) {
    const trimmed = cleanChrome(portalText.trim());
    if (isPortalAccountLocked(trimmed)) {
      return (
        'Income Tax portal: Your e-filing account is locked for security. ' +
        'Wait about 30 minutes, or unlock it on the portal ("Click here" on the lock dialog). ' +
        'Do not retry automation until it unlocks — each failed attempt can extend the lock.'
      );
    }
    if (/^income tax|^portal:/i.test(trimmed)) return trimmed;
    return `Income Tax portal: ${trimmed}`;
  }
  return fallback;
}

function pickLockedSentence(text: string): string | null {
  const match = text.match(
    /Your e-filing account has been locked[\s\S]*?(?:try after \d+\s*minutes[^.]*)?/i,
  );
  if (!match?.[0]) {
    const alt = text.match(/account has been locked[^.]{0,160}/i);
    if (!alt?.[0]) return null;
    return finalizeLocked(cleanChrome(alt[0]), text);
  }
  return finalizeLocked(cleanChrome(match[0]), text);
}

function finalizeLocked(core: string, full: string): string {
  let out = clean(core)
    .replace(/\s+(or to unlock your account now.*)$/i, '')
    .replace(/[,;\s]+$/, '');
  const remaining = full.match(/you have \w+ attempts? remaining/i);
  if (remaining?.[0] && !/attempt/i.test(out)) {
    out = `${out}. ${clean(remaining[0])}`;
  }
  if (!/try after/i.test(out)) {
    const wait = full.match(/try after \d+\s*minutes?/i);
    if (wait?.[0]) {
      out = `${out}. You can ${wait[0].toLowerCase()}`;
    }
  }
  return cleanChrome(out);
}

function cleanChrome(s: string): string {
  let out = clean(s);
  // Strip leading/trailing dialog button labels scraped into the body text.
  out = out.replace(/^(Continue|Back|OK|Cancel|Close|Click here)\s+/gi, '');
  out = out.replace(/\s+(Continue|Back|OK|Cancel|Close|Click here)\s+/gi, ' ');
  out = out.replace(/\s+(Continue|Back|OK|Cancel|Close)\s*$/gi, '');
  // Collapse repeated chrome tokens left in the middle.
  while (UI_CHROME.test(out)) {
    const next = out.replace(UI_CHROME, '').trim();
    if (next === out) break;
    out = next;
  }
  return clean(out);
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function truncate(s: string, max = 280): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
