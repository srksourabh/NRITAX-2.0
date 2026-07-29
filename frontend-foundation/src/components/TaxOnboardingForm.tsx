import { useState } from "react";

import { FormField } from "./form/FormField";
import { RadioCardGroup, type RadioCardOption } from "./form/RadioCardGroup";
import { SecurityNotice } from "./form/SecurityNotice";
import { StepProgress } from "./form/StepProgress";
import {
  initialOnboardingData,
  type CredentialStatus,
  type IncomeSource,
  type OnboardingData,
  type OnboardingErrors,
  type OnboardingStep,
  type PanAvailability,
  type TaxRegime
} from "../types/onboarding";
import { hasValidationErrors, validateOnboardingStep } from "../validation/onboardingValidation";
import {
  validateOnboardingData,
  type ValidationServiceResult
} from "../services/validationService";
import {
  generateFilingJsonDraft,
  type JsonGenerationResult
} from "../services/jsonGenerationService";
import {
  prepareFilingWorkflow,
  type FilingEngineResult
} from "../services/filingEngineService";

const steps: OnboardingStep[] = [
  { id: "personal", label: "Details" },
  { id: "taxProfile", label: "Tax profile" },
  { id: "readiness", label: "Readiness" }
];

const panAvailabilityOptions: Array<RadioCardOption<PanAvailability>> = [
  { value: "yes", label: "PAN available", description: "I have my Indian PAN." },
  { value: "no", label: "No PAN", description: "I need guidance on PAN availability." },
  { value: "not-sure", label: "Not sure", description: "I want NRITAX to help confirm." }
];

const regimeOptions: Array<RadioCardOption<TaxRegime>> = [
  { value: "old", label: "Old Regime", description: "Use eligible deductions and exemptions where applicable." },
  { value: "new", label: "New Regime", description: "Use the newer slab-based tax calculation preference." }
];

const credentialOptions: Array<RadioCardOption<CredentialStatus>> = [
  { value: "yes", label: "Yes", description: "I can access the portal myself." },
  { value: "no", label: "No", description: "I do not currently have access." },
  { value: "not-sure", label: "Not sure", description: "I need help confirming access." }
];

const incomeSourceOptions: Array<{ value: IncomeSource; label: string }> = [
  { value: "salary", label: "Salary" },
  { value: "house-property", label: "House property" },
  { value: "capital-gains", label: "Capital gains" },
  { value: "foreign-income", label: "Foreign income" },
  { value: "other", label: "Other income" }
];

const countryOptions = [
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Singapore",
  "Canada",
  "Australia",
  "Qatar",
  "Saudi Arabia",
  "Germany",
  "Other"
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
  const [filingResult, setFilingResult] = useState<FilingEngineResult | null>(null);

  const updateField = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData((previous) => ({ ...previous, [field]: value }));
    setServiceError("");
    setErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const toggleIncomeSource = (value: IncomeSource) => {
    const nextSources = data.incomeSources.includes(value)
      ? data.incomeSources.filter((source) => source !== value)
      : [...data.incomeSources, value];

    updateField("incomeSources", nextSources);
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
        const nextFilingResult = await prepareFilingWorkflow(nextJsonResult);
        setValidationResult(nextValidationResult);
        setJsonResult(nextJsonResult);
        setFilingResult(nextFilingResult);
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
    setFilingResult(null);
  };

  return (
    <section
      className="overflow-hidden rounded-lg border border-brand-rule bg-brand-surface shadow-fintech"
      aria-labelledby="onboarding-form-title"
    >
      <div className="border-b border-brand-rule bg-[#F8FAFC] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-caption uppercase tracking-wide text-brand-blue">NRI onboarding</p>
            <h3 id="onboarding-form-title" className="mt-1 font-heading text-card text-brand-ink">
              Check filing readiness
            </h3>
          </div>
          <span className="rounded-md border border-brand-rule bg-brand-surface px-3 py-1 text-caption text-brand-blue">
            Step {currentStep + 1}/3
          </span>
        </div>

        <StepProgress steps={steps} currentStep={currentStep} />
      </div>

      {submitted ? (
        <div
          className="m-4 rounded-lg border border-[rgba(25,195,125,0.24)] bg-[rgba(25,195,125,0.10)] p-5 sm:m-5 sm:p-6"
          role="status"
        >
          <p className="text-caption uppercase tracking-wide text-brand-credit">Readiness profile captured</p>
          <h4 className="mt-3 font-heading text-card text-brand-ink">
            Ready for validation, JSON draft, and CA review routing
          </h4>
          <p className="mt-3 text-body text-brand-muted">
            This frontend-only flow called mock validation, JSON generation, and filing workflow services.
            Connect the real APIs inside the service files when backend engines are ready.
          </p>
          <dl className="mt-5 grid gap-3 text-caption sm:grid-cols-2">
            <SummaryItem label="Name" value={data.fullName} />
            <SummaryItem label="Country" value={data.country} />
            <SummaryItem label="PAN availability" value={formatPanAvailability(data.panAvailability)} />
            <SummaryItem label="Regime" value={formatRegime(data.taxRegime)} />
            <SummaryItem label="Income sources" value={formatIncomeSources(data.incomeSources)} />
            <SummaryItem label="Portal access" value={formatCredential(data.credentialStatus)} />
            <SummaryItem label="Validation ref" value={validationResult?.referenceId ?? "-"} />
            <SummaryItem label="JSON draft ref" value={jsonResult?.jsonReferenceId ?? "-"} />
            <SummaryItem label="Filing workflow ref" value={filingResult?.workflowReferenceId ?? "-"} />
          </dl>
          <button
            type="button"
            onClick={handleReset}
            className="mt-5 h-11 rounded-lg border border-[rgba(25,195,125,0.24)] bg-brand-surface px-5 text-button text-brand-credit shadow-soft hover:bg-[#F8FAFC] focus-visible:outline-brand-blue"
          >
            Start again
          </button>
        </div>
      ) : (
        <form
          className="p-5"
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
            <div className="grid gap-3.5">
              <FormField
                label="Name"
                name="fullName"
                value={data.fullName}
                placeholder="Enter your full name"
                autoComplete="name"
                error={errors.fullName}
                onChange={(value) => updateField("fullName", value)}
              />
              <div>
                <label htmlFor="country" className="text-form text-brand-ink">
                  Country of Residence
                </label>
                <select
                  id="country"
                  name="country"
                  value={data.country}
                  autoComplete="country-name"
                  aria-invalid={Boolean(errors.country)}
                  aria-describedby={errors.country ? "country-error" : undefined}
                  required
                  onChange={(event) => updateField("country", event.target.value)}
                    className={`mt-2 min-h-11 w-full rounded-lg border bg-brand-surface px-4 text-form text-brand-ink shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none focus:ring-4 ${
                    errors.country
                      ? "border-brand-notice focus:border-brand-notice focus:ring-red-100"
                      : "border-brand-rule hover:border-brand-cyan focus:border-brand-blue focus:ring-[rgba(11,107,255,0.18)]"
                  }`}
                >
                  <option value="">Select country</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.country ? (
                  <p id="country-error" className="mt-2 text-caption text-red-600">
                    {errors.country}
                  </p>
                ) : null}
              </div>
              <RadioCardGroup
                label="PAN availability"
                name="panAvailability"
                options={panAvailabilityOptions}
                value={data.panAvailability}
                columns="three"
                error={errors.panAvailability}
                onChange={(value) => updateField("panAvailability", value)}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-3.5">
              <RadioCardGroup
                label="Tax regime"
                name="taxRegime"
                options={regimeOptions}
                value={data.taxRegime}
                error={errors.taxRegime}
                onChange={(value) => updateField("taxRegime", value)}
              />
              <fieldset aria-describedby={errors.incomeSources ? "income-source-error" : undefined}>
                <legend className="text-form text-brand-ink">Income sources</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {incomeSourceOptions.map((option) => {
                    const checked = data.incomeSources.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-form ${
                          checked
                            ? "border-brand-blue bg-[rgba(11,107,255,0.09)] text-brand-blue shadow-soft"
                            : "border-brand-rule bg-brand-surface text-brand-muted hover:border-brand-cyan"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIncomeSource(option.value)}
                          className="size-4 rounded border-brand-rule text-brand-blue focus:ring-brand-blue"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
                {errors.incomeSources ? (
                  <p id="income-source-error" className="mt-2 text-caption text-red-600">
                    {errors.incomeSources}
                  </p>
                ) : null}
              </fieldset>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid gap-3.5">
              <RadioCardGroup
                label="Do you have Income Tax Department portal access?"
                name="credentialStatus"
                options={credentialOptions}
                value={data.credentialStatus}
                columns="three"
                error={errors.credentialStatus}
                onChange={(value) => updateField("credentialStatus", value)}
              />
              <SecurityNotice>
                We never store your Income Tax credentials.
              </SecurityNotice>
            </div>
          )}

          {serviceError ? (
            <div
              className="mt-5 rounded-lg border border-[rgba(179,38,30,0.24)] bg-[rgba(179,38,30,0.08)] p-4 text-caption text-brand-notice"
              role="alert"
            >
              {serviceError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="h-11 rounded-lg border border-brand-rule bg-brand-surface px-5 text-button text-brand-muted shadow-soft hover:border-brand-blue hover:text-brand-blue focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-lg border border-brand-blue bg-brand-blue px-5 text-button text-white shadow-glow hover:bg-[#0757D7] focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Preparing workflow..."
                : currentStep === steps.length - 1
                  ? "Submit readiness"
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
    <div className="rounded-lg border border-brand-rule bg-brand-surface p-4">
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-1 text-form text-brand-ink">{value || "-"}</dd>
    </div>
  );
}

function formatRegime(value: OnboardingData["taxRegime"]) {
  if (value === "old") return "Old Regime";
  if (value === "new") return "New Regime";
  return "-";
}

function formatCredential(value: OnboardingData["credentialStatus"]) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "not-sure") return "Not sure";
  return "-";
}

function formatPanAvailability(value: OnboardingData["panAvailability"]) {
  if (value === "yes") return "Available";
  if (value === "no") return "Not available";
  if (value === "not-sure") return "Not sure";
  return "-";
}

function formatIncomeSources(values: OnboardingData["incomeSources"]) {
  if (!values.length) return "-";
  return values
    .map((value) => incomeSourceOptions.find((option) => option.value === value)?.label ?? value)
    .join(", ");
}
