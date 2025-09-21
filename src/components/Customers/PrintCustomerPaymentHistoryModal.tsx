import { useState } from "react";
import {
  Modal,
  ModalDialog,
  ModalClose,
  Button,
  Box,
  FormControl,
  FormLabel,
  Autocomplete,
  Input,
  Typography,
  Divider,
} from "@mui/joy";
import axiosInstance, { getCompanyId } from "../../utils/axiosConfig";
import { convertToQueryParams } from "../../helper";
import { generateCustomerPaymentHistoryPDF } from "./generateCustomerPaymentHistoryPDF";
import type { Customer } from "../../interface";

// Payment history response interface based on the API endpoint
interface PaymentHistoryResponse {
  total: number;
  items: PaymentHistoryItem[];
  next_page?: string;
  previous_page?: string;
}

interface PaymentHistoryItem {
  id: number;
  reference_number: string | null;
  status: "unposted" | "posted";
  transaction_date: string;
  payment_method: "cash" | "check";
  payment_amount: string;
  check_amount: string | null;
  check_date: string | null;
  payment_date: string;
  payment_status: "pending" | "cleared" | "cancelled" | "reversed";
  clearing_date: string | null;
  total_applied: string;
  less_amount: string;
  add_amount: string;
  remarks: string | null;
  reversal_date: string | null;
  reversal_reason: string | null;
  customer: {
    customer_id: number;
    name: string;
  } | null;
}

interface PrintCustomerPaymentHistoryModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PrintCustomerPaymentHistoryModal = ({
  open,
  setOpen,
}: PrintCustomerPaymentHistoryModalProps): JSX.Element => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [isPrinting, setIsPrinting] = useState(false);

  const companyId = getCompanyId();

  // Fetch customers when dropdown is opened
  const fetchCustomers = (): void => {
    if (customers.length > 0) return; // Don't fetch if already loaded

    setCustomersLoading(true);
    axiosInstance
      .get<{ total: number; items: Customer[] }>(
        `/api/customers/?limit=1000&sort_by=name&sort_order=asc&with_payment_history=true`,
      )
      .then((response) => {
        setCustomers(response.data.items);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      })
      .finally(() => {
        setCustomersLoading(false);
      });
  };

  // Payment method options
  const paymentMethodOptions = [
    { value: "all", label: "All Payment Methods" },
    { value: "cash", label: "Cash" },
    { value: "check", label: "Check" },
  ];

  // Payment status options
  const paymentStatusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "cleared", label: "Cleared" },
    { value: "cancelled", label: "Cancelled" },
    { value: "reversed", label: "Reversed" },
  ];

  const handlePrint = (): void => {
    if (selectedCustomer === null) {
      return; // Don't proceed if no customer selected
    }

    setIsPrinting(true);

    // Build query parameters
    const queryParams: Record<string, any> = {
      page: 1,
      limit: 1000, // Get all records for the report
    };

    // Add optional filters
    if (fromDate !== "") queryParams.from_date = fromDate;
    if (toDate !== "") queryParams.to_date = toDate;
    if (paymentMethod !== "" && paymentMethod !== "all")
      queryParams.payment_method = paymentMethod;
    if (paymentStatus !== "" && paymentStatus !== "all")
      queryParams.payment_status = paymentStatus;

    // Call the API endpoint
    axiosInstance
      .get<PaymentHistoryResponse>(
        `/api/ar-receipts/customer/${selectedCustomer.customer_id}/payment-history?${convertToQueryParams(queryParams)}`,
      )
      .then((response) => {
        const items = response.data.items;

        // Prepare filters for PDF generation
        const filters = {
          fromDate: fromDate !== "" ? fromDate : undefined,
          toDate: toDate !== "" ? toDate : undefined,
          paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
          paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
        };

        generateCustomerPaymentHistoryPDF(
          items,
          companyId,
          selectedCustomer.name,
          filters,
        );
        setIsPrinting(false);
        setOpen(false);
        // Reset filters after printing
        resetFilters();
      })
      .catch((error) => {
        console.error("Error fetching payment history:", error);
        setIsPrinting(false);
        // You might want to show a toast notification here
      });
  };

  const resetFilters = (): void => {
    setSelectedCustomer(null);
    setFromDate("");
    setToDate("");
    setPaymentMethod("all");
    setPaymentStatus("all");
  };

  const handleClose = (): void => {
    setOpen(false);
    resetFilters();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog size="lg" sx={{ minWidth: 700 }}>
        <ModalClose />
        <Typography level="h4" component="h2">
          Print Customer Payment History
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box>
          {selectedCustomer !== null && (
            <p className="mb-4 text-sm text-gray-600">
              Selected Customer: <strong>{selectedCustomer.name}</strong>
            </p>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mb: 2,
            }}
          >
            <FormControl size="sm" sx={{ gridColumn: "1 / -1" }}>
              <FormLabel>Customer</FormLabel>
              <Autocomplete
                placeholder="Search and select a customer..."
                options={customers}
                value={selectedCustomer}
                loading={customersLoading}
                onOpen={fetchCustomers}
                onChange={(event, value) => {
                  setSelectedCustomer(value);
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) =>
                  option.customer_id === value.customer_id
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.customer_id}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                      }}
                    >
                      <div style={{ fontWeight: 500, fontSize: "14px" }}>
                        {option.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>ID: {option.customer_id}</span>
                        {option.customer_balance !== null &&
                          option.customer_balance !== undefined &&
                          option.customer_balance > 0 && (
                            <span style={{ fontWeight: 500 }}>
                              Balance: ₱
                              {option.customer_balance.toLocaleString()}
                            </span>
                          )}
                      </div>
                    </div>
                  </li>
                )}
                size="sm"
                slotProps={{
                  listbox: {
                    sx: {
                      maxHeight: "300px",
                      "& li": {
                        padding: "8px 12px",
                        margin: "2px 4px",
                        borderRadius: "6px",
                        border: "1px solid transparent",
                        "&:hover": {
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #e9ecef",
                        },
                        "&[aria-selected='true']": {
                          backgroundColor: "#e3f2fd",
                          border: "1px solid #2196f3",
                        },
                      },
                    },
                  },
                  input: {
                    autoComplete: "new-password",
                  },
                }}
                noOptionsText={
                  customersLoading
                    ? "Loading customers..."
                    : "No customers found"
                }
              />
            </FormControl>
            <FormControl size="sm">
              <FormLabel>From Date</FormLabel>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                size="sm"
                placeholder="Select start date"
              />
            </FormControl>

            <FormControl size="sm">
              <FormLabel>To Date</FormLabel>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                size="sm"
                placeholder="Select end date"
              />
            </FormControl>

            <FormControl size="sm">
              <FormLabel>Payment Method</FormLabel>
              <Autocomplete
                placeholder="Select Payment Method"
                options={paymentMethodOptions}
                value={
                  paymentMethodOptions.find(
                    (option) => option.value === paymentMethod,
                  ) ?? paymentMethodOptions[0]
                }
                onChange={(event, value) => {
                  setPaymentMethod(value?.value ?? "all");
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                size="sm"
                slotProps={{
                  listbox: {
                    sx: {
                      fontSize: "13px",
                      "& li": {
                        padding: "6px 12px",
                        margin: "1px 0",
                        borderRadius: "4px",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      },
                    },
                  },
                }}
              />
            </FormControl>

            <FormControl size="sm">
              <FormLabel>Payment Status</FormLabel>
              <Autocomplete
                placeholder="Select Payment Status"
                options={paymentStatusOptions}
                value={
                  paymentStatusOptions.find(
                    (option) => option.value === paymentStatus,
                  ) ?? paymentStatusOptions[0]
                }
                onChange={(event, value) => {
                  setPaymentStatus(value?.value ?? "all");
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                size="sm"
                slotProps={{
                  listbox: {
                    sx: {
                      fontSize: "13px",
                      "& li": {
                        padding: "6px 12px",
                        margin: "1px 0",
                        borderRadius: "4px",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      },
                    },
                  },
                }}
              />
            </FormControl>
          </Box>

          <div className="flex justify-end mt-6">
            <Button
              size="sm"
              variant="outlined"
              sx={{ mr: 2, width: 100 }}
              onClick={handleClose}
              disabled={isPrinting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-button-primary"
              sx={{ width: 100 }}
              onClick={handlePrint}
              loading={isPrinting}
              disabled={selectedCustomer === null || isPrinting}
            >
              Print
            </Button>
          </div>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

export default PrintCustomerPaymentHistoryModal;
