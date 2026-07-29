import type { JsonGenerationResult } from "./jsonGenerationService";
import { mockDelay } from "./mockDelay";

export const FILING_ENGINE_ENDPOINT = "/api/v1/filing/workflows";

export type FilingEngineResult = {
  workflowReferenceId: string;
  status: "mock-ready";
  nextSteps: string[];
};

export async function prepareFilingWorkflow(
  jsonDraft: JsonGenerationResult
): Promise<FilingEngineResult> {
  // Backend connection point:
  // Replace this mock with the future ITR filing workflow / ERI integration API.
  // Suggested future endpoint: POST /api/v1/filing/workflows
  await mockDelay();

  return {
    workflowReferenceId: `FILE-MOCK-${jsonDraft.jsonReferenceId}`,
    status: "mock-ready",
    nextSteps: [
      "Route draft for CA review",
      "Confirm ERI or portal filing path",
      "Collect final user consent before submission"
    ]
  };
}
