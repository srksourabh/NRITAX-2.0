-- NRITAX 2.0 — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run (all statements are CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- Auth.js tables (required by @auth/supabase-adapter)
create table if not exists "user" (
  id text primary key,
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text
);

create table if not exists account (
  "userId" text not null references "user"(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, "providerAccountId")
);

create table if not exists session (
  "sessionToken" text primary key,
  "userId" text not null references "user"(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists "verificationToken" (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- Taxpayer profile
create table if not exists taxpayer (
  id text primary key default gen_random_uuid()::text,
  "userId" text not null references "user"(id) on delete cascade,
  pan text not null,
  name text not null,
  "dateOfBirth" text not null,
  "residentialStatus" text not null,
  "createdAt" timestamptz default now() not null,
  unique ("userId", pan)
);

-- Filing draft + lifecycle
create table if not exists filing (
  id text primary key default gen_random_uuid()::text,
  "taxpayerId" text not null references taxpayer(id) on delete cascade,
  "assessmentYear" text not null,
  form text not null,
  regime text not null,
  status text default 'draft' not null,
  "caStatus" text default 'none' not null,
  data jsonb not null,
  "acknowledgementNumber" text,
  "eriConsentId" text,
  "uploadedAt" timestamptz,
  "verifiedAt" timestamptz,
  "eVerifyMethod" text,
  "utilityValidated" text,
  "snapshotHash" text,
  "createdAt" timestamptz default now() not null,
  "updatedAt" timestamptz default now() not null,
  unique ("taxpayerId", "assessmentYear", form)
);

create index if not exists filing_taxpayer_idx on filing ("taxpayerId");

-- Append-only filing event log (full history)
create table if not exists filing_event (
  id text primary key default gen_random_uuid()::text,
  "filingId" text not null references filing(id) on delete cascade,
  event text not null,
  actor text not null default 'system',
  detail jsonb,
  "createdAt" timestamptz default now() not null
);

create index if not exists filing_event_filing_idx on filing_event ("filingId");

-- Immutable approved JSON snapshots
create table if not exists return_snapshot (
  id text primary key default gen_random_uuid()::text,
  "filingId" text not null references filing(id) on delete cascade,
  version integer not null default 1,
  "jsonHash" text not null,
  json jsonb not null,
  "softwareId" text not null,
  "schemaVersion" text not null,
  "approvedByUserId" text references "user"(id),
  "approvedAt" timestamptz,
  "createdAt" timestamptz default now() not null,
  unique ("filingId", version)
);

-- Entitlements / plan access
create table if not exists entitlement (
  id text primary key default gen_random_uuid()::text,
  "userId" text not null references "user"(id) on delete cascade,
  plan text not null,
  status text default 'active' not null,
  "providerPaymentId" text,
  "paidAt" timestamptz,
  "createdAt" timestamptz default now() not null,
  unique ("userId")
);

-- CA booking slots
create table if not exists ca_slot (
  id text primary key default gen_random_uuid()::text,
  "startsAt" timestamptz not null,
  "endsAt" timestamptz not null,
  capacity integer default 1 not null,
  reserved integer default 0 not null
);

-- CA bookings
create table if not exists ca_booking (
  id text primary key default gen_random_uuid()::text,
  "userId" text not null references "user"(id) on delete cascade,
  "filingId" text references filing(id) on delete set null,
  "slotId" text not null references ca_slot(id) on delete cascade,
  status text default 'scheduled' not null,
  "attendeeEmail" text not null,
  "caBrief" text,
  "createdAt" timestamptz default now() not null
);

-- ERI / DigiLocker consent records
create table if not exists consent (
  id text primary key default gen_random_uuid()::text,
  "taxpayerId" text not null references taxpayer(id) on delete cascade,
  provider text not null,
  "consentId" text not null,
  status text not null,
  "expiresAt" timestamptz
);

-- Audit log
create table if not exists audit_log (
  id text primary key default gen_random_uuid()::text,
  "filingId" text not null references filing(id) on delete cascade,
  event text not null,
  detail jsonb,
  "createdAt" timestamptz default now() not null
);

-- Lifecycle / transport / residency extensions (safe to re-run)
alter table filing add column if not exists "transportMode" text;
alter table filing add column if not exists "transportStatus" text default 'none';
alter table filing add column if not exists "validationStages" jsonb;
alter table filing add column if not exists "residencyFacts" jsonb;
alter table filing add column if not exists "consentState" text default 'draft';
alter table filing add column if not exists "approvedSnapshotId" text;
alter table filing add column if not exists "refundStatus" text;
alter table filing add column if not exists "itrvStatus" text;

-- Evidence / provenance ledger
create table if not exists evidence (
  id text primary key default gen_random_uuid()::text,
  "filingId" text not null references filing(id) on delete cascade,
  "fieldKey" text,
  source text not null,
  "artifactId" text,
  label text,
  value jsonb,
  "createdAt" timestamptz default now() not null
);

create index if not exists evidence_filing_idx on evidence ("filingId");

-- AIS / 26AS import records
create table if not exists tax_import (
  id text primary key default gen_random_uuid()::text,
  "filingId" text not null references filing(id) on delete cascade,
  kind text not null,
  "sourceName" text,
  summary jsonb,
  records jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz default now() not null
);

create index if not exists tax_import_filing_idx on tax_import ("filingId");

-- Mismatch center rows
create table if not exists mismatch (
  id text primary key default gen_random_uuid()::text,
  "filingId" text not null references filing(id) on delete cascade,
  code text not null,
  severity text not null default 'advisory',
  title text not null,
  detail text,
  "declaredValue" jsonb,
  "importedValue" jsonb,
  decision text default 'open',
  reason text,
  "updatedAt" timestamptz default now() not null,
  "createdAt" timestamptz default now() not null
);

create index if not exists mismatch_filing_idx on mismatch ("filingId");

-- Capital-gain lots
create table if not exists gain_lot (
  id text primary key default gen_random_uuid()::text,
  "filingId" text not null references filing(id) on delete cascade,
  isin text,
  symbol text,
  "buyDate" text,
  "sellDate" text,
  quantity numeric,
  "buyValue" numeric,
  "sellValue" numeric,
  "gainAmount" numeric,
  "holdingKind" text,
  "createdAt" timestamptz default now() not null
);

create index if not exists gain_lot_filing_idx on gain_lot ("filingId");
