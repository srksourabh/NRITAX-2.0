/**
 * Soft-fail Sandbox OCR client for Form 16 and Form 26AS PDFs.
 *
 * Auth is shared with the KYC Sandbox client (same token cache). Ops failures
 * return an OcrError — nothing here throws. Uploaded PDF bytes are never stored.
 */

import {
  clearSandboxTokenCache,
  createSandboxClient,
  type SandboxAuthContext,
  type SandboxClientOptions,
} from '@/lib/sandbox/client';
import {
  OCR_SOFT_FAIL_MESSAGE,
  type Form16Data,
  type Form16Result,
  type Form26AsData,
  type Form26AsResult,
  type OcrError,
  type OcrResponse,
} from '@/lib/sandbox/ocr-types';

const API_VERSION = '1.0';
const OCR_TIMEOUT_MS = 60_000;

export type OcrClientOptions = SandboxClientOptions;

export interface OcrClient {
  readForm16(input: {
    file: Uint8Array;
    fileName: string;
    password?: string;
  }): Promise<OcrResponse>;
  readForm26As(input: {
    file: Uint8Array;
    fileName: string;
  }): Promise<OcrResponse>;
}

export function createOcrClient(options: OcrClientOptions = {}): OcrClient {
  return new HttpOcrClient(options);
}

class HttpOcrClient implements OcrClient {
  private readonly options: OcrClientOptions;

  constructor(options: OcrClientOptions) {
    this.options = {
      ...options,
      timeoutMs: options.timeoutMs ?? OCR_TIMEOUT_MS,
    };
  }

  async readForm16(input: {
    file: Uint8Array;
    fileName: string;
    password?: string;
  }): Promise<OcrResponse> {
    const qs = input.password
      ? `?password=${encodeURIComponent(input.password)}`
      : '';
    return this.readPdf({
      path: `/it/ocr/form-16/pdf${qs}`,
      file: input.file,
      fileName: input.fileName,
      kind: 'form16',
    });
  }

  async readForm26As(input: {
    file: Uint8Array;
    fileName: string;
  }): Promise<OcrResponse> {
    return this.readPdf({
      path: '/it/ocr/form-26as/pdf',
      file: input.file,
      fileName: input.fileName,
      kind: 'form26as',
    });
  }

  private async readPdf(args: {
    path: string;
    file: Uint8Array;
    fileName: string;
    kind: 'form16' | 'form26as';
  }): Promise<OcrResponse> {
    const sandbox = createSandboxClient(this.options);
    let ctx = await sandbox.authContext();
    if (!ctx.ok) {
      return fail(
        ctx.code === 'AUTH_FAILED' ? 'AUTH_FAILED' : 'UNAVAILABLE',
        OCR_SOFT_FAIL_MESSAGE,
      );
    }

    const bytes = new Uint8Array(args.file);
    const buildBody = () => {
      const body = new FormData();
      body.append('file', new Blob([bytes], { type: 'application/pdf' }), args.fileName);
      return body;
    };

    let response: Response;
    try {
      response = await postPdf(ctx, args.path, buildBody());
    } catch {
      return fail('UNAVAILABLE', OCR_SOFT_FAIL_MESSAGE);
    }

    if (response.status === 401) {
      clearSandboxTokenCache();
      ctx = await sandbox.authContext();
      if (!ctx.ok) return fail('AUTH_FAILED', OCR_SOFT_FAIL_MESSAGE);
      try {
        response = await postPdf(ctx, args.path, buildBody());
      } catch {
        return fail('UNAVAILABLE', OCR_SOFT_FAIL_MESSAGE);
      }
    }

    const payload = await readJson(response);
    if (!response.ok) {
      const message =
        isRecord(payload) && typeof payload.message === 'string' && payload.message
          ? payload.message
          : OCR_SOFT_FAIL_MESSAGE;
      return fail(response.status >= 500 ? 'UNAVAILABLE' : 'PARSE_FAILED', message);
    }

    return asOcrResult(payload, args.kind);
  }
}

function postPdf(ctx: SandboxAuthContext, path: string, body: FormData): Promise<Response> {
  return ctx.fetch(`${ctx.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: ctx.accessToken,
      'x-api-key': ctx.apiKey,
      'x-api-version': API_VERSION,
      accept: 'application/json',
    },
    body,
    signal: AbortSignal.timeout(ctx.timeoutMs),
  });
}

/* ─────────────────────────── helpers ─────────────────────────── */

const fail = (code: OcrError['code'], message: string): OcrError => ({
  ok: false,
  code,
  message,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function asOcrResult(
  payload: unknown,
  kind: 'form16' | 'form26as',
): OcrResponse {
  if (!isRecord(payload)) {
    return fail('PARSE_FAILED', OCR_SOFT_FAIL_MESSAGE);
  }
  const code = payload.code;
  if (typeof code === 'number' && code !== 200) {
    const message =
      typeof payload.message === 'string' && payload.message
        ? payload.message
        : OCR_SOFT_FAIL_MESSAGE;
    return fail('PARSE_FAILED', message);
  }

  const data = payload.data;
  if (!isRecord(data)) {
    return fail('PARSE_FAILED', OCR_SOFT_FAIL_MESSAGE);
  }

  const transactionId =
    typeof payload.transaction_id === 'string' ? payload.transaction_id : undefined;

  if (kind === 'form16') {
    const result: Form16Result = {
      ok: true,
      kind: 'form16',
      data: data as Form16Data,
      transactionId,
    };
    return result;
  }

  const result: Form26AsResult = {
    ok: true,
    kind: 'form26as',
    data: data as Form26AsData,
    transactionId,
  };
  return result;
}

/** Clears the shared Sandbox token cache (tests). */
export function resetOcrAuthCache(): void {
  clearSandboxTokenCache();
}
