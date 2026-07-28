/**
 * CAMS / KFintech Detailed CAS PDFs are almost always locked with the
 * taxpayer's PAN. Prefer an explicit override, then the PAN already on the
 * return, so the uploader does not ask for a password on the happy path.
 */

/** Resolve the PDF password: override wins, otherwise the PAN (uppercased). */
export function resolveCasPdfPassword(
  pan: string | null | undefined,
  override?: string | null,
): string | undefined {
  const explicit = override?.trim();
  if (explicit) return explicit;
  const fromPan = pan?.trim().toUpperCase();
  return fromPan || undefined;
}

/** Soft-failure copy keyed by the CAS service error code. */
export function casFailureMessage(
  code: string | undefined,
  fallback?: string,
): string {
  switch (code) {
    case 'BAD_PASSWORD':
      return (
        'Wrong PDF password. Enter the password used when the statement was emailed ' +
        '(usually your PAN), or type capital gains in Schedule CG by hand.'
      );
    case 'UNSUPPORTED_FORMAT':
      return (
        'That PDF is not a Detailed CAMS/KFintech CAS (NSDL/CDSL holdings and Summary ' +
        'statements cannot fill Schedule CG). Request a Detailed statement and try again, ' +
        'or enter gains by hand.'
      );
    case 'SERVICE_UNAVAILABLE':
      return (
        'CAS parsing is unavailable right now. Enter capital gains manually in Schedule CG.'
      );
    case 'PARSE_FAILED':
      return (
        fallback ||
        'The statement could not be read. Use a Detailed CAMS/KFintech PDF, or enter gains by hand.'
      );
    default:
      return (
        fallback ||
        'CAS unavailable. Enter capital gains in Schedule CG by hand.'
      );
  }
}
