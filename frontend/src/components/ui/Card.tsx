import React from "react";
import { cardClass } from "@/csmju";

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`${cardClass} p-6 ${className}`}>
      {children}
    </div>
  );
};
