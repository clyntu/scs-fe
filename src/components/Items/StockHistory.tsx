import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Card, Box, Table, CircularProgress, Typography } from "@mui/joy";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { addCommaToNumberWithFourPlaces, addCommaToNumberWithTwoPlaces } from "../../helper";
import { withTooltip } from "../shared/withTooltip";

import { type IStockHistory, type ViewStockHistory } from "../../interface";

const getRowKey = (history: IStockHistory): string =>
  `${history.transaction_type}-${history.transaction_number}-${history.transaction_date}`;

const StockHistory = ({
  open,
  setOpen,
  row,
  refetchTrigger,
}: ViewStockHistory): JSX.Element => {
  const [stockHistory, setStockHistory] = useState<IStockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [lastSelectedRow, setLastSelectedRow] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false); // Track loading state to prevent duplicate requests
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce scroll events

  // Reset and fetch initial data when row changes or modal opens
  useEffect(() => {
    if (row == null || row.id <= 0 || !open) return;

    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset state for new item
    setPage(1);
    setStockHistory([]);
    setHasMore(true);
    setIsLoading(true);
    isLoadingRef.current = false; // Reset loading ref

    axiosInstance
      .get(`/api/items/stock-history/?item_id=${row.id}&page=1&limit=${limit}`)
      .then((response) => {
        setStockHistory(response.data.items as IStockHistory[]);
        setTotal(response.data.total);
        setHasMore(response.data.items.length < response.data.total);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoading(false);
      });
  }, [row?.id, open, refetchTrigger]);

  // Load more data
  const loadMore = useCallback(() => {
    // Prevent duplicate requests using ref (synchronous check)
    if (
      isLoadingRef.current ||
      isLoadingMore ||
      !hasMore ||
      row == null ||
      row.id <= 0
    ) {
      return;
    }

    // Mark as loading immediately (synchronous)
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    console.log('Loading page:', nextPage);

    axiosInstance
      .get(
        `/api/items/stock-history/?item_id=${row.id}&page=${nextPage}&limit=${limit}`,
      )
      .then((response) => {
        const newItems = response.data.items as IStockHistory[];
        setStockHistory((prev) => {
          const updated = [...prev, ...newItems];
          setHasMore(updated.length < response.data.total);
          return updated;
        });
        setPage(nextPage);
        setIsLoadingMore(false);
        isLoadingRef.current = false; // Reset ref after completion
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoadingMore(false);
        isLoadingRef.current = false; // Reset ref on error
      });
  }, [isLoadingMore, hasMore, page, row?.id]);

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

      console.log('Scroll event:', { scrollTop, scrollHeight, clientHeight, distanceFromBottom, hasMore, isLoading: isLoadingRef.current });

      // Trigger load more when scrolled to within 200px of bottom (increased threshold)
      if (distanceFromBottom < 200 && hasMore && !isLoadingRef.current) {
        console.log('Triggering loadMore');
        loadMore();
      }
    }, 100);
  }, [loadMore, hasMore]);

  // Attach scroll listener (keeping for compatibility but also using onScroll prop)
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

  // Also handle scroll via onScroll prop
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    handleScroll();
  };

  return (
    <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        setOpen(false);
      }}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Sheet
        variant="outlined"
        sx={{
          maxWidth: 1000,
          borderRadius: "md",
          p: 3,
          boxShadow: "lg",
        }}
      >
        <ModalClose variant="plain" sx={{ m: 1 }} />
        <Box>
          <h3 className="mb-6">Stock History</h3>
          <Card className="w-[100%] mr-7">
            <Sheet
              ref={scrollContainerRef}
              onScroll={onScroll}
              sx={{
                "--TableCell-height": "40px",
                // the number is the amount of the header rows.
                "--TableHeader-height": "calc(1 * var(--TableCell-height))",
                "--Table-firstColumnWidth": "120px",
                "--Table-lastColumnWidth": "150px",
                // background needs to have transparency to show the scrolling shadows
                "--TableRow-hoverBackground": "rgba(0 0 0 / 0.04)",
                overflow: "auto",
                overflowY: "scroll",
                borderRadius: "sm",
                background: (
                  theme,
                ) => `linear-gradient(to right, ${theme.vars.palette.background.surface} 30%, rgba(255, 255, 255, 0)),
            linear-gradient(to right, rgba(255, 255, 255, 0), ${theme.vars.palette.background.surface} 70%) 0 100%,
            radial-gradient(
              farthest-side at 0 50%,
              rgba(0, 0, 0, 0.12),
              rgba(0, 0, 0, 0)
            ),`,
                backgroundSize:
                  "40px calc(100% - var(--TableCell-height)), 40px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height))",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "local, local, scroll, scroll",
                backgroundPosition:
                  "var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height), var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height)",
                backgroundColor: "background.surface",
                height: "400px",
              }}
            >
              <Table
                className="h-5"
                size="sm"
                stickyHeader
                sx={{
                  fontSize: "13px",
                  tableLayout: "fixed",
                  "& tbody tr > *:first-child": {
                    position: "sticky",
                    zIndex: 2,
                    left: 0,
                    boxShadow: "1px 0 var(--TableCell-borderColor)",
                    bgcolor: "background.surface",
                  },
                  "& thead tr > *:first-child": {
                    position: "sticky",
                    left: 0,
                    top: 0,
                    zIndex: 3,
                    boxShadow: "1px 0 var(--TableCell-borderColor)",
                    bgcolor: "background.level1",
                  },
                  "& tr > *:not(:first-child)": {
                    position: "relative",
                    zIndex: 0,
                  },
                  "& thead th": {
                    backgroundColor: "background.level1",
                  },
                }}
                borderAxis="both"
              >
                {isLoading ? (
                  <div className="w-[100%] items-center">
                    <h5>Loading...</h5>
                  </div>
                ) : stockHistory.length > 0 ? (
                  <>
                    <thead>
                      <tr>
                        <th style={{ width: 120 }}>Supplier</th>
                        <th style={{ width: 180 }}>Customer</th>
                        <th style={{ width: 100 }}>TX Date</th>
                        <th style={{ width: 80, textAlign: "right" }}>TX #</th>
                        <th style={{ width: 70, textAlign: "right" }}>Out</th>
                        <th style={{ width: 70, textAlign: "right" }}>In</th>
                        <th style={{ width: 100, textAlign: "right" }}>
                          Price
                        </th>
                        <th style={{ width: 80 }}>Tx Type</th>
                        <th style={{ width: 120, textAlign: "right" }}>
                          Gross Amount
                        </th>
                        <th style={{ width: 160, textAlign: "right" }}>
                          Tx Discounts (%)
                        </th>
                        <th style={{ width: 120, textAlign: "right" }}>
                          NET Cost
                        </th>
                        <th style={{ width: 150 }}>Reference No.</th>
                      </tr>
                    </thead>

                    <tbody>
                      {stockHistory.map((history: IStockHistory, index) => {
                        const rowKey = getRowKey(history);
                        const isSelected = selectedRows.has(rowKey);

                        const handleRowClick = (
                          event: React.MouseEvent,
                        ): void => {
                          if (event.ctrlKey || event.metaKey) {
                            // Ctrl/Cmd + Click: Toggle selection of clicked row
                            setSelectedRows((prev) => {
                              const newSelection = new Set(prev);
                              if (newSelection.has(rowKey)) {
                                newSelection.delete(rowKey);
                              } else {
                                newSelection.add(rowKey);
                              }
                              return newSelection;
                            });
                            setLastSelectedRow(rowKey);
                          } else if (
                            event.shiftKey &&
                            lastSelectedRow != null
                          ) {
                            // Shift + Click: Select range from last selected to current
                            const lastIndex = stockHistory.findIndex(
                              (h) => getRowKey(h) === lastSelectedRow,
                            );
                            const currentIndex = index;
                            const startIndex = Math.min(
                              lastIndex,
                              currentIndex,
                            );
                            const endIndex = Math.max(lastIndex, currentIndex);

                            setSelectedRows((prev) => {
                              const newSelection = new Set(prev);
                              for (let i = startIndex; i <= endIndex; i++) {
                                const key = getRowKey(stockHistory[i]);
                                newSelection.add(key);
                              }
                              return newSelection;
                            });
                          } else {
                            // Normal click: Select only this row
                            setSelectedRows(new Set([rowKey]));
                            setLastSelectedRow(rowKey);
                          }
                        };

                        return (
                          <tr
                            key={rowKey}
                            onClick={handleRowClick}
                            style={{
                              backgroundColor: isSelected
                                ? "#e3f2fd"
                                : "inherit",
                              cursor: "pointer",
                              transition: "background-color 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor =
                                  "#f5f5f5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor =
                                  "inherit";
                              }
                            }}
                          >
                            <td>
                              {withTooltip(
                                history?.supplier_name ?? "-",
                                "100px",
                              )}
                            </td>
                            <td>
                              {withTooltip(
                                history?.customer_name ?? "-",
                                "160px",
                              )}
                            </td>
                            <td>{history.transaction_date}</td>
                            <td style={{ textAlign: "right" }}>
                              {history.transaction_number}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {history.quantity_out?.toLocaleString()}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {history.quantity_in?.toLocaleString()}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {addCommaToNumberWithTwoPlaces(history.price)}
                            </td>
                            <td>{history.transaction_type}</td>
                            <td style={{ textAlign: "right" }}>
                              {addCommaToNumberWithTwoPlaces(
                                history.gross_amount,
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {[
                                history.supplier_discount_1,
                                history.supplier_discount_2,
                                history.transaction_discount_1,
                                history.transaction_discount_2,
                              ]
                                .map((d) =>
                                  d != null && d.trim() !== "" ? d : "-",
                                )
                                .join(" / ")}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {history.transaction_type === "DR" ||
                              history.transaction_type === "CR"
                                ? "-"
                                : addCommaToNumberWithFourPlaces(
                                    history.net_cost,
                                  )}
                            </td>
                            <td>
                              {withTooltip(history?.reference_number, "130px")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </>
                ) : (
                  "No Stock History Available"
                )}
              </Table>
            </Sheet>
          </Card>

          {/* Infinite Scroll Status */}
          {stockHistory.length > 0 && (
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
                  Showing {stockHistory.length} of {total} records • Scroll for more
                </Typography>
              ) : (
                <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                  Showing all {total} records
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Sheet>
    </Modal>
  );
};

export default StockHistory;
