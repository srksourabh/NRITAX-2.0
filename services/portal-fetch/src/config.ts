/** Runtime config for the portal-fetch worker. */

export function portalFetchToken(): string {
  return process.env.PORTAL_FETCH_SECRET ?? '';
}

export function listenPort(): number {
  const n = Number(process.env.PORTAL_FETCH_PORT ?? '8090');
  return Number.isFinite(n) && n > 0 ? n : 8090;
}

export function useMockMode(): boolean {
  if (process.env.PORTAL_FETCH_MOCK === '1') return true;
  const key = process.env.BROWSERBASE_API_KEY ?? '';
  const project = process.env.BROWSERBASE_PROJECT_ID ?? '';
  return !key || !project;
}

export function browserbaseApiKey(): string {
  return process.env.BROWSERBASE_API_KEY ?? '';
}

export function browserbaseProjectId(): string {
  return process.env.BROWSERBASE_PROJECT_ID ?? '';
}

export const PORTAL_HOME =
  process.env.ITD_PORTAL_URL ??
  'https://www.incometax.gov.in/iec/foportal/';
