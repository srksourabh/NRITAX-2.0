import { useState } from "react";

import { FormField } from "./form/FormField";
import { RadioCardGroup, type RadioCardOption } from "./form/RadioCardGroup";
import { SecurityNotice } from "./form/SecurityNotice";
import { StepProgress } from "./form/StepProgress";
import {
  initialOnboardingData,
  type CredentialStatus,
  type OnboardingData,
  type OnboardingErrors,
  type OnboardingStep,
  type TaxRegime
} from "../types/onboarding";
import { hasValidationErrors, normalizePan, validateOnboardingStep } from "../validation/onboardingValidation";
import {
  validateOnboardingData,
  type ValidationServiceResult
} from "../services/validationService";
import {
  generateFilingJsonDraft,
  type JsonGenerationResult
} from "../services/jsonGenerationService";

const steps: OnboardingStep[] = [
  { id: "personal", label: "Personal" },
  { id: "tax", label: "Tax details" },
  { id: "regime", label: "Tax regime" },
  { id: "credentials", label: "ITD access" }
];

const regimeOptions: Array<RadioCardOption<TaxRegime>> = [
  {
    value: "old",
    label: "Old Tax Regime",
    description: "Use deductions and exemptions where applicable."
  },
  {
    value: "new",
    label: "New Tax Regime",
    description: "Use newer slab-based calculation assumptions."
  }
];

const credentialOptions: Array<RadioCardOption<CredentialStatus>> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-sure", label: "Not sure" }
];

export function TaxOnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const [errors, setErrors] = useState<OnboardingErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationServiceResult | null>(null);
  const [jsonResult, setJsonResult] = useState<JsonGenerationResult | null>(null);

  const updateField = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData((previous) => ({ ...previous, [field]: value }));
    setServiceError("");
    setErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateCurrentStep = () => {
    const nextErrors = validateOnboardingStep(currentStep, data);
    setErrors(nextErrors);
    return !hasValidationErrors(nextErrors);
  };

  const handleNext = async () => {
    if (isSubmitting) return;
    if (!validateCurrentStep()) return;
    if (currentStep === steps.length - 1) {
      setIsSubmitting(true);
      setServiceError("");

      try {
        const nextValidationResult = await validateOnboardingData(data);

        if (!nextValidationResult.isValid) {
          setServiceError("Mock validation failed. Please review the onboarding details.");
          return;
        }

        const nextJsonResult = await generateFilingJsonDraft(data, nextValidationResult);
        setValidationResult(nextValidationResult);
        setJsonResult(nextJsonResult);
        setSubmitted(true);
      } catch {
        setServiceError("Unable to complete the mock onboarding workflow. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setCurrentStep((step) => step + 1);
  };

  const handleBack = () => {
    setSubmitted(false);
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleReset = () => {
    setData(initialOnboardingData);
    setErrors({});
    setCurrentStep(0);
    setSubmitted(false);
    setIsSubmitting(false);
    setServiceError("");
    setValidationResult(null);
    setJsonResult(null);
  };

  return (
    <section
      className="animate-rise rounded-[2rem] border border-slate-200 bg-white p-5 shadow-fintech sm:p-6"
      aria-labelledby="onboarding-form-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-blue">Basic onboarding</p>
          <h3 id="onboarding-form-title" className="mt-1 text-2xl font-bold text-brand-ink">
            Start your filing journey
          </h3>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
          Step {currentStep + 1}/4
        </span>
      </div>

      <StepProgress steps={steps} currentStep={currentStep} />

      {submitted ? (
        <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6" role="status">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">
            Onboarding draft captured
          </p>
          <h4 className="mt-3 text-2xl font-bold text-brand-ink">Ready for the next workflow</h4>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            This frontend-only form called mock validation and JSON preparation
            services. Replace those service adapters with backend APIs when the
            engines are ready for integration.
          </p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <SummaryItem label="Name" value={data.fullName} />
            <SummaryItem label="Country" value={data.country} />
            <SummaryItem label="PAN" value={data.pan.toUpperCase()} />
            <SummaryItem label="Regime" value={formatRegime(data.taxRegime)} />
            <SummaryItem label="ITD credentials" value={formatCredential(data.credentialStatus)} />
            <SummaryItem label="Validation ref" value={validationResult?.referenceId ?? "-"} />
            <SummaryItem label="JSON draft ref" value={jsonResult?.jsonReferenceId ?? "-"} />
          </dl>
          {validationResult?.warnings.length ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {validationResult.warnings.join(" ")}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 min-h-11 rounded-full border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            Start again
          </button>
        </div>
      ) : (
        <form
          className="mt-8"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleNext();
          }}
        >
          <p className="sr-only" aria-live="polite">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}
          </p>
          {currentStep === 0 && (
            <div className="grid gap-5">
              <FormField
                label="Full Name"
                name="fullName"
                value={data.fullName}
                placeholder="Enter your full name"
                autoComplete="name"
                error={errors.fullName}
                onChange={(value) => updateField("fullName", value)}
              />
              <FormField
                label="Country"
                name="country"
                value={data.country}
                placeholder="Example: United Arab Emirates"
                autoComplete="country-name"
                error={errors.country}
                onChange={(value) => updateField("country", value)}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-5">
              <FormField
                label="PAN Number"
                name="pan"
                value={data.pan}
                placeholder="ABCDE1234F"
                maxLength={10}
                autoComplete="off"
                inputMode="text"
                helperText="Use the standard ten-character PAN format, for example ABCDE1234F."
                error={errors.pan}
                onChange={(value) => updateField("pan", normalizePan(value))}
              />
              <p className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
                PAN is captured here only as frontend state. Do not persist taxpayer
                data until secure backend storage, consent, and privacy controls are approved.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <RadioCardGroup
              label="Select your preferred tax regime"
              name="taxRegime"
              options={regimeOptions}
              value={data.taxRegime}
              error={errors.taxRegime}
              onChange={(value) => updateField("taxRegime", value)}
            />
          )}

          {currentStep === 3 && (
            <div className="grid gap-5">
              <RadioCardGroup
                label="Do you have Income Tax Department login credentials?"
                name="credentialStatus"
                options={credentialOptions}
                value={data.credentialStatus}
                columns="three"
                error={errors.credentialStatus}
                onChange={(value) => updateField("credentialStatus", value)}
              />
              <SecurityNotice>
                NRITAX.AI never asks for or stores your Income Tax Department password.
              </SecurityNotice>
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                On submit, this UI calls mock validation and JSON draft services only.
                Connect the real backend engines inside the files under src/services.
              </p>
            </div>
          )}

          {serviceError ? (
            <div
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
              role="alert"
            >
              {serviceError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="min-h-11 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 rounded-full bg-brand-blue px-6 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Preparing draft..."
                : currentStep === steps.length - 1
                  ? "Submit and continue"
                  : "Continue"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-brand-ink">{value || "-"}</dd>
    </div>
  );
}

function formatRegime(value: OnboardingData["taxRegime"]) {
  if (value === "old") return "Old Tax Regime";
  if (value === "new") return "New Tax Regime";
  return "-";
}

function formatCredential(value: OnboardingData["credentialStatus"]) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "not-sure") return "Not sure";
  return "-";
}
