import { randomUUID } from 'node:crypto';

import {
  isTerminal,
  transition,
  type PortalFetchEvent,
  type PortalFetchStatus,
} from './machine.js';

const JOB_TTL_MS = 10 * 60 * 1000;

export interface JobSecrets {
  password: string;
  otp?: string;
}

export interface JobRecord {
  id: string;
  userId: string;
  pan: string;
  name: string;
  dob: string;
  mobile: string;
  assessmentYear: string;
  status: PortalFetchStatus;
  message?: string;
  liveViewUrl?: string;
  artifactJson?: string;
  browserbaseSessionId?: string;
  secrets: JobSecrets | null;
  createdAt: number;
  updatedAt: number;
}

export interface PublicJob {
  id: string;
  status: PortalFetchStatus;
  assessmentYear: string;
  panMasked: string;
  message?: string;
  liveViewUrl?: string;
  artifactJson?: string;
}

function maskPan(pan: string): string {
  const p = pan.trim().toUpperCase();
  if (p.length < 4) return '****';
  return `${p.slice(0, 2)}******${p.slice(-2)}`;
}

export class JobStore {
  private readonly jobs = new Map<string, JobRecord>();

  create(input: {
    userId: string;
    pan: string;
    name: string;
    dob: string;
    mobile: string;
    password: string;
    assessmentYear: string;
  }): JobRecord {
    this.sweep();
    const now = Date.now();
    const job: JobRecord = {
      id: randomUUID(),
      userId: input.userId,
      pan: input.pan.toUpperCase(),
      name: input.name,
      dob: input.dob,
      mobile: input.mobile,
      assessmentYear: input.assessmentYear,
      status: 'queued',
      secrets: { password: input.password },
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  get(id: string): JobRecord | undefined {
    this.sweep();
    return this.jobs.get(id);
  }

  apply(id: string, event: PortalFetchEvent, patch?: Partial<JobRecord>): JobRecord | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    const next = transition(job.status, event);
    if (!next) return null;
    job.status = next;
    job.updatedAt = Date.now();
    if (patch?.message !== undefined) job.message = patch.message;
    if (patch?.liveViewUrl !== undefined) job.liveViewUrl = patch.liveViewUrl;
    if (patch?.artifactJson !== undefined) job.artifactJson = patch.artifactJson;
    if (patch?.browserbaseSessionId !== undefined) {
      job.browserbaseSessionId = patch.browserbaseSessionId;
    }
    if (isTerminal(next)) {
      wipeSecrets(job);
    }
    return job;
  }

  setOtp(id: string, otp: string): JobRecord | null {
    const job = this.jobs.get(id);
    if (!job || job.status !== 'awaiting_otp' || !job.secrets) return null;
    job.secrets.otp = otp;
    job.updatedAt = Date.now();
    return job;
  }

  /** Non-status field updates (session id, live URL, message). */
  patch(
    id: string,
    fields: Partial<
      Pick<
        JobRecord,
        'message' | 'liveViewUrl' | 'artifactJson' | 'browserbaseSessionId'
      >
    >,
  ): JobRecord | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    if (fields.message !== undefined) job.message = fields.message;
    if (fields.liveViewUrl !== undefined) job.liveViewUrl = fields.liveViewUrl;
    if (fields.artifactJson !== undefined) job.artifactJson = fields.artifactJson;
    if (fields.browserbaseSessionId !== undefined) {
      job.browserbaseSessionId = fields.browserbaseSessionId;
    }
    job.updatedAt = Date.now();
    return job;
  }

  toPublic(job: JobRecord): PublicJob {
    const pub: PublicJob = {
      id: job.id,
      status: job.status,
      assessmentYear: job.assessmentYear,
      panMasked: maskPan(job.pan),
    };
    if (job.message) pub.message = job.message;
    if (job.liveViewUrl) pub.liveViewUrl = job.liveViewUrl;
    if (job.status === 'succeeded' && job.artifactJson) {
      pub.artifactJson = job.artifactJson;
    }
    return pub;
  }

  private sweep() {
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      if (now - job.createdAt > JOB_TTL_MS) {
        if (!isTerminal(job.status)) {
          job.status = 'timed_out';
          job.message = 'Job timed out. Upload the prefill JSON manually.';
          wipeSecrets(job);
        } else {
          wipeSecrets(job);
        }
        if (now - job.createdAt > JOB_TTL_MS * 2) {
          this.jobs.delete(id);
        }
      }
    }
  }
}

function wipeSecrets(job: JobRecord) {
  if (job.secrets) {
    job.secrets.password = '';
    job.secrets.otp = undefined;
    job.secrets = null;
  }
}

export const store = new JobStore();
