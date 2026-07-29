import { useId } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "text" | "search" | "email" | "tel" | "url" | "none" | "numeric" | "decimal";
  required?: boolean;
  onChange: (value: string) => void;
};

export function FormField({
  label,
  name,
  value,
  placeholder,
  error,
  helperText,
  maxLength,
  autoComplete,
  inputMode,
  required = true,
  onChange
}: FormFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const describedBy = [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(" ");

  return (
    <div className="block">
      <label htmlFor={fieldId} className="text-sm font-semibold text-brand-ink">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 h-12 w-full rounded-2xl border bg-white px-4 text-base font-medium text-brand-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 focus:border-brand-blue focus:ring-blue-100"
        }`}
      />
      {helperText ? (
        <p id={helperId} className="mt-2 text-sm leading-6 text-slate-500">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
