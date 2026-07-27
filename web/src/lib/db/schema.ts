/**
 * NRITAX — Postgres schema.
 *
 * The first four tables are the Auth.js drizzle adapter's shape. Their column
 * names are the adapter's, camelCase and snake_case mixed as it has them,
 * because @auth/drizzle-adapter addresses those columns by name; renaming one
 * breaks sign-in at runtime with no compile error. Everything below them is
 * ours.
 *
 * There is no column for the taxpayer's Income Tax portal password. We never
 * ask for it — see the security rules in docs/CONTRACTS.md.
 */

import type { AdapterAccountType } from '@auth/core/adapters';
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import type { ConsentStatus, EriProviderName } from '@/lib/eri/types';
import type { FormType, Regime, ResidentialStatus, ReturnData } from '@/lib/itr/types';

/**
 * How far a return has got. 'validated' means the CBDT rules passed,
 * 'uploaded' means the portal accepted the JSON, 'verified' means the taxpayer
 * completed e-verification, 'processed' means the department finished with it.
 */
export type FilingStatus = 'draft' | 'validated' | 'uploaded' | 'verified' | 'processed';

/** A primary key we generate ourselves, so an insert needs no round trip. */
const primaryId = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/* ─────────────────────────── Auth.js tables ─────────────────────────── */

export const users = pgTable('user', {
  id: primaryId(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ─────────────────────────── NRITAX tables ─────────────────────────── */

export const taxpayers = pgTable(
  'taxpayer',
  {
    id: primaryId(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pan: text('pan').notNull(),
    name: text('name').notNull(),
    /** ISO yyyy-mm-dd, held as text so no timezone can shift the day. */
    dateOfBirth: text('dateOfBirth').notNull(),
    residentialStatus: text('residentialStatus').$type<ResidentialStatus>().notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  // One PAN per user. Two users may legitimately hold the same PAN — a
  // preparer and the taxpayer — so the constraint is not global.
  (t) => [uniqueIndex('taxpayer_user_pan_idx').on(t.userId, t.pan)],
);

export const filings = pgTable(
  'filing',
  {
    id: primaryId(),
    taxpayerId: text('taxpayerId')
      .notNull()
      .references(() => taxpayers.id, { onDelete: 'cascade' }),
    assessmentYear: text('assessmentYear').notNull(),
    form: text('form').$type<FormType>().notNull(),
    regime: text('regime').$type<Regime>().notNull(),
    status: text('status').$type<FilingStatus>().notNull().default('draft'),
    data: jsonb('data').$type<ReturnData>().notNull(),
    acknowledgementNumber: text('acknowledgementNumber'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('filing_taxpayer_idx').on(t.taxpayerId),
    uniqueIndex('filing_year_form_idx').on(t.taxpayerId, t.assessmentYear, t.form),
  ],
);

export const consents = pgTable('consent', {
  id: primaryId(),
  taxpayerId: text('taxpayerId')
    .notNull()
    .references(() => taxpayers.id, { onDelete: 'cascade' }),
  provider: text('provider').$type<EriProviderName>().notNull(),
  /** The provider's own identifier for the consent, quoted back on every call. */
  consentId: text('consentId').notNull(),
  status: text('status').$type<ConsentStatus>().notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }),
});

export const auditLog = pgTable('audit_log', {
  id: primaryId(),
  filingId: text('filingId')
    .notNull()
    .references(() => filings.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  detail: jsonb('detail').$type<Record<string, unknown>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});
