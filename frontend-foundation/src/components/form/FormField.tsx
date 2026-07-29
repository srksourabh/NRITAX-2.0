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
      <label htmlFor={fieldId} className="text-form text-brand-ink">
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
        className={`mt-2 min-h-11 w-full rounded-lg border bg-brand-surface px-4 text-form text-brand-ink shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none placeholder:text-brand-muted/60 focus:ring-4 ${
          error
            ? "border-brand-notice focus:border-brand-notice focus:ring-red-100"
            : "border-brand-rule hover:border-brand-cyan focus:border-brand-blue focus:ring-[rgba(11,107,255,0.18)]"
        }`}
      />
      {helperText ? (
        <p id={helperId} className="mt-2 text-caption text-brand-muted">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-caption text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
