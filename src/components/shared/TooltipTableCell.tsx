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
        const isOverflow =
          textRef.current.scrollWidth > textRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [children]);

  const cellContent = (
    <Box
      ref={textRef}
      sx={{
        maxWidth,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: align,
        width: "100%",
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
