import React from "react";
import { Chip } from "@mui/joy";

interface StatusChipProps {
  status: string;
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
      return "neutral";
    default:
      return "primary";
  }
};

export const getStatusVariant = (
  status: string,
): "solid" | "soft" | "outlined" => {
  return status.toLowerCase() === "cancelled" ? "outlined" : "soft";
};

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  return (
    <Chip
      color={getStatusColor(status)}
      variant={getStatusVariant(status)}
      size="sm"
    >
      {status.toUpperCase()}
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
