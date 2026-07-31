# Portal prefill fetch worker

Downloads Income Tax Department pre-filled JSON via Browserbase + Playwright
(Mode A), pausing for OTP and escalating to a live Browserbase session (Mode B)
on CAPTCHA or hard failure. Credentials stay in process memory and are wiped on
terminal status.

## Production (Cloud Run + Browserbase)

Live worker (GCP `experiments-1c2fe`, `asia-south1`):

`https://nritax-portal-fetch-567224747439.asia-south1.run.app`

Health: `GET /health` → `{"status":"ok","mock":false}` when Browserbase keys are set.

Redeploy image:

```bash
docker build -t asia-south1-docker.pkg.dev/experiments-1c2fe/cloud-run-source-deploy/nritax-portal-fetch:latest .
docker push asia-south1-docker.pkg.dev/experiments-1c2fe/cloud-run-source-deploy/nritax-portal-fetch:latest
gcloud run deploy nritax-portal-fetch --image asia-south1-docker.pkg.dev/experiments-1c2fe/cloud-run-source-deploy/nritax-portal-fetch:latest --region asia-south1 --project experiments-1c2fe
```

Vercel Production must have matching `PORTAL_FETCH_URL` + `PORTAL_FETCH_SECRET`.

Alt: repo-root `render.yaml` Blueprint if you prefer Render instead of Cloud Run.

Soft-fail: if the worker is down, the filing wizard still accepts manual prefill JSON upload.

## Run locally

```bash
cd services/portal-fetch
npm install
PORTAL_FETCH_SECRET=dev-portal-fetch-secret PORTAL_FETCH_MOCK=1 npm run dev
```

Without `BROWSERBASE_API_KEY` + `BROWSERBASE_PROJECT_ID`, or with
`PORTAL_FETCH_MOCK=1`, the worker runs a mock A→B flow that returns specimen
prefill JSON (for UI/CI).

## Endpoints

All except `GET /health` require header `X-Portal-Fetch-Token`.

| Method | Path | Role |
| --- | --- | --- |
| GET | `/health` | Liveness |
| POST | `/jobs` | Start job (pan, name, dob, password, mobile, AY) |
| GET | `/jobs/:id` | Public status (+ artifact when succeeded) |
| POST | `/jobs/:id/otp` | Submit OTP |
| POST | `/jobs/:id/live` | Escalate / refresh live assist |
| POST | `/jobs/:id/live-done` | Resume download after live login |

## Env

| Variable | Notes |
| --- | --- |
| `PORTAL_FETCH_SECRET` | Required |
| `PORTAL_FETCH_PORT` | Default `8090` |
| `PORTAL_FETCH_MOCK` | `1` forces mock |
| `BROWSERBASE_API_KEY` | Live Mode A/B |
| `BROWSERBASE_PROJECT_ID` | Live Mode A/B |
