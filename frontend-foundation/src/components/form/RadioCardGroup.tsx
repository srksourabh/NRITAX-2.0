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
      <legend className="text-sm font-semibold text-brand-ink">{label}</legend>
      <div className={`mt-3 grid gap-3 ${columns === "three" ? "sm:grid-cols-3" : ""}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-lg border p-4 transition focus-within:ring-4 ${
              value === option.value
                ? "border-brand-blue bg-[#E8F1F7] text-brand-blue focus-within:ring-[rgba(11,74,117,0.38)]"
                : "border-brand-rule bg-brand-surface text-slate-700 hover:border-brand-cyan hover:bg-slate-50 focus-within:ring-[rgba(11,74,117,0.38)]"
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
            <span className="block text-sm font-bold text-brand-ink">{option.label}</span>
            {option.description ? (
              <span className="mt-1 block text-sm leading-6 text-slate-600">{option.description}</span>
            ) : null}
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
