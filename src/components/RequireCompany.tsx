// components/RequireCompany.tsx
import React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { useCompanyContext } from "../hooks/useCompanyContext";
import { FormLoadingSkeleton } from "./shared/ContentStates";

interface RequireCompanyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireCompany: React.FC<RequireCompanyProps> = ({
  children,
  fallback = (
    <Box className="content-state" role="status">
      <Typography level="title-md">Select a company to continue</Typography>
      <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
        Choose a company from the navigation sidebar to load this workspace.
      </Typography>
    </Box>
  ),
}) => {
  const { currentCompany, isLoading, error } = useCompanyContext();

  if (isLoading) {
    return <FormLoadingSkeleton />;
  }

  if (error !== null) {
    return (
      <Box className="content-state" role="alert">
        <Typography level="title-md">
          We couldn&apos;t load your companies
        </Typography>
        <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (currentCompany === null || currentCompany === "") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
