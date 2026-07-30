# Portal Prefill Fetch (A→B via Browserbase)

Date: 2026-07-31  
Status: approved for implementation

## Goal

Optionally download the Income Tax Department pre-filled JSON for a PAN by
driving the e-filing portal in a cloud browser, then feed that file into the
existing `importPrefillFile` path. Manual JSON upload remains available.

## Decisions

| Topic | Choice |
| --- | --- |
| Mode order | A (headless + password) → B (live assist) on CAPTCHA/hard fail |
| Mode C | Deferred (extension / local agent) |
| OTP | User pastes OTP into NRITAX; worker injects it |
| CAPTCHA | Escalate to Mode B (same Browserbase session) |
| Infra | Browserbase + Playwright in `services/portal-fetch` |
| Secrets | Ephemeral in worker memory only; wipe on terminal status; never DB |
| Soft-fail | Missing Browserbase keys / down worker never blocks the wizard |

## Architecture

```
EnrichmentPanels
  → POST /api/portal-fetch/start  (auth’d)
  → portal-fetch worker /jobs
  → Browserbase Chromium → incometax.gov.in
  → GET status / POST otp / POST live
  → artifact JSON → importPrefillFile
```

### Job statuses

`queued` → `logging_in` → `awaiting_otp` → `downloading` → `succeeded`  
or → `needs_live_assist` → (user finishes login in live view) → `downloading` → `succeeded`  
or → `failed` | `timed_out`

### Units

| Unit | Responsibility |
| --- | --- |
| Enrichment UI | Collect PAN, DOB, password, AY; OTP; live-view link; keep manual upload |
| Next.js API | Auth gate; proxy to worker; never log password/OTP |
| portal-fetch worker | Playwright flows; hold secrets; wipe on complete |
| Browserbase | Managed Chromium + debugger URL for Mode B |

## Credential policy (contract change)

Phase 1 previously forbade collecting the portal password. This feature may
collect PAN, DOB, and portal password **only for an active fetch job**:

- Transmitted over HTTPS to the worker
- Held in worker process memory (TTL ≤ 10 minutes)
- Never written to Postgres, logs, or Browserbase recording retention when avoidable
- Wiped on `succeeded`, `failed`, or `timed_out`

## Error handling

| Case | Behavior |
| --- | --- |
| Bad password | `failed` + clear message; wipe secrets |
| OTP timeout | `timed_out`; wipe; offer retry / manual upload |
| CAPTCHA / bot wall | `needs_live_assist` with live URL |
| Portal UI change | `failed` — “portal changed; upload JSON manually” |
| Worker / Browserbase down | Soft-fail; wizard stays usable |
| PAN mismatch vs return | Reject via existing prefill importer rules |

## Legal / ops

Automating incometax.gov.in may conflict with portal terms of service. Treat as
dogfood / internal-first. Rate-limit per user. Do not log credentials. Prefer
session recording off for Mode A.

## Out of scope

- Mode C
- Cross-session password vault
- AIS / 26AS / Form 16 portal pulls
- Replacing ERI registration

## Success criteria

1. With Browserbase configured, a user can start a job, paste OTP if prompted,
   complete live assist if needed, and land prefill fields in the wizard.
2. Without Browserbase or worker, the UI explains the helper is unavailable and
   manual upload still works.
3. Password and OTP never appear in API responses or application logs.
