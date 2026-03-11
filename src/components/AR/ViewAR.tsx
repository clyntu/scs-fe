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
import axiosInstance from "../../utils/axiosConfig";
import DeleteARModal from "./DeleteARModal";
import { toast } from "react-toastify";
import type {
  ViewARProps,
  PaginatedAR,
  PaginationQueryParams,
} from "../../interface";
import { convertToQueryParams, formatToDate } from "../../helper";
import { StatusChip } from "../../utils/statusUtils";
import { withTooltip } from "../shared/withTooltip";

const ViewAR = ({
  setOpenCreate,
  setOpenEdit,
  selectedRow,
  setSelectedRow,
  isAdmin,
}: ViewARProps): JSX.Element => {
  const [ARs, setARs] = useState<PaginatedAR>({
    total: 0,
    items: [],
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

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
  const getAllAR = (): void => {
    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset state for new search
    setPage(1);
    setARs({ total: 0, items: [] });
    setHasMore(true);
    setIsLoading(true);
    isLoadingRef.current = false;

    const payload: PaginationQueryParams = {
      page: 1,
      limit,
      sort_by: "transaction_date",
      sort_order: "desc",
      search_term: searchTerm,
    };

    if (status !== "all") {
      payload.status = status;
    }

    if (paymentStatus !== "all") {
      payload.payment_status = paymentStatus;
    }

    axiosInstance
      .get<PaginatedAR>(`/api/ar-receipts/?${convertToQueryParams(payload)}`)
      .then((response) => {
        setARs(response.data);
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
    };

    if (status !== "all") {
      payload.status = status;
    }

    if (paymentStatus !== "all") {
      payload.payment_status = paymentStatus;
    }

    axiosInstance
      .get<PaginatedAR>(`/api/ar-receipts/?${convertToQueryParams(payload)}`)
      .then((response) => {
        const newItems = response.data.items;
        setARs((prev) => {
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
  }, [isLoadingMore, hasMore, page, searchTerm, status, paymentStatus]);

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
      getAllAR();
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // 💨 cancel if any dep changes
  }, [searchTerm, status, paymentStatus]);

  useEffect(() => {
    // Process uncleared receipts that are beyond clear date
    // Fetch ARs after
    axiosInstance
      .post("/api/ar-receipts/process-check-clearing/")
      .then((response) => getAllAR())
      .catch((error) => console.error("Error:", error));
  }, []);

  const handleDeleteAR = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/ar-receipts/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Archive successful!");

        // Update the AR's status to archived in the list
        setARs((prevAR) => ({
          ...prevAR,
          items: prevAR.items.map((AR) =>
            AR.id === selectedRow.id ? { ...AR, status: "archived" } : AR,
          ),
        }));
      } catch (error: any) {
        toast.error(
          `Error message: ${error?.response?.data?.detail?.[0]?.msg || error?.response?.data?.detail}`,
        );
        return;
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
          <h2>AR Receipts</h2>
          <div>
            {isAdmin && (
              <Button
                className="mt-2 bg-button-primary"
                sx={{
                  ml: 2,
                  width: 140,
                }}
                color="primary"
                onClick={() => {
                  setOpenCreate(true);
                }}
              >
                Add AR Receipt
              </Button>
            )}
          </div>
        </Box>
        <Box className="flex items-center mb-6">
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              sx={{ width: 250 }}
              placeholder="Customer"
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
              <Option value="posted">Posted</Option>
              <Option value="unposted">Unposted</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </FormControl>
          <FormControl sx={{ ml: 2 }}>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>
              Payment Status
            </FormLabel>
            <Select
              sx={{ width: 130 }}
              onChange={(event, value) => {
                if (value !== null) setPaymentStatus(value);
              }}
              size="sm"
              value={paymentStatus}
            >
              <Option value="all">All</Option>
              <Option value="pending">Pending</Option>
              <Option value="cleared">Cleared</Option>
              <Option value="reversed">Reversed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </FormControl>
          {/* <Button
            onClick={getAllAR}
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
            sx={{
              "& tr > *:first-child": {
                position: "sticky",
                left: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.surface",
                zIndex: 10,
              },
              "& tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "var(--TableCell-headBackground)",
                zIndex: 10,
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
                  <td colSpan={13} style={{ textAlign: "center", padding: "20px" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
                      <CircularProgress size="sm" />
                      <Typography level="body-sm">Loading receipts...</Typography>
                    </Box>
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <thead>
                  <tr>
                    <th style={{ width: "var(--Table-firstColumnWidth)" }}>
                      Receipt No.
                    </th>
                    <th style={{ width: 120 }}>Tx. Date</th>
                    <th style={{ width: 250 }}>Customer</th>
                    <th style={{ width: 150 }}>Check No.</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 150 }}>Payment Status</th>
                    <th style={{ width: 100 }}>Method</th>
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
                  {ARs.items.map((AR) => (
                    <tr
                      key={AR.id}
                      onDoubleClick={() => {
                        setOpenEdit(true);
                        setSelectedRow(AR);
                      }}
                    >
                      <td>{AR.id}</td>
                      <td>{AR.transaction_date}</td>
                      <td>{withTooltip(AR.customer.name, "280px")}</td>
                      <td>{withTooltip(AR.reference_number, "160px")}</td>
                      <td>
                        <StatusChip status={AR.status} />
                      </td>
                      <td className="capitalize">{AR.payment_status}</td>
                      <td className="capitalize">{AR.payment_method}</td>
                      <td>{withTooltip(AR.remarks, "180px")}</td>
                      <td>{withTooltip(AR?.creator?.username, "130px")}</td>
                      <td>{withTooltip(AR?.modifier?.username, "130px")}</td>
                      <td>{formatToDate(AR.date_created)}</td>
                      <td>{formatToDate(AR.date_modified)}</td>
                      <td style={{ textAlign: "center" }}>
                        <Box
                          sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                        >
                          <Button
                            sx={{ minWidth: 60 }}
                            size="sm"
                            variant="plain"
                            color="neutral"
                            onClick={() => {
                              setOpenEdit(true);
                              setSelectedRow(AR);
                            }}
                          >
                            {AR.status !== "unposted" || !isAdmin ? "View" : "Edit"}
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="soft"
                              color="danger"
                              className="bg-delete-red"
                              onClick={() => {
                                setOpenDelete(true);
                                setSelectedRow(AR);
                              }}
                              disabled={AR.status !== "unposted"}
                            >
                              Archive
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
        {ARs.items.length > 0 && (
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
                Showing {ARs.items.length} of {ARs.total} items • Scroll for
                more
              </Typography>
            ) : (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing all {ARs.total} items
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <DeleteARModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Archive Customer Return"
        onDelete={handleDeleteAR}
      />
    </>
  );
};

export default ViewAR;
