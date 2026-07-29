import { useId } from "react";

export type RadioCardOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type RadioCardGroupProps<T extends string> = {
  label: string;
  name: string;
  value: T | "";
  options: Array<RadioCardOption<T>>;
  error?: string;
  columns?: "single" | "three";
  onChange: (value: T) => void;
};

export function RadioCardGroup<T extends string>({
  label,
  name,
  value,
  options,
  error,
  columns = "single",
  onChange
}: RadioCardGroupProps<T>) {
  const groupId = useId();
  const errorId = `${groupId}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)}>
      <legend className="text-form text-brand-ink">{label}</legend>
      <div className={`mt-2.5 grid gap-3 ${columns === "three" ? "sm:grid-cols-3" : ""}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-[88px] cursor-pointer flex-col rounded-lg border p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] focus-within:ring-4 ${
              value === option.value
                ? "border-brand-blue bg-[rgba(11,107,255,0.09)] text-brand-blue shadow-soft focus-within:ring-[rgba(11,107,255,0.18)]"
                : "border-brand-rule bg-brand-surface text-brand-muted hover:border-brand-cyan hover:bg-[#F8FAFC] focus-within:ring-[rgba(11,107,255,0.18)]"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              required
              onChange={() => onChange(option.value)}
            />
            <span className="block font-heading text-[16px] font-bold leading-snug text-brand-ink">{option.label}</span>
            {option.description ? (
              <span className="mt-1 block text-caption text-brand-muted">{option.description}</span>
            ) : null}
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-caption text-red-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
