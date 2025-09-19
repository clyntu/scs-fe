import React from "react";
import TooltipTableCell from "./TooltipTableCell";

// Utility function to wrap table cell content with tooltip
export const withTooltip = (
  content: React.ReactNode,
  maxWidth?: string | number,
  align?: "left" | "right" | "center",
): JSX.Element => (
  <TooltipTableCell maxWidth={maxWidth} align={align}>
    {content}
  </TooltipTableCell>
);

export default withTooltip;
