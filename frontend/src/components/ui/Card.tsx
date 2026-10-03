import React from "react";

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
};
