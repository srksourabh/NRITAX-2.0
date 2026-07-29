/**
 * Plain TypeScript interfaces mirroring the Supabase PostgreSQL schema.
 * Used for type safety in all DB queries — no ORM required.
 */

import type { FormType, Regime, ResidentialStatus, ReturnData } from '@/lib/itr/types';

export type FilingStatus = 'draft' | 'validated' | 'uploaded' | 'verified' | 'processed';
export type CaFilingStatus =
  | 'none'
  | 'requested'
  | 'scheduled'
  | 'ca_changes_needed'
  | 'approved'
  | 'cancelled';
export type EntitlementPlan = 'self_serve' | 'ca_assisted';
export type EntitlementStatus = 'active' | 'expired' | 'refunded';
export type ConsentStatus = 'active' | 'revoked' | 'expired';
export type EriProviderName = 'sandbox' | 'casparser' | 'own';

export interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
}

export interface TaxpayerRow {
  id: string;
  userId: string;
  pan: string;
  name: string;
  dateOfBirth: string;
  residentialStatus: ResidentialStatus;
  createdAt: string;
}

export interface FilingRow {
  id: string;
  taxpayerId: string;
  assessmentYear: string;
  form: FormType;
  regime: Regime;
  status: FilingStatus;
  caStatus: CaFilingStatus;
  data: ReturnData;
  acknowledgementNumber: string | null;
  eriConsentId: string | null;
  uploadedAt: string | null;
  verifiedAt: string | null;
  eVerifyMethod: string | null;
  utilityValidated: string | null;
  snapshotHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FilingEventRow {
  id: string;
  filingId: string;
  event: string;
  actor: 'user' | 'ca' | 'system';
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export interface ReturnSnapshotRow {
  id: string;
  filingId: string;
  version: number;
  jsonHash: string;
  json: Record<string, unknown>;
  softwareId: string;
  schemaVersion: string;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface EntitlementRow {
  id: string;
  userId: string;
  plan: EntitlementPlan;
  status: EntitlementStatus;
  providerPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CaSlotRow {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reserved: number;
}

export interface CaBookingRow {
  id: string;
  userId: string;
  filingId: string | null;
  slotId: string;
  status: CaFilingStatus;
  attendeeEmail: string;
  caBrief: string | null;
  createdAt: string;
}

export interface ConsentRow {
  id: string;
  taxpayerId: string;
  provider: EriProviderName;
  consentId: string;
  status: ConsentStatus;
  expiresAt: string | null;
}

export interface AuditLogRow {
  id: string;
  filingId: string;
  event: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

/** Supabase Database generic type for createClient<Database>() */
export interface Database {
  public: {
    Tables: {
      user: { Row: UserRow; Insert: Partial<UserRow>; Update: Partial<UserRow> };
      taxpayer: { Row: TaxpayerRow; Insert: Omit<TaxpayerRow, 'id' | 'createdAt'>; Update: Partial<TaxpayerRow> };
      filing: { Row: FilingRow; Insert: Omit<FilingRow, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<FilingRow> };
      filing_event: { Row: FilingEventRow; Insert: Omit<FilingEventRow, 'id' | 'createdAt'>; Update: never };
      return_snapshot: { Row: ReturnSnapshotRow; Insert: Omit<ReturnSnapshotRow, 'id' | 'createdAt'>; Update: Partial<ReturnSnapshotRow> };
      entitlement: { Row: EntitlementRow; Insert: Omit<EntitlementRow, 'id' | 'createdAt'>; Update: Partial<EntitlementRow> };
      ca_slot: { Row: CaSlotRow; Insert: Omit<CaSlotRow, 'id'>; Update: Partial<CaSlotRow> };
      ca_booking: { Row: CaBookingRow; Insert: Omit<CaBookingRow, 'id' | 'createdAt'>; Update: Partial<CaBookingRow> };
      consent: { Row: ConsentRow; Insert: Omit<ConsentRow, 'id'>; Update: Partial<ConsentRow> };
      audit_log: { Row: AuditLogRow; Insert: Omit<AuditLogRow, 'id' | 'createdAt'>; Update: never };
    };
  };
}
