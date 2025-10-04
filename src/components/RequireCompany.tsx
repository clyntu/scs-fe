// components/RequireCompany.tsx
import React from "react";
import { useCompanyContext } from "../hooks/useCompanyContext";

interface RequireCompanyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireCompany: React.FC<RequireCompanyProps> = ({
  children,
  fallback = <div>Please select a company</div>,
}) => {
  const { currentCompany, isLoading } = useCompanyContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (currentCompany === null || currentCompany === "") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
