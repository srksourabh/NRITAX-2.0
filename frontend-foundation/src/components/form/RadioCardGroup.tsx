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
  return (
    <div>
      <p className="text-sm font-semibold text-brand-ink">{label}</p>
      <div className={`mt-3 grid gap-3 ${columns === "three" ? "sm:grid-cols-3" : ""}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              value === option.value
                ? "border-brand-blue bg-blue-50 text-brand-blue"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="block text-sm font-bold text-brand-ink">{option.label}</span>
            {option.description ? (
              <span className="mt-1 block text-sm leading-6 text-slate-600">{option.description}</span>
            ) : null}
          </label>
        ))}
      </div>
      {error ? <span className="mt-2 block text-sm font-medium text-red-600">{error}</span> : null}
    </div>
  );
}
