import React from "react";

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
  options,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full space-y-1 text-left">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full px-3 py-2 text-sm leading-[1.6] rounded-md border bg-white text-neutral focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};