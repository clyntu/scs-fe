import React, { useState, useRef, useEffect } from "react";
import { Tooltip, Box } from "@mui/joy";

interface TooltipTableCellProps {
  children: React.ReactNode;
  maxWidth?: string | number;
  align?: "left" | "right" | "center";
  className?: string;
  style?: React.CSSProperties;
}

const TooltipTableCell: React.FC<TooltipTableCellProps> = ({
  children,
  maxWidth = "100%",
  align = "left",
  className = "",
  style = {},
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = (): void => {
      if (textRef.current !== null) {
        // Add small delay to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          if (textRef.current !== null) {
            const element = textRef.current;

            // Create a temporary element to measure natural text width
            const testElement = element.cloneNode(true) as HTMLElement;
            testElement.style.position = "absolute";
            testElement.style.visibility = "hidden";
            testElement.style.width = "auto";
            testElement.style.maxWidth = "none";
            testElement.style.whiteSpace = "nowrap";

            document.body.appendChild(testElement);
            const naturalWidth = testElement.offsetWidth;
            document.body.removeChild(testElement);

            // Compare natural width with current element width
            const actualOverflow = naturalWidth > element.clientWidth;

            setIsOverflowing(actualOverflow);
          }
        });
      }
    };

    // Initial check with delay
    const timer = setTimeout(checkOverflow, 100);

    // Check on resize
    window.addEventListener("resize", checkOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [children]);

  const cellContent = (
    <Box
      ref={textRef}
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: align,
        width: "100%",
        // Don't use maxWidth for layout - let it use the full cell width
        // maxWidth is only used for Tooltip sizing, not for text truncation
        ...style,
      }}
      className={className}
    >
      {children}
    </Box>
  );

  if (!isOverflowing) {
    return cellContent;
  }

  return (
    <Tooltip
      title={String(children)}
      arrow
      placement="top"
      enterDelay={1000} // 1 second delay before showing tooltip
      leaveDelay={200}
      sx={{
        maxWidth: "400px",
        wordWrap: "break-word",
      }}
    >
      {cellContent}
    </Tooltip>
  );
};

export default TooltipTableCell;
