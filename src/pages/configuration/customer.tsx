import { useEffect, useState, useRef, useCallback } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import {
  Input,
  FormControl,
  FormLabel,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  CircularProgress,
  Typography,
} from "@mui/joy";
import CustomersModal from "../../components/Customers/CustomersModal";
import axiosInstance from "../../utils/axiosConfig";
import type { User } from "../Login";
import { toast } from "react-toastify";

import type { Customer, PaginatedCustomers } from "../../interface";

import { convertToQueryParams, formatToCP, formatToDate } from "../../helper";
import DeleteCustomersModal from "../../components/Customers/DeleteCustomersModal";
import TooltipTableCell from "../../components/shared/TooltipTableCell";
import PrintCustomerPaymentHistoryModal from "../../components/Customers/PrintCustomerPaymentHistoryModal";
import PrintCustomerReceivablesModal from "../../components/Customers/PrintCustomerReceivablesModal";
import PrintTopCustomersModal from "../../components/Customers/PrintTopCustomersModal";

const CustomerForm = (): JSX.Element => {
  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);
  const [openPrintReceivables, setOpenPrintReceivables] = useState(false);
  const [openPrintTopCustomers, setOpenPrintTopCustomers] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Customer>();
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
  const getAllCustomers = (searchTerm: string): void => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    setPage(1);
    setCustomers({ total: 0, items: [] });
    setHasMore(true);
    setIsLoading(true);
    isLoadingRef.current = false;

    axiosInstance
      .get<PaginatedCustomers>(
        `/api/customers/?${convertToQueryParams({
          page: 1,
          limit,
          sort_by: "name",
          sort_order: "asc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => {
        setCustomers(response.data);
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
      .get<PaginatedCustomers>(
        `/api/customers/?${convertToQueryParams({
          page: nextPage,
          limit,
          sort_by: "name",
          sort_order: "asc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => {
        const newItems = response.data.items;
        setCustomers((prev) => {
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
      getAllCustomers(searchTerm);
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // 💨 cancel if any dep changes
  }, [searchTerm]);

  useEffect(() => {
    // Fetch customers
    // getAllCustomers(page, searchTerm);

    // Fetch user ID
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error("Error fetching user ID:", error));
  }, []);

  const handleSaveCustomer = async (newCustomer: Customer): Promise<void> => {
    const url = `/api/customers/${newCustomer.customer_id}`;

    const payload = {
      customer_id: newCustomer.customer_id,
      name: newCustomer.name,
      address: newCustomer.address,
      contact_person: newCustomer.contact_person,
      contact_number: newCustomer.contact_number,
      email: newCustomer.email,
      customer_balance: newCustomer.customer_balance,
      modified_by: userId,
      notes: newCustomer.notes,
    };

    const response = await axiosInstance.put(url, payload);
    setCustomers((prevCustomers) => ({
      ...prevCustomers,
      items: prevCustomers.items.map((customer) =>
        customer.customer_id === response.data.customer_id
          ? response.data
          : customer,
      ),
    }));

    toast.success("Save successful!");
  };

  const handleCreateCustomer = async (newCustomer: Customer): Promise<void> => {
    const payload = {
      name: newCustomer.name,
      address: newCustomer.address,
      contact_person: newCustomer.contact_person,
      contact_number: newCustomer.contact_number,
      email: newCustomer.email,
      customer_balance: newCustomer.customer_balance,
      created_by: userId,
      notes: newCustomer.notes,
    };
    const response = await axiosInstance.post("/api/customers/", payload);

    setCustomers((prevCustomers) => ({
      ...prevCustomers,
      items: [response.data, ...prevCustomers.items],
      total: prevCustomers.total + 1,
    }));

    toast.success("Save successful!");
  };

  const handleDeleteCustomer = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/customers/${selectedRow.customer_id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
        setCustomers((prevCustomers) => ({
          ...prevCustomers,
          items: prevCustomers.items.filter(
            (customer) => customer.customer_id !== selectedRow.customer_id,
          ),
          total: prevCustomers.total - 1,
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
          className="flex justify-between"
          sx={{
            mb: 4,
          }}
        >
          <h2>Customers</h2>

          <div className="flex items-center gap-3">
            {/* Print Reports Dropdown */}
            <Dropdown>
              <MenuButton
                variant="soft"
                sx={{
                  width: "140px",
                  height: "36px",
                }}
                className="bg-button-soft-primary"
              >
                Print Reports
              </MenuButton>
              <Menu>
                <MenuItem
                  onClick={() => setOpenPrint(true)}
                  sx={{ fontSize: "14px" }}
                >
                  Payment History
                </MenuItem>
                <MenuItem
                  onClick={() => setOpenPrintReceivables(true)}
                  sx={{ fontSize: "14px" }}
                >
                  Customer Receivables
                </MenuItem>
                <MenuItem
                  onClick={() => setOpenPrintTopCustomers(true)}
                  sx={{ fontSize: "14px" }}
                >
                  Top Customers by Sales
                </MenuItem>
              </Menu>
            </Dropdown>

            {/* Add Customers Button */}
            <Button
              sx={{ width: "140px", height: "36px" }}
              className="bg-button-primary"
              color="primary"
              onClick={() => {
                setOpenAdd(true);
              }}
            >
              Add Customers
            </Button>
          </div>
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
                  <td colSpan={12} style={{ textAlign: "center", padding: "20px" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
                      <CircularProgress size="sm" />
                      <Typography level="body-sm">Loading customers...</Typography>
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
                    <th style={{ width: 150 }}>Customer Balance</th>
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
              {customers.items.map((customer) => (
                <tr
                  key={customer.customer_id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(customer);
                  }}
                >
                  <td>{formatToCP(customer.customer_id)}</td>
                  <td>
                    <TooltipTableCell maxWidth="300px">
                      {customer.name}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="400px">
                      {customer.address}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="150px">
                      {customer.contact_person}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="150px">
                      {customer.contact_number}
                    </TooltipTableCell>
                  </td>
                  <td>
                    <TooltipTableCell maxWidth="300px">
                      {customer.email}
                    </TooltipTableCell>
                  </td>
                  <td>{customer.customer_balance}</td>
                  <td>
                    <TooltipTableCell maxWidth="200px">
                      {customer?.creator?.full_name}
                    </TooltipTableCell>
                  </td>
                  <td>{formatToDate(customer.date_created)}</td>
                  <td>
                    <TooltipTableCell maxWidth="200px">
                      {customer?.modifier?.full_name}
                    </TooltipTableCell>
                  </td>
                  <td>{formatToDate(customer.date_modified ?? undefined)}</td>
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
                          setSelectedRow(customer);
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
                          setSelectedRow(customer);
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
        {customers.items.length > 0 && (
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
                Showing {customers.items.length} of {customers.total} items • Scroll for
                more
              </Typography>
            ) : (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing all {customers.total} items
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <CustomersModal
        open={openAdd}
        setOpen={setOpenAdd}
        title="Add Customers"
        onSave={handleCreateCustomer}
      />
      <CustomersModal
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Customers"
        row={selectedRow}
        onSave={handleSaveCustomer}
      />
      <DeleteCustomersModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Customers"
        onDelete={handleDeleteCustomer}
      />
      <PrintCustomerPaymentHistoryModal
        open={openPrint}
        setOpen={setOpenPrint}
      />
      <PrintCustomerReceivablesModal
        open={openPrintReceivables}
        onClose={() => setOpenPrintReceivables(false)}
      />
      <PrintTopCustomersModal
        open={openPrintTopCustomers}
        onClose={() => setOpenPrintTopCustomers(false)}
      />
    </>
  );
};

export default CustomerForm;
