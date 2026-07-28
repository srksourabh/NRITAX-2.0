import type { OnboardingData, OnboardingErrors } from "../types/onboarding";

const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function validateOnboardingStep(stepIndex: number, data: OnboardingData): OnboardingErrors {
  const errors: OnboardingErrors = {};

  if (stepIndex === 0) {
    if (data.fullName.trim().length < 2) {
      errors.fullName = "Enter the user's full name.";
    }

    if (data.country.trim().length < 2) {
      errors.country = "Enter the country of residence.";
    }
  }

  if (stepIndex === 1) {
    if (!data.pan.trim()) {
      errors.pan = "Enter the PAN number.";
    } else if (!panPattern.test(data.pan.trim().toUpperCase())) {
      errors.pan = "Enter a valid PAN format, for example ABCDE1234F.";
    }
  }

  if (stepIndex === 2 && !data.taxRegime) {
    errors.taxRegime = "Select a tax regime preference.";
  }

  if (stepIndex === 3 && !data.credentialStatus) {
    errors.credentialStatus = "Select whether the user has Income Tax Department login credentials.";
  }

  return errors;
}

export function hasValidationErrors(errors: OnboardingErrors) {
  return Object.keys(errors).length > 0;
}

export function normalizePan(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}
