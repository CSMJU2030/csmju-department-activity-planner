import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "min-h-11 px-4 py-2.5 text-label-md rounded-lg font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "btn-gradient text-on-primary shadow-md hover:opacity-90",
    secondary: "bg-primary-container/10 text-primary-container hover:bg-primary-container/20",
    outline: "border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
