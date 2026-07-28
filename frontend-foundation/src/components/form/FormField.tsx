type FormFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  maxLength?: number;
  autoComplete?: string;
  onChange: (value: string) => void;
};

export function FormField({
  label,
  value,
  placeholder,
  error,
  maxLength,
  autoComplete,
  onChange
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-brand-ink">{label}</span>
      <input
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 h-12 w-full rounded-2xl border bg-white px-4 text-base font-medium text-brand-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 focus:border-brand-blue focus:ring-blue-100"
        }`}
      />
      {error ? <span className="mt-2 block text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
