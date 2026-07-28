import type { OnboardingStep } from "../../types/onboarding";

type StepProgressProps = {
  steps: OnboardingStep[];
  currentStep: number;
};

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mt-6">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-blue transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] font-semibold text-slate-500 sm:text-xs">
        {steps.map((step, index) => (
          <span key={step.id} className={index <= currentStep ? "text-brand-blue" : ""}>
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
