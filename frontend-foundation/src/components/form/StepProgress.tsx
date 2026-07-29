import type { OnboardingStep } from "../../types/onboarding";

type StepProgressProps = {
  steps: OnboardingStep[];
  currentStep: number;
};

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mt-4" aria-label="Onboarding progress">
      <div className="h-2 overflow-hidden rounded-full bg-brand-line ring-1 ring-brand-rule">
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={currentStep + 1}
          aria-valuetext={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep].label}`}
          className="h-full rounded-full bg-brand-blue"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="mt-2.5 grid gap-2 text-[12px] font-medium leading-snug text-brand-muted"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => (
          <span key={step.id} className={index <= currentStep ? "text-brand-blue" : ""}>
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
