import { useEffect, useState, useRef, useCallback } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import { Input, FormControl, FormLabel, CircularProgress, Typography } from "@mui/joy";
import SuppliersModal from "../../components/Suppliers/SuppliersModal";
import DeleteSuppliersModal from "../../components/Suppliers/DeleteSupplierModal";
import axiosInstance from "../../utils/axiosConfig";
import type { User } from "../Login";
import { toast } from "react-toastify";

import type { Supplier, PaginatedSuppliers } from "../../interface";

import { convertToQueryParams, formatToSP, formatToDate } from "../../helper";
import TooltipTableCell from "../../components/shared/TooltipTableCell";

const SupplierForm = (): JSX.Element => {
  const [suppliers, setSuppliers] = useState<PaginatedSuppliers>({
    total: 0,
    items: [],
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Supplier>();
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
  const getAllSuppliers = (searchTerm: string): void => {
    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset state for new search
    setPage(1);
    setSuppliers({ total: 0, items: [] });
    setHasMore(true);
    setIsLoading(true);
    isLoadingRef.current = false;

    axiosInstance
      .get<PaginatedSuppliers>(
        `/api/suppliers/?${convertToQueryParams({
          page: 1,
          limit,
          sort_by: "name",
          sort_order: "asc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => {
        setSuppliers(response.data);
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

    axiosInstance
      .get<PaginatedSuppliers>(
        `/api/suppliers/?${convertToQueryParams({
          page: nextPage,
          limit,
          sort_by: "name",
          sort_order: "asc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => {
        const newItems = response.data.items;
        setSuppliers((prev) => {
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
      getAllSuppliers(searchTerm);
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // 💨 cancel if any dep changes
  }, [searchTerm]);

  useEffect(() => {
    // Fetch suppliers
    // getAllSuppliers(page, searchTerm);
    // Fetch user ID
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error("Error fetching user ID:", error));
  }, []);

  const handleSaveSupplier = async (newSupplier: Supplier): Promise<void> => {
    const url = `/api/suppliers/${newSupplier.supplier_id}`;

    const payload = {
      supplier_id: newSupplier.supplier_id,
      name: newSupplier.name,
      address: newSupplier.address,
      contact_person: newSupplier.contact_person,
      contact_number: newSupplier.contact_number,
      email: newSupplier.email,
      currency: newSupplier.currency,
      supplier_balance: newSupplier.supplier_balance,
      modified_by: userId,
      notes: newSupplier.notes,
    };

    const response = await axiosInstance.put(url, payload);
    setSuppliers((prevSuppliers) => ({
      ...prevSuppliers,
      items: prevSuppliers.items.map((supplier) =>
        supplier.supplier_id === response.data.supplier_id
          ? response.data
          : supplier,
      ),
    }));

    toast.success("Save successful!");
  };

  const handleCreateSupplier = async (newSupplier: Supplier): Promise<void> => {
    const payload = {
      name: newSupplier.name,
      address: newSupplier.address,
      contact_person: newSupplier.contact_person,
      contact_number: newSupplier.contact_number,
      email: newSupplier.email,
      currency: newSupplier.currency,
      supplier_balance: newSupplier.supplier_balance,
      created_by: userId,
      notes: newSupplier.notes,
    };
    const response = await axiosInstance.post("/api/suppliers/", payload);

    setSuppliers((prevSuppliers) => ({
      ...prevSuppliers,
      items: [response.data, ...prevSuppliers.items],
      total: prevSuppliers.total + 1,
    }));

    toast.success("Save successful!");
  };

  const handleDeleteSupplier = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/suppliers/${selectedRow.supplier_id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
        setSuppliers((prevSuppliers) => ({
          ...prevSuppliers,
          items: prevSuppliers.items.filter(
            (supplier) => supplier.supplier_id !== selectedRow.supplier_id,
          ),
          total: prevSuppliers.total - 1,
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
            mb: 4,
          }}
          className="flex justify-between"
        >
          <h2>Suppliers</h2>
          <Button
            className="mt-2 bg-button-primary"
            color="primary"
            onClick={() => {
              setOpenAdd(true);
            }}
          >
            Add Suppliers
          </Button>
        </Box>

        <Box className="flex items-center mb-6">
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              placeholder="Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>
        </Box>
        <Sheet
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            "--TableCell-height": "40px",
            // the number is the amount of the header rows.
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "100px",
            "--Table-lastColumnWidth": "144px",
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
              },
              "& tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "var(--TableCell-headBackground)",
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
                      <Typography level="body-sm">Loading suppliers...</Typography>
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
                    <th style={{ width: 400 }}>Address</th>
                    <th style={{ width: 150 }}>Contact Person</th>
                    <th style={{ width: 150 }}>Contact Number</th>
                    <th style={{ width: 300 }}>Email</th>
                    <th style={{ width: 100 }}>Currency</th>
                    <th style={{ width: 150 }}>Supplier Balance</th>
                    <th style={{ width: 150 }}>Created By</th>
                    <th style={{ width: 120 }}>Date Created</th>
                    <th style={{ width: 150 }}>Modified By</th>
                    <th style={{ width: 120 }}>Date Modified</th>
                    <th
                      aria-label="last"
                      style={{ width: "var(--Table-lastColumnWidth)" }}
                    />
                  </tr>
                </thead>
                <tbody>
              {suppliers.items.map((supplier) => (
                <tr
                  key={supplier.supplier_id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(supplier);
                  }}
                >
                  <td>{formatToSP(supplier.supplier_id)}</td>
                  <td>
                    <TooltipTableCell maxWidth="300px">
                      {supplier.name}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="400px">
                      {supplier.address}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="150px">
                      {supplier.contact_person}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="150px">
                      {supplier.contact_number}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="300px">
                      {supplier.email}
                    </TooltipTableCell>
                  </td>
                  <td>{supplier.currency}</td>
                  <td style={{ textAlign: "right" }}>
                    {supplier.supplier_balance}
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="200px">
                      {supplier?.creator?.full_name}
                    </TooltipTableCell>
                  </td>
                  <td>{formatToDate(supplier.date_created)}</td>
                  <td>
                    <TooltipTableCell maxWidth="200px">
                      {supplier?.modifier?.full_name}
                    </TooltipTableCell>
                  </td>
                  <td>{formatToDate(supplier.date_modified)}</td>
                  <td style={{ textAlign: "center" }}>
                    <Box
                      sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                    >
                      <Button
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(supplier);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(supplier);
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
        {suppliers.items.length > 0 && (
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
                Showing {suppliers.items.length} of {suppliers.total} items • Scroll for
                more
              </Typography>
            ) : (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing all {suppliers.total} items
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <SuppliersModal
        open={openAdd}
        setOpen={setOpenAdd}
        title="Add Suppliers"
        onSave={handleCreateSupplier}
      />
      <SuppliersModal
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Supplier"
        row={selectedRow}
        onSave={handleSaveSupplier}
      />
      <DeleteSuppliersModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Supplier"
        onDelete={handleDeleteSupplier}
      />
    </>
  );
};

export default SupplierForm;
