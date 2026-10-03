import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "info" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "info" }) => {
  const variants = {
    info: "bg-primary-container/10 text-primary-container",
    neutral: "bg-surface-variant text-on-surface-variant",
  };

  return (
    <span className={`text-label-sm px-2.5 py-1 rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
};
