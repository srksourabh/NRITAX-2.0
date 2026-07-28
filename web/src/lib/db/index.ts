/**
 * The database connection.
 *
 * With DATABASE_URL set we talk to a real Postgres over postgres-js. Without it
 * we run an embedded Postgres — PGlite — persisted under web/.data/nritax, so a
 * developer needs no database installed and no Docker. Same schema, same
 * dialect, one exported `db` either way.
 */

import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';

import * as schema from '@/lib/db/schema';

/** Where the embedded Postgres keeps its files, relative to web/. */
export const EMBEDDED_DATA_DIR = '.data/nritax';

/** The driver-agnostic handle. Both drivers are Postgres, so this is exact. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Set only when we are on the embedded driver; runMigrations needs the client. */
let embedded: PGlite | null = null;
let cached: Database | null = null;

function connect(): Database {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return drizzlePostgres(url, { schema });

  // Vercel (and similar) have no durable disk for PGlite. Use an in-memory
  // database so auth and drafts still work within a single serverless invoke.
  // Set DATABASE_URL to a real Postgres for persistence across deploys.
  if (process.env.VERCEL) {
    embedded = new PGlite();
    return drizzlePglite({ client: embedded, schema });
  }

  // Absolute path — relative dirs + Next Turbopack have produced
  // `path` TypeErrors (`Received an instance of URL`) on Windows.
  const dataDir = path.resolve(process.cwd(), EMBEDDED_DATA_DIR);
  mkdirSync(path.dirname(dataDir), { recursive: true });
  embedded = new PGlite(dataDir);
  return drizzlePglite({ client: embedded, schema });
}

/** Open the database on first use — not at import time during `next build`. */
export function getDb(): Database {
  if (!cached) cached = connect();
  return cached;
}

/** @deprecated Prefer getDb(); kept for call sites that already import `db`. */
export const db: Database = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
}) as Database;

/**
 * The embedded database's DDL, kept in step with schema.ts by hand.
 *
 * A real Postgres is migrated with drizzle-kit — `npm run db:push` — which
 * needs a connection string the embedded driver does not have. This is the
 * equivalent for the zero-install path: idempotent, so it can run on every
 * boot. Constraint names are drizzle-kit's own, so pointing drizzle-kit at
 * this file later reports no drift.
 */
const EMBEDDED_SCHEMA = `
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text,
  "email" text,
  "emailVerified" timestamp,
  "image" text,
  CONSTRAINT "user_email_unique" UNIQUE("email")
);
CREATE TABLE IF NOT EXISTS "account" (
  "userId" text NOT NULL,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId"),
  CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId")
    REFERENCES "user"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "session" (
  "sessionToken" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "expires" timestamp NOT NULL,
  CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId")
    REFERENCES "user"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "verificationToken" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
CREATE TABLE IF NOT EXISTS "taxpayer" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "pan" text NOT NULL,
  "name" text NOT NULL,
  "dateOfBirth" text NOT NULL,
  "residentialStatus" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "taxpayer_userId_user_id_fk" FOREIGN KEY ("userId")
    REFERENCES "user"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "taxpayer_user_pan_idx" ON "taxpayer" ("userId","pan");
CREATE TABLE IF NOT EXISTS "filing" (
  "id" text PRIMARY KEY NOT NULL,
  "taxpayerId" text NOT NULL,
  "assessmentYear" text NOT NULL,
  "form" text NOT NULL,
  "regime" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "caStatus" text DEFAULT 'none' NOT NULL,
  "data" jsonb NOT NULL,
  "acknowledgementNumber" text,
  "eriConsentId" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "filing_taxpayerId_taxpayer_id_fk" FOREIGN KEY ("taxpayerId")
    REFERENCES "taxpayer"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "filing_taxpayer_idx" ON "filing" ("taxpayerId");
CREATE UNIQUE INDEX IF NOT EXISTS "filing_year_form_idx"
  ON "filing" ("taxpayerId","assessmentYear","form");
CREATE TABLE IF NOT EXISTS "entitlement" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "plan" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "providerPaymentId" text,
  "paidAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "entitlement_userId_user_id_fk" FOREIGN KEY ("userId")
    REFERENCES "user"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "entitlement_user_idx" ON "entitlement" ("userId");
CREATE TABLE IF NOT EXISTS "ca_slot" (
  "id" text PRIMARY KEY NOT NULL,
  "startsAt" timestamp NOT NULL,
  "endsAt" timestamp NOT NULL,
  "capacity" integer DEFAULT 1 NOT NULL,
  "reserved" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS "ca_booking" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "filingId" text,
  "slotId" text NOT NULL,
  "status" text DEFAULT 'scheduled' NOT NULL,
  "attendeeEmail" text NOT NULL,
  "caBrief" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ca_booking_userId_user_id_fk" FOREIGN KEY ("userId")
    REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "ca_booking_slotId_ca_slot_id_fk" FOREIGN KEY ("slotId")
    REFERENCES "ca_slot"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "consent" (
  "id" text PRIMARY KEY NOT NULL,
  "taxpayerId" text NOT NULL,
  "provider" text NOT NULL,
  "consentId" text NOT NULL,
  "status" text NOT NULL,
  "expiresAt" timestamp,
  CONSTRAINT "consent_taxpayerId_taxpayer_id_fk" FOREIGN KEY ("taxpayerId")
    REFERENCES "taxpayer"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "filingId" text NOT NULL,
  "event" text NOT NULL,
  "detail" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "audit_log_filingId_filing_id_fk" FOREIGN KEY ("filingId")
    REFERENCES "filing"("id") ON DELETE cascade
);
`;

/** Additive patches for existing embedded DBs created before phase-2 tables. */
const EMBEDDED_PATCHES = `
ALTER TABLE "filing" ADD COLUMN IF NOT EXISTS "caStatus" text DEFAULT 'none' NOT NULL;
ALTER TABLE "filing" ADD COLUMN IF NOT EXISTS "eriConsentId" text;
`;

let created = false;

/**
 * Creates the tables the embedded driver needs, once per process. A no-op on a
 * real Postgres, which drizzle-kit migrates instead. Safe to call on every
 * request.
 */
export async function runMigrations(): Promise<void> {
  // Ensure the embedded client exists before checking it — callers often
  // migrate before the first getDb()/auth() touch.
  getDb();
  if (!embedded || created) return;
  await embedded.exec(EMBEDDED_SCHEMA);
  await embedded.exec(EMBEDDED_PATCHES);
  created = true;
}
