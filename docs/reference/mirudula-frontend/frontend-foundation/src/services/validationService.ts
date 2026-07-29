import type { OnboardingData } from "../types/onboarding";
import { hasValidationErrors, validateOnboardingStep } from "../validation/onboardingValidation";
import { mockDelay } from "./mockDelay";

export const VALIDATION_ENGINE_ENDPOINT = "/api/v1/validation/onboarding";

export type ValidationServiceResult = {
  isValid: boolean;
  referenceId: string;
  warnings: string[];
};

export async function validateOnboardingData(data: OnboardingData): Promise<ValidationServiceResult> {
  // Backend connection point:
  // Replace this mock with Sourabh Sir's Data Validation Engine API call.
  // Suggested future endpoint: POST /api/v1/validation/onboarding
  await mockDelay();

  const hasInvalidStep = [0, 1, 2, 3].some((stepIndex) =>
    hasValidationErrors(validateOnboardingStep(stepIndex, data))
  );

  return {
    isValid: !hasInvalidStep,
    referenceId: "VAL-MOCK-2026-0001",
    warnings: [
      "Mock validation only. Connect backend validation engine before production.",
      "PAN is not persisted by this frontend mock."
    ]
  };
}
