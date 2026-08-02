import React from "react";
import { Tooltip, Input, Box } from "@mui/joy";
import type { InputProps } from "@mui/joy";

interface TooltipInputProps extends InputProps {
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
}

const TooltipInput: React.FC<TooltipInputProps> = ({
  value,
  disabled = false,
  tooltipPlacement = "top",
  ...inputProps
}) => {
  const displayText = String(value ?? "");

  // When disabled and has content, show tooltip
  if (disabled && displayText !== "") {
    return (
      <Tooltip
        title={displayText}
        arrow
        placement={tooltipPlacement}
        enterDelay={1000}
        leaveDelay={200}
        sx={{
          maxWidth: "400px",
          wordWrap: "break-word",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Input {...inputProps} value={value} disabled={disabled} />
        </Box>
      </Tooltip>
    );
  }

  // For non-disabled fields or empty values, use regular input
  return <Input {...inputProps} value={value} disabled={disabled} />;
};

export default TooltipInput;
