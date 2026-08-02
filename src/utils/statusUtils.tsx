import React from "react";
import { Chip } from "@mui/joy";

interface StatusChipProps {
  status: string;
  label?: string;
}

export const getStatusColor = (
  status: string,
): "primary" | "success" | "warning" | "danger" | "neutral" => {
  switch (status.toLowerCase()) {
    case "posted":
      return "success";
    case "unposted":
      return "warning";
    case "cancelled":
      return "danger";
    case "archived":
      return "warning";
    default:
      return "primary";
  }
};

export const getStatusVariant = (
  status: string,
): "solid" | "soft" | "outlined" => {
  return status.toLowerCase() === "cancelled" ? "outlined" : "soft";
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  return (
    <Chip
      color={getStatusColor(status)}
      variant={getStatusVariant(status)}
      size="sm"
    >
      {(label ?? status).toUpperCase()}
    </Chip>
  );
};

export const formatStatusText = (status: string): string => {
  return status.toUpperCase();
};

export const isTransactionCancelled = (status: string): boolean => {
  return status.toLowerCase() === "cancelled";
};

export const isTransactionPosted = (status: string): boolean => {
  return status.toLowerCase() === "posted";
};

export const canCancelTransaction = (status: string): boolean => {
  return isTransactionPosted(status) && !isTransactionCancelled(status);
};

// Stock Adjustment Type Helpers
export const getAdjustmentTypeColor = (
  adjustmentType: string,
): "success" | "danger" => {
  return adjustmentType === "surplus" ? "success" : "danger";
};

export const getAdjustmentTypeVariant = (): "solid" | "soft" => {
  return "soft";
};

interface AdjustmentTypeChipProps {
  adjustmentType: string;
}

export const AdjustmentTypeChip: React.FC<AdjustmentTypeChipProps> = ({
  adjustmentType,
}) => {
  const color = getAdjustmentTypeColor(adjustmentType);
  const label = adjustmentType === "surplus" ? "Surplus" : "Deficit";

  return (
    <Chip color={color} variant="soft" size="sm">
      {label}
    </Chip>
  );
};
