import React from "react";
import { Tooltip, Autocomplete, Box } from "@mui/joy";
import type { AutocompleteProps } from "@mui/joy";

interface TooltipAutocompleteProps<T>
  extends Omit<AutocompleteProps<T, false, false, false>, "renderInput"> {
  maxWidth?: string | number;
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
}

const TooltipAutocomplete = <T,>({
  value,
  getOptionLabel,
  maxWidth = "100%",
  tooltipPlacement = "top",
  disabled = false,
  ...autocompleteProps
}: TooltipAutocompleteProps<T>): JSX.Element => {
  // Get the display text for the current value
  const getDisplayText = (): string => {
    if (value === null || value === undefined) return "";
    if (typeof getOptionLabel === "function") {
      return getOptionLabel(value);
    }
    return String(value);
  };

  const displayText = getDisplayText();

  // When disabled, we need to wrap in a Box to ensure hover events work
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
        <Box sx={{ maxWidth }}>
          <Autocomplete
            {...autocompleteProps}
            value={value}
            getOptionLabel={getOptionLabel}
            disabled={disabled}
            sx={{
              maxWidth: "100%",
              ...autocompleteProps.sx,
            }}
          />
        </Box>
      </Tooltip>
    );
  }

  // For non-disabled or empty values, use regular tooltip logic
  return (
    <Tooltip
      title={displayText !== "" ? displayText : "No selection"}
      arrow
      placement={tooltipPlacement}
      enterDelay={1000}
      leaveDelay={200}
      sx={{
        maxWidth: "400px",
        wordWrap: "break-word",
      }}
      // Show tooltip when text might overflow (30+ characters) or when explicitly needed
      disableHoverListener={displayText === "" || displayText.length < 30}
    >
      <Autocomplete
        {...autocompleteProps}
        value={value}
        getOptionLabel={getOptionLabel}
        disabled={disabled}
        sx={{
          maxWidth,
          ...autocompleteProps.sx,
        }}
      />
    </Tooltip>
  );
};

export default TooltipAutocomplete;
