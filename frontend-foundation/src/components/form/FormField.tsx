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
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
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
        className={`mt-2 min-h-11 w-full rounded-md border bg-brand-surface px-3 text-base font-medium text-brand-ink outline-none transition placeholder:text-slate-500 focus:ring-4 ${
          error
            ? "border-brand-notice focus:border-brand-notice focus:ring-[rgba(179,38,30,0.38)]"
            : "border-slate-300 hover:border-brand-cyan focus:border-brand-blue focus:ring-[rgba(11,74,117,0.38)]"
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
