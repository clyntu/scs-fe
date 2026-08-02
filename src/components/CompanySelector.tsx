// components/CompanySelector.tsx
import React from "react";
import { Select, Option, Skeleton, Typography } from "@mui/joy";
import { useCompanyContext } from "../hooks/useCompanyContext";

export const CompanySelector: React.FC = () => {
  const { currentCompany, companies, setCurrentCompany, isLoading, error } =
    useCompanyContext();

  if (isLoading) {
    return <Skeleton variant="rectangular" height={32} sx={{ mt: 1 }} />;
  }

  if (error !== null) {
    return (
      <Typography level="body-xs" color="danger" role="alert" sx={{ mt: 1 }}>
        Companies unavailable
      </Typography>
    );
  }

  return (
    <div className="company-selector">
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
        aria-label="Current company"
        sx={{ width: "100%", minWidth: 0, mt: 1 }}
        slotProps={{
          listbox: {
            sx: {
              zIndex: 1300,
            },
          },
        }}
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
