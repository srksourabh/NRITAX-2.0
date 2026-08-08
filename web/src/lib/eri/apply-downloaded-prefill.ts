/**
 * Applies a downloaded prefill artifact (portal camelCase or Form_ITR*) into ReturnData.
 */

import { applyPrefill } from '@/lib/eri/prefill-mapper';
import {
  applyPrefillToReturn,
  importPrefillFile,
  PrefillFileError,
  type PrefillFileResult,
} from '@/lib/eri/prefill-file';
import {
  describePortalPrefillInventory,
  inventoryPortalPrefill,
  isPortalPrefillShape,
  portalPrefillToPayload,
} from '@/lib/eri/portal-prefill-adapter';
import type { FormType, ReturnData } from '@/lib/itr/types';
import { writePrefillArtifact } from '@/lib/session/prefill-artifact';

export type ApplyDownloadedPrefillResult = {
  data: ReturnData;
  form: FormType;
  matched: number;
  message: string;
  kind: 'portal' | 'file';
};

export function applyDownloadedPrefill(
  prev: ReturnData,
  artifactJson: string,
  options: {
    form: FormType;
    expectPan?: string;
    assessmentYear: string;
    cache?: boolean;
  },
): ApplyDownloadedPrefillResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(artifactJson) as unknown;
  } catch {
    throw new PrefillFileError('That file is not JSON we can read.', 'NOT_JSON');
  }

  if (isPortalPrefillShape(parsed)) {
    const payload = portalPrefillToPayload(parsed, {
      assessmentYear: options.assessmentYear,
      expectPan: options.expectPan,
    });
    if (options.expectPan && payload.pan && payload.pan !== options.expectPan.toUpperCase()) {
      throw new PrefillFileError(
        'That pre-fill file belongs to a different PAN.',
        'WRONG_PAN',
      );
    }
    const form = options.form;
    const { data, applied } = applyPrefill(prev, payload, form);
    const inv = inventoryPortalPrefill(payload);
    if (options.cache !== false) {
      writePrefillArtifact({
        pan: payload.pan || options.expectPan || '',
        assessmentYear: options.assessmentYear,
        form,
        artifactJson,
        savedAt: new Date().toISOString(),
      });
    }
    return {
      data: {
        ...data,
        meta: { ...data.meta, form },
      },
      form,
      matched: applied.length,
      message:
        applied.length > 0
          ? `Inserted ${applied.length} prefill values into your ${form} form. ${describePortalPrefillInventory(inv)}`
          : `Prefill downloaded for ${form}, but none of its fields matched. ${describePortalPrefillInventory(inv)}`,
      kind: 'portal',
    };
  }

  const imported: PrefillFileResult = importPrefillFile(parsed, {
    form: options.form,
    expectPan: options.expectPan,
  });
  if (options.cache !== false) {
    writePrefillArtifact({
      pan: imported.pan || options.expectPan || '',
      assessmentYear: options.assessmentYear,
      form: imported.form,
      artifactJson,
      savedAt: new Date().toISOString(),
    });
  }
  return {
    data: applyPrefillToReturn(prev, imported),
    form: imported.form,
    matched: imported.matched,
    message:
      imported.matched > 0
        ? `Inserted ${imported.matched} prefill values into your ${imported.form} form (AY ${options.assessmentYear}). Review the continuous form and add anything the portal left blank.`
        : `Prefill downloaded for ${imported.form}, but none of its fields matched. Upload JSON manually or use live assist.`,
    kind: 'file',
  };
}
