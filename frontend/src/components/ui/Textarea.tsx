import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  id,
  "aria-describedby": describedBy,
  className = "",
  rows = 3,
  ...props
}) => {
  return (
    <div className="w-full space-y-1 text-left">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-on-surface">
          {label}
        </label>
      )}
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[describedBy, error && id ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined}
        rows={rows}
        className={`w-full px-3 py-2 text-body-md rounded-lg border bg-surface-container-lowest text-on-surface placeholder:text-outline focus:ring-2 focus:ring-accent focus:border-accent transition-colors ${
          error ? "border-error" : "border-outline-variant"
        } ${className}`}
        {...props}
      />
      {error && <p id={id ? `${id}-error` : undefined} role="alert" className="text-sm text-error">ข้อผิดพลาด: {error}</p>}
    </div>
  );
};
