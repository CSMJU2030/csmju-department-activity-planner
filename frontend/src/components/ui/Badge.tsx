import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "info" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "info" }) => {
  const variants = {
    info: "bg-secondary text-primary",
    neutral: "bg-gray-100 text-neutral",
  };

  return (
    <span className={`text-sm font-semibold px-2.5 py-0.5 rounded ${variants[variant]}`}>
      {children}
    </span>
  );
};