import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Table,
  Sheet,
  Input,
  Select,
  Option,
  FormControl,
  FormLabel,
  CircularProgress,
  Typography,
} from "@mui/joy";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import type {
  PaginatedDealloc,
  PaginationQueryParams,
  ViewDeallocProps,
} from "../../interface";

import { convertToQueryParams, formatToDate } from "../../helper";
import DeleteDeallocModal from "./DeleteDeallocModal";
import ArchiveConfirmModal from "../shared/ArchiveConfirmModal";
import { StatusChip } from "../../utils/statusUtils";
import { withTooltip } from "../shared/withTooltip";
import DateRangeFilter, { getDefaultDateFrom, getDefaultDateTo } from "../shared/DateRangeFilter";

const ViewDealloc = ({
  setOpenCreate,
  setOpenEdit,
  selectedRow,
  setSelectedRow,
}: ViewDeallocProps): JSX.Element => {
  const [deallocs, setDeallocs] = useState<PaginatedDealloc>({
    total: 0,
    items: [],
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom());
  const [dateTo, setDateTo] = useState(getDefaultDateTo());

  // Infinite scroll states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;

  // Refs for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load function - resets everything and loads first page
  const getAllDealloc = (): void => {
    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset state for new search
    setPage(1);
    setDeallocs({ total: 0, items: [] });
    setHasMore(true);
    setIsLoading(true);
    isLoadingRef.current = false;

    const payload: PaginationQueryParams = {
      page: 1,
      limit,
      sort_by: "transaction_date",
      sort_order: "desc",
      search_term: searchTerm,
      date_from: dateFrom,
      date_to: dateTo,
    };

    if (status !== "all") {
      payload.status = status;
    }

    axiosInstance
      .get<PaginatedDealloc>(
        `/api/deallocations/?${convertToQueryParams(payload)}`,
      )
      .then((response) => {
        setDeallocs(response.data);
        setHasMore(response.data.items.length < response.data.total);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoading(false);
      });
  };

  // Load more data for infinite scroll
  const loadMore = useCallback(() => {
    // Prevent duplicate requests using ref (synchronous check)
    if (isLoadingRef.current || isLoadingMore || !hasMore) {
      return;
    }

    // Mark as loading immediately (synchronous)
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    const payload: PaginationQueryParams = {
      page: nextPage,
      limit,
      sort_by: "transaction_date",
      sort_order: "desc",
      search_term: searchTerm,
      date_from: dateFrom,
      date_to: dateTo,
    };

    if (status !== "all") {
      payload.status = status;
    }

    axiosInstance
      .get<PaginatedDealloc>(
        `/api/deallocations/?${convertToQueryParams(payload)}`,
      )
      .then((response) => {
        const newItems = response.data.items;
        setDeallocs((prev) => {
          const updated = {
            total: response.data.total,
            items: [...prev.items, ...newItems],
          };
          setHasMore(updated.items.length < response.data.total);
          return updated;
        });
        setPage(nextPage);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      });
  }, [isLoadingMore, hasMore, page, searchTerm, status, limit, dateFrom, dateTo]);

  // Handle scroll event for infinite scroll with debouncing
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce scroll events by 100ms
    scrollTimeoutRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Trigger load more when scrolled to within 200px of bottom
      if (distanceFromBottom < 200 && hasMore && !isLoadingRef.current) {
        loadMore();
      }
    }, 100);
  }, [loadMore, hasMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      // Clear timeout on cleanup
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      getAllDealloc();
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // cancel if any dep changes
  }, [searchTerm, status, dateFrom, dateTo]);

  const handleDeleteDealloc = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/deallocations/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
        setDeallocs({
          items: deallocs.items.filter(
            (dealloc) => dealloc.id !== selectedRow.id,
          ),
          total: deallocs.total - 1,
        });
      } catch (error: any) {
        toast.error(
          `Error message: ${error?.response?.data?.detail || "Delete unsuccessful"}`,
        );
      }
    }
  };

  const handleArchiveDealloc = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/deallocations/${selectedRow.id}`;
      try {
        const response = await axiosInstance.delete(url);
        toast.success("Archive successful!");
        const archivedDealloc = response.data;
        setDeallocs((prev) => ({
          ...prev,
          items: prev.items.map((dealloc) =>
            dealloc.id === selectedRow.id
              ? { ...dealloc, ...archivedDealloc }
              : dealloc,
          ),
        }));
      } catch (error: any) {
        toast.error(
          `Error message: ${error?.response?.data?.detail || "Archive unsuccessful"}`,
        );
      }
    }
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            mb: 4,
          }}
          className="flex justify-between"
        >
          <h2>Deallocation</h2>
          <Button
            className="mt-2 bg-button-primary"
            color="primary"
            onClick={() => {
              setOpenCreate(true);
            }}
          >
            Add Deallocation
          </Button>
        </Box>
        <Box className="flex items-center mb-6">
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              sx={{ width: 250 }}
              placeholder="Dealloc No., Customer, or Remarks"
              startDecorator={<SearchRoundedIcon fontSize="small" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>
          <FormControl sx={{ ml: 2 }}>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Status</FormLabel>
            <Select
              sx={{ width: 130 }}
              onChange={(event, value) => {
                if (value !== null) setStatus(value);
              }}
              size="sm"
              value={status}
            >
              <Option value="all">Active</Option>
              <Option value="unposted">Unposted</Option>
              <Option value="posted">Posted</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </FormControl>
          <DateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
          {/* <Button
            onClick={getAllDealloc}
            sx={{
              ml: 2,
              width: "80px",
            }}
            className="bg-button-primary"
            size="sm"
          >
            Search
          </Button> */}
        </Box>

        <Sheet
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            "--TableCell-height": "40px",
            // the number is the amount of the header rows.
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "100px",
            "--Table-lastColumnWidth": "160px",
            // background needs to have transparency to show the scrolling shadows
            "--TableRow-stripeBackground": "rgba(0 0 0 / 0.04)",
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.08)",
            overflow: "auto",
            borderRadius: 8,
            background: (
              theme,
            ) => `linear-gradient(to right, ${theme.vars.palette.background.surface} 30%, rgba(255, 255, 255, 0)),
            linear-gradient(to right, rgba(255, 255, 255, 0), ${theme.vars.palette.background.surface} 70%) 0 100%,
            radial-gradient(
              farthest-side at 0 50%,
              rgba(0, 0, 0, 0.12),
              rgba(0, 0, 0, 0)
            ),
            radial-gradient(
                farthest-side at 100% 50%,
                rgba(0, 0, 0, 0.12),
                rgba(0, 0, 0, 0)
              )
              0 100%`,
            backgroundSize:
              "40px calc(100% - var(--TableCell-height)), 40px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height))",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local, local, scroll, scroll",
            backgroundPosition:
              "var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height), var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height)",
            backgroundColor: "background.surface",
            maxHeight: "450px",
          }}
        >
          <Table
            className="h-5"
            stickyHeader
            sx={{
              "& tbody tr > *:first-child": {
                position: "sticky",
                left: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.surface",
                zIndex: 10,
              },
              "& tbody tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "var(--TableCell-headBackground)",
                zIndex: 10,
              },
              "& thead tr > *:first-child": {
                position: "sticky",
                left: 0,
                top: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "var(--TableCell-headBackground)",
                zIndex: 11,
              },
              "& thead tr > *:last-child": {
                position: "sticky",
                right: 0,
                top: 0,
                bgcolor: "var(--TableCell-headBackground)",
                zIndex: 11,
              },
              "& tbody tr:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.015)", // Add hover effect
                cursor: "pointer", // Change cursor on hover
              },
            }}
            borderAxis="both"
          >
            {isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "20px" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
                      <CircularProgress size="sm" />
                      <Typography level="body-sm">Loading deallocations...</Typography>
                    </Box>
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <thead>
                  <tr>
                    <th style={{ width: "var(--Table-firstColumnWidth)" }}>
                      Dealloc No.
                    </th>
                    <th style={{ width: 120 }}>Tx. Date</th>
                    <th style={{ width: 250 }}>Customer</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 80 }}>Alloc No.</th>
                    <th style={{ width: 200 }}>Remarks</th>
                    <th style={{ width: 150 }}>Created By</th>
                    <th style={{ width: 150 }}>Modified By</th>
                    <th style={{ width: 120 }}>Date Created</th>
                    <th style={{ width: 120 }}>Date Modified</th>
                    <th
                      aria-label="last"
                      style={{ width: "var(--Table-lastColumnWidth)" }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {deallocs.items.map((dealloc) => (
                    <tr
                      key={dealloc.id}
                      onDoubleClick={() => {
                        setOpenEdit(true);
                        setSelectedRow(dealloc);
                      }}
                    >
                      <td>{dealloc?.id}</td>
                      <td>{dealloc?.transaction_date}</td>
                      <td>{withTooltip(dealloc?.customer?.name, "230px")}</td>
                      <td>
                        <StatusChip status={dealloc.status} />
                      </td>
                      <td>{dealloc?.allocation_id}</td>
                      <td>{withTooltip(dealloc?.remarks, "180px")}</td>
                      <td>{withTooltip(dealloc?.creator?.username, "130px")}</td>
                      <td>{withTooltip(dealloc?.modifier?.username, "130px")}</td>
                      <td>{formatToDate(dealloc.date_created)}</td>
                      <td>{formatToDate(dealloc.date_modified)}</td>
                      <td>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            sx={{ width: "100px" }}
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => {
                              setOpenEdit(true);
                              setSelectedRow(dealloc);
                            }}
                          >
                            {dealloc.status !== "unposted" ? "View" : "Edit"}
                          </Button>
                          {(dealloc.status === "posted" ||
                            dealloc.status === "archived") && (
                            <Button
                              size="sm"
                              variant="soft"
                              color="warning"
                              onClick={() => {
                                setOpenArchive(true);
                                setSelectedRow(dealloc);
                              }}
                              disabled={dealloc.status === "archived"}
                            >
                              Archive
                            </Button>
                          )}
                          {dealloc.status === "unposted" && (
                            <Button
                              size="sm"
                              variant="soft"
                              color="danger"
                              className="bg-delete-red"
                              onClick={() => {
                                setOpenDelete(true);
                                setSelectedRow(dealloc);
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </Table>
        </Sheet>

        {/* Infinite Scroll Status */}
        {deallocs.items.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: 2,
              px: 1,
              gap: 2,
            }}
          >
            {isLoadingMore ? (
              <>
                <CircularProgress size="sm" />
                <Typography level="body-sm">Loading more...</Typography>
              </>
            ) : hasMore ? (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing {deallocs.items.length} of {deallocs.total} items • Scroll for
                more
              </Typography>
            ) : (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing all {deallocs.total} items
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <DeleteDeallocModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Deallocation"
        onDelete={handleDeleteDealloc}
      />
      <ArchiveConfirmModal
        open={openArchive}
        setOpen={setOpenArchive}
        transactionType="Deallocation"
        onArchive={handleArchiveDealloc}
      />
    </>
  );
};

export default ViewDealloc;
