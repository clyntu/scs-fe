import { useEffect, useState, useRef, useCallback } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Input, FormControl, FormLabel, CircularProgress, Typography } from "@mui/joy";
import WarehousesModal from "../../components/Warehouses/WarehousesModal";
import DeleteWarehousesModal from "../../components/Warehouses/DeleteWarehouseModal";
import ViewWHModal from "../../components/Items/ViewWHModal";
import axiosInstance from "../../utils/axiosConfig";
import type { User } from "../Login";
import { toast } from "react-toastify";

import type { Warehouse, PaginatedWarehouse } from "../../interface";

import { convertToQueryParams, formatToWH, formatToDate } from "../../helper";
import TooltipTableCell from "../../components/shared/TooltipTableCell";

const WarehouseForm = (): JSX.Element => {
  const [openWH, setOpenWH] = useState(false);
  const [warehouses, setWarehouses] = useState<PaginatedWarehouse>({
    total: 0,
    items: [],
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Warehouse>();
  const [userId, setUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

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
  const getAllWarehouse = (searchTerm: string): void => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    setPage(1);
    setWarehouses({ total: 0, items: [] });
    setHasMore(true);
    setIsLoading(true);
    isLoadingRef.current = false;

    axiosInstance
      .get<PaginatedWarehouse>(
        `/api/warehouses/?${convertToQueryParams({
          page: 1,
          limit,
          sort_by: "id",
          sort_order: "desc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => {
        setWarehouses(response.data);
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
    if (isLoadingRef.current || isLoadingMore || !hasMore) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    axiosInstance
      .get<PaginatedWarehouse>(
        `/api/warehouses/?${convertToQueryParams({
          page: nextPage,
          limit,
          sort_by: "id",
          sort_order: "desc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => {
        const newItems = response.data.items;
        setWarehouses((prev) => {
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
  }, [isLoadingMore, hasMore, page, searchTerm]);

  // Handle scroll event for infinite scroll with debouncing
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

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
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      getAllWarehouse(searchTerm);
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // 💨 cancel if any dep changes
  }, [searchTerm]);

  useEffect(() => {
    // Fetch warehouses
    // getAllWarehouse(page, searchTerm);
    // Fetch user ID
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error("Error fetching user ID:", error));
  }, []);

  const handleSaveWarehouse = async (
    newWarehouse: Warehouse,
  ): Promise<void> => {
    const url = `/api/warehouses/${newWarehouse.id}`;

    const payload = {
      name: newWarehouse.name,
      type: newWarehouse.type,
      modified_by: userId,
      id: newWarehouse.id,
      code: newWarehouse.code,
    };

    const response = await axiosInstance.put(url, payload);
    setWarehouses((prevWarehouse) => ({
      ...prevWarehouse,
      items: prevWarehouse.items.map((warehouse) =>
        warehouse.id === response.data.id ? response.data : warehouse,
      ),
    }));

    toast.success("Save successful!");
  };

  const handleCreateWarehouse = async (
    newWarehouse: Warehouse,
  ): Promise<void> => {
    const payload = {
      id: newWarehouse.id,
      name: newWarehouse.name,
      type: newWarehouse.type,
      created_by: userId,
      code: newWarehouse.code,
    };

    const response = await axiosInstance.post("/api/warehouses/", payload);

    setWarehouses((prevWarehouse) => ({
      ...prevWarehouse,
      items: [response.data, ...prevWarehouse.items],
      total: prevWarehouse.total + 1,
    }));

    toast.success("Save successful!");
  };

  const handleDeleteWarehouse = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/warehouses/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
        setWarehouses((prevWarehouse) => ({
          ...prevWarehouse,
          items: prevWarehouse.items.filter(
            (warehouse) => warehouse.id !== selectedRow.id,
          ),
          total: prevWarehouse.total - 1,
        }));
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            mb: 3,
            gap: 1,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "start", sm: "center" },
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Typography level="h2" component="h1">
            Warehouses
          </Typography>
          <Button
            className="bg-button-primary"
            color="primary"
            startDecorator={<AddRoundedIcon />}
            onClick={() => {
              setOpenAdd(true);
            }}
          >
            Add Warehouse
          </Button>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 1.5,
            mb: 3,
            p: 1.5,
            borderRadius: "sm",
            backgroundColor: "background.level1",
          }}
        >
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              placeholder="Code"
              startDecorator={<SearchRoundedIcon fontSize="small" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>
          {/* <Button
            onClick={() => {
              getAllWarehouse(1, searchTerm);
            }}
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
            "--Table-lastColumnWidth": "220px",
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.04)",
            overflow: "auto",
            borderRadius: "sm",
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
            maxHeight: "calc(100dvh - 280px)",
          }}
        >
          <Table
            className="h-5"
            size="sm"
            stickyHeader
            hoverRow
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
                bgcolor: "background.surface",
                zIndex: 10,
              },
              "& thead tr > *:first-child": {
                position: "sticky",
                left: 0,
                top: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.level1",
                zIndex: 11,
              },
              "& thead tr > *:last-child": {
                position: "sticky",
                right: 0,
                top: 0,
                bgcolor: "background.level1",
                zIndex: 11,
              },
              "& thead th": {
                backgroundColor: "background.level1",
              },
              "& tbody tr:hover": {
                cursor: "pointer",
              },
            }}
            borderAxis="both"
          >
            {isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
                      <CircularProgress size="sm" />
                      <Typography level="body-sm">Loading warehouses...</Typography>
                    </Box>
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <thead>
                  <tr>
                    <th style={{ width: "var(--Table-firstColumnWidth)" }}>Code</th>
                    <th style={{ width: 300 }}>Name</th>
                    <th style={{ width: 100 }}>Type</th>
                    <th style={{ width: 150 }}>Created By</th>
                    <th style={{ width: 120 }}>Date Created</th>
                    <th style={{ width: 150 }}>Modified By</th>
                    <th style={{ width: 120 }}>Date Modified</th>
                    <th
                      aria-label="actions"
                      style={{ width: "var(--Table-lastColumnWidth)" }}
                    />
                  </tr>
                </thead>
                <tbody>
              {warehouses.items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: "24px" }}
                  >
                    <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                      No warehouses found.
                    </Typography>
                  </td>
                </tr>
              )}
              {warehouses.items.map((warehouse) => (
                <tr
                  key={warehouse.id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(warehouse);
                  }}
                >
                  <td>{warehouse.code}</td>
                  <td>
                    <TooltipTableCell maxWidth="300px">
                      {warehouse.name}
                    </TooltipTableCell>
                  </td>
                  <td>{warehouse.type}</td>
                  <td>
                    <TooltipTableCell maxWidth="200px">
                      {warehouse?.creator?.username}
                    </TooltipTableCell>
                  </td>
                  <td>{formatToDate(warehouse.date_created)}</td>
                  <td>
                    <TooltipTableCell maxWidth="200px">
                      {warehouse?.modifier?.username}
                    </TooltipTableCell>
                  </td>
                  <td>{formatToDate(warehouse.date_modified)}</td>
                  <td>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        sx={{ fontSize: "xs" }}
                        size="sm"
                        variant="plain"
                        color="primary"
                        className="bg-primary"
                        onClick={() => {
                          setOpenWH(true);
                          setSelectedRow(warehouse);
                        }}
                      >
                        Stocks
                      </Button>
                      <Button
                        sx={{ fontSize: "xs" }}
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(warehouse);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        sx={{ fontSize: "xs" }}
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(warehouse);
                        }}
                      >
                        Delete
                      </Button>
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
        {warehouses.items.length > 0 && (
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
                Showing {warehouses.items.length} of {warehouses.total} items • Scroll for
                more
              </Typography>
            ) : (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing all {warehouses.total} items
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <WarehousesModal
        open={openAdd}
        setOpen={setOpenAdd}
        title="Add Warehouses"
        onSave={handleCreateWarehouse}
      />
      <WarehousesModal
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Warehouse"
        row={selectedRow}
        onSave={handleSaveWarehouse}
      />
      <DeleteWarehousesModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Warehouse"
        onDelete={handleDeleteWarehouse}
      />
      <ViewWHModal
        open={openWH}
        setOpen={setOpenWH}
        row={selectedRow}
        type="warehouse"
      />
    </>
  );
};

export default WarehouseForm;
