import React, { useState, useEffect } from "react";
import { Box, IconButton, Typography, CircularProgress } from "@mui/joy";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import axiosInstance from "../utils/axiosConfig";
import { convertToQueryParams } from "../helper";

export interface RecordNavigationProps<T> {
  currentRecord: T | null;
  onRecordChange: (record: T) => void;
  apiEndpoint: string;
  recordIdField: keyof T;
  recordDisplayField: keyof T;
  recordDisplayPrefix: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  additionalFilters?: Record<string, any>;
  viewFilters?: Record<string, any>; // New prop for current view filters
}

interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

const RecordNavigation = <T extends Record<string, any>>({
  currentRecord,
  onRecordChange,
  apiEndpoint,
  recordIdField,
  recordDisplayField,
  recordDisplayPrefix,
  sortBy = "id",
  sortOrder = "desc",
  additionalFilters = {},
  viewFilters = {},
}: RecordNavigationProps<T>): JSX.Element => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [recordsCache, setRecordsCache] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Fetch and cache records for smooth navigation
  const fetchRecords = async (): Promise<void> => {
    if (currentRecord === null || currentRecord === undefined) return;

    setIsInitialLoading(true);
    const currentId = currentRecord[recordIdField] as number;

    try {
      // Start with a reasonable batch size
      let allRecords: T[] = [];
      let page = 1;
      const limit = 100;
      let foundCurrentRecord = false;

      // Fetch records until we find the current one or reach reasonable limit
      while (page <= 5 && !foundCurrentRecord) {
        const payload = {
          page,
          limit,
          sort_by: sortBy,
          sort_order: sortOrder,
          ...additionalFilters,
          ...viewFilters, // Merge view filters to respect current search/filters
        };

        const response = await axiosInstance.get<PaginatedResponse<T>>(
          `${apiEndpoint}?${convertToQueryParams(payload)}`,
        );

        const pageRecords = response.data.items;
        allRecords = [...allRecords, ...pageRecords];

        // Check if current record is in this batch
        foundCurrentRecord = pageRecords.some(
          (record) => record[recordIdField] === currentId,
        );

        // If we have no more records, stop
        if (pageRecords.length === 0) break;
        page++;
      }

      // Update cache and find current index
      setRecordsCache(allRecords);
      const index = allRecords.findIndex(
        (record) => record[recordIdField] === currentId,
      );

      setCurrentIndex(index);
      setHasPrev(index > 0);
      setHasNext(index < allRecords.length - 1 && index !== -1);
    } catch (error) {
      console.error("Error fetching records:", error);
      setHasPrev(false);
      setHasNext(false);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Instant navigation using cached data
  const handleNavigation = (direction: "next" | "prev"): void => {
    if (recordsCache.length === 0 || currentIndex === -1) return;

    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < recordsCache.length) {
      const newRecord = recordsCache[newIndex];
      setCurrentIndex(newIndex);
      setHasPrev(newIndex > 0);
      setHasNext(newIndex < recordsCache.length - 1);

      // Instant update
      onRecordChange(newRecord);
    }
  };

  // Refresh cache when current record or filters change
  useEffect(() => {
    if (currentRecord !== null && currentRecord !== undefined) {
      void fetchRecords();
    }
  }, [
    currentRecord,
    apiEndpoint,
    sortBy,
    sortOrder,
    JSON.stringify(additionalFilters),
    JSON.stringify(viewFilters), // Include viewFilters in dependency array
  ]);

  // Show loading state only during initial fetch
  if (
    isInitialLoading &&
    currentRecord !== null &&
    currentRecord !== undefined
  ) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 1,
          px: 2,
          borderRadius: "12px",
          backgroundColor: "background.level1",
          border: "1px solid",
          borderColor: "neutral.200",
          boxShadow: "sm",
        }}
      >
        <CircularProgress size="sm" color="neutral" />
        <Typography level="title-md" sx={{ mx: 2, fontWeight: 600 }}>
          Loading navigation...
        </Typography>
      </Box>
    );
  }

  if (currentRecord === null || currentRecord === undefined) {
    return <></>;
  }

  const displayValue = currentRecord[recordDisplayField];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1,
        px: 2,
        borderRadius: "12px",
        backgroundColor: "background.level1",
        border: "1px solid",
        borderColor: "neutral.200",
        boxShadow: "sm",
      }}
    >
      <IconButton
        size="sm"
        variant="soft"
        color="neutral"
        disabled={!hasPrev}
        onClick={() => handleNavigation("prev")}
        sx={{
          minWidth: "32px",
          minHeight: "32px",
          borderRadius: "8px",
          backgroundColor: hasPrev ? "neutral.50" : "neutral.100",
          border: "1px solid",
          borderColor: "neutral.200",
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: "neutral.100",
            borderColor: "neutral.300",
            transform: "translateY(-1px)",
            boxShadow: "md",
          },
          "&:active": {
            transform: "translateY(0px)",
          },
          "&:disabled": {
            backgroundColor: "neutral.50",
            borderColor: "neutral.100",
            opacity: 0.5,
          },
        }}
      >
        <ArrowBackIosIcon
          fontSize="small"
          sx={{
            color: hasPrev ? "neutral.700" : "neutral.400",
            ml: "1px", // Slight adjustment for visual centering
          }}
        />
      </IconButton>

      <Typography
        level="title-md"
        sx={{
          mx: 2,
          fontWeight: 600,
          color: "neutral.800",
          textAlign: "center",
          minWidth: "120px",
          letterSpacing: "0.5px",
        }}
      >
        {recordDisplayPrefix} {displayValue}
      </Typography>

      <IconButton
        size="sm"
        variant="soft"
        color="neutral"
        disabled={!hasNext}
        onClick={() => handleNavigation("next")}
        sx={{
          minWidth: "32px",
          minHeight: "32px",
          borderRadius: "8px",
          backgroundColor: hasNext ? "neutral.50" : "neutral.100",
          border: "1px solid",
          borderColor: "neutral.200",
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: "neutral.100",
            borderColor: "neutral.300",
            transform: "translateY(-1px)",
            boxShadow: "md",
          },
          "&:active": {
            transform: "translateY(0px)",
          },
          "&:disabled": {
            backgroundColor: "neutral.50",
            borderColor: "neutral.100",
            opacity: 0.5,
          },
        }}
      >
        <ArrowForwardIosIcon
          fontSize="small"
          sx={{
            color: hasNext ? "neutral.700" : "neutral.400",
            ml: "-1px", // Slight adjustment for visual centering
          }}
        />
      </IconButton>
    </Box>
  );
};

export default RecordNavigation;
