import type { OnboardingData } from "../types/onboarding";
import type { ValidationServiceResult } from "./validationService";

export type JsonGenerationResult = {
  jsonReferenceId: string;
  status: "mock-generated";
  preview: {
    assessmentYear: string;
    formType: string;
    taxpayerName: string;
    country: string;
    taxRegimePreference: OnboardingData["taxRegime"];
    hasIncomeTaxLoginCredentials: OnboardingData["credentialStatus"];
  };
};

export async function generateFilingJsonDraft(
  data: OnboardingData,
  validation: ValidationServiceResult
): Promise<JsonGenerationResult> {
  // Backend connection point:
  // Replace this mock with Sourabh Sir's JSON Preparation Engine API call.
  // Suggested future endpoint: POST /api/v1/filing-json/drafts
  await delay(500);

  return {
    jsonReferenceId: `JSON-MOCK-${validation.referenceId}`,
    status: "mock-generated",
    preview: {
      assessmentYear: "AY 2026-27",
      formType: "ITR-2/ITR-3 routing pending",
      taxpayerName: data.fullName,
      country: data.country,
      taxRegimePreference: data.taxRegime,
      hasIncomeTaxLoginCredentials: data.credentialStatus
    }
  };
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}
