import React from "react";
import { inputClass } from "@/csmju";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  id,
  "aria-describedby": describedBy,
  options,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full space-y-1 text-left">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-on-surface">
          {label}
        </label>
      )}
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[describedBy, error && id ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined}
        className={`${inputClass} ${error ? "input-error" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p id={id ? `${id}-error` : undefined} role="alert" className="text-sm text-error">ข้อผิดพลาด: {error}</p>}
    </div>
  );
};
