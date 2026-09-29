import React from "react";

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`bg-white border border-secondary rounded-2xl p-5 sm:p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
};