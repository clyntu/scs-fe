// components/CompanySelector.tsx
import React from "react";
import { Select, Option, FormLabel } from "@mui/joy";
import { useCompanyContext } from "../hooks/useCompanyContext";

export const CompanySelector: React.FC = () => {
  const { currentCompany, companies, setCurrentCompany, isLoading } =
    useCompanyContext();

  if (isLoading) {
    return <div>Loading companies...</div>;
  }

  return (
    <div className="company-selector">
      <FormLabel htmlFor="company-select" sx={{ fontSize: "12px", mb: 0.5 }}>
        Company
      </FormLabel>
      <Select
        id="company-select"
        value={currentCompany ?? ""}
        onChange={(_, newValue) => {
          if (newValue !== null && newValue !== currentCompany) {
            setCurrentCompany(newValue);
            // Refresh page to load new company data - simple and reliable UX
            window.location.reload();
          }
        }}
        size="sm"
        sx={{ minWidth: 180 }}
      >
        {companies.map((company) => (
          <Option key={company.code} value={company.code}>
            {company.name}
          </Option>
        ))}
      </Select>
    </div>
  );
};
