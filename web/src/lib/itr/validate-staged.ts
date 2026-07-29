/**
 * Three-stage validation pipeline:
 * 1. Internal CBDT rules (existing validateReturn)
 * 2. Generated JSON structural / schema checks
 * 3. Official utility / provider stage (pluggable; stubbed when unavailable)
 */

import { buildReturnJson } from '@/lib/itr/build-json';
import { isPlaceholderSoftwareId } from '@/lib/itr/digest';
import type { ReturnData, ValidationReport } from '@/lib/itr/types';
import { validateReturn } from '@/lib/itr/validate';

export type StageStatus = 'pass' | 'fail' | 'pending' | 'skipped';

export interface StageResult {
  stage: 1 | 2 | 3;
  name: string;
  status: StageStatus;
  message: string;
  findings?: ValidationReport['findings'];
}

export interface StagedValidationReport {
  stages: StageResult[];
  internal: ValidationReport;
  digest: string;
  softwareId: string;
  canUpload: boolean;
  canTransport: boolean;
}

function stage2JsonSchema(data: ReturnData): StageResult {
  const built = buildReturnJson(data);
  const root = built.json as { ITR?: Record<string, unknown> };
  const formNode = root.ITR?.[data.meta.form];
  if (!root.ITR || !formNode || typeof formNode !== 'object') {
    return {
      stage: 2,
      name: 'JSON schema',
      status: 'fail',
      message: 'Generated JSON is missing the ITR envelope or form node.',
    };
  }

  const creation = (formNode as { CreationInfo?: { Digest?: string; SWCreatedBy?: string } })
    .CreationInfo;
  if (!creation?.Digest || creation.Digest === '-' || creation.Digest === 'PENDING') {
    return {
      stage: 2,
      name: 'JSON schema',
      status: 'fail',
      message: 'CreationInfo.Digest is missing or still a placeholder.',
    };
  }

  if (isPlaceholderSoftwareId(built.softwareId)) {
    return {
      stage: 2,
      name: 'JSON schema',
      status: 'fail',
      message: `Software ID is still the placeholder ${built.softwareId}.`,
    };
  }

  return {
    stage: 2,
    name: 'JSON schema',
    status: 'pass',
    message: `Envelope, CreationInfo and digest look valid (${built.digest.slice(0, 12)}…).`,
  };
}

function stage3Utility(_data: ReturnData): StageResult {
  // Provider / offline utility is not wired in this environment yet.
  return {
    stage: 3,
    name: 'Official utility',
    status: 'pending',
    message:
      'Stage 3 is ready as a provider slot. Connect the departmental utility or ERI schema check to complete it.',
  };
}

/** Run all three validation stages and return a combined report. */
export function validateReturnStaged(data: ReturnData): StagedValidationReport {
  const built = buildReturnJson(data);
  const internal = validateReturn(data, { softwareId: built.softwareId });

  const stage1: StageResult = {
    stage: 1,
    name: 'Internal rules',
    status: internal.canUpload ? 'pass' : 'fail',
    message: internal.canUpload
      ? `Category A clear · ${internal.rulesApplied} rules applied.`
      : `${internal.blocking.length} Category A finding(s) would block portal upload.`,
    findings: internal.findings,
  };

  const stage2 = stage2JsonSchema(data);
  const stage3 = stage3Utility(data);

  const canUpload = stage1.status === 'pass' && stage2.status === 'pass';
  // Stage 3 pending does not block manual download / manual transport.
  const canTransport = canUpload;

  return {
    stages: [stage1, stage2, stage3],
    internal,
    digest: built.digest,
    softwareId: built.softwareId,
    canUpload,
    canTransport,
  };
}
