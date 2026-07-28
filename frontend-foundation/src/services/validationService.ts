import type { OnboardingData } from "../types/onboarding";

export type ValidationServiceResult = {
  isValid: boolean;
  referenceId: string;
  warnings: string[];
};

export async function validateOnboardingData(data: OnboardingData): Promise<ValidationServiceResult> {
  // Backend connection point:
  // Replace this mock with Sourabh Sir's Data Validation Engine API call.
  // Suggested future endpoint: POST /api/v1/validation/onboarding
  await delay(500);

  return {
    isValid: Boolean(data.fullName && data.country && data.pan && data.taxRegime && data.credentialStatus),
    referenceId: "VAL-MOCK-2026-0001",
    warnings: [
      "Mock validation only. Connect backend validation engine before production.",
      "PAN is not persisted by this frontend mock."
    ]
  };
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}
