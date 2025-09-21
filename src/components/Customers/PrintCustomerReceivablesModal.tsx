import React, { useState } from "react";
import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Divider,
  Button,
  FormControl,
  FormLabel,
  Autocomplete,
  Input,
  Option,
  Select,
  Stack,
  Alert,
} from "@mui/joy";
import { createFilterOptions } from "@mui/joy/Autocomplete";
import axiosInstance, { getCompanyId } from "../../utils/axiosConfig";
import { generateCustomerReceivablesPDF } from "./generateCustomerReceivablesPDF";
import type { Customer } from "../../interface";

// Use the interface from AR component for consistency
interface OutstandingTrans {
  id: number;
  source_type: string;
  transaction_number: string;
  transaction_date: string; // ISO date format (YYYY-MM-DD)
  original_amount: string;
  transaction_amount: string;
  reference: string;
  reference_number?: string;
  days_outstanding?: number;
  balance: string;
  aging_bucket?: string;
  payment?: string;
}

interface PrintCustomerReceivablesModalProps {
  open: boolean;
  onClose: () => void;
}

const filter = createFilterOptions<Customer>();

export default function PrintCustomerReceivablesModal({
  open,
  onClose,
}: PrintCustomerReceivablesModalProps): React.JSX.Element {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerInputValue, setCustomerInputValue] = useState("");

  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceType, setSourceType] = useState<string>("all");
  const [agingBucket, setAgingBucket] = useState<string>("all");

  // Loading and error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = getCompanyId();

  // Fetch customers when dropdown is opened
  const fetchCustomers = (): void => {
    if (customers.length > 0) return; // Don't fetch if already loaded

    setLoadingCustomers(true);
    axiosInstance
      .get<{ total: number; items: Customer[] }>(
        `/api/customers/?limit=1000&sort_by=name&sort_order=asc&with_pending_receivables=True`,
      )
      .then((response) => {
        setCustomers(response.data.items);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
        setError("Failed to fetch customers");
      })
      .finally(() => {
        setLoadingCustomers(false);
      });
  };

  const handlePrint = async (): Promise<void> => {
    if (selectedCustomer === null) {
      setError("Please select a customer");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Build query parameters
      const params: Record<string, string> = {};
      if (fromDate !== "") params.from_date = fromDate;
      if (toDate !== "") params.to_date = toDate;
      if (sourceType !== "" && sourceType !== "all")
        params.source_type = sourceType;
      if (agingBucket !== "" && agingBucket !== "all")
        params.aging_bucket = agingBucket;

      // Fetch customer receivables data
      const response = await axiosInstance.get<OutstandingTrans[]>(
        `/api/ar-receipts/customer/${selectedCustomer.customer_id}/outstanding-transactions`,
        { params },
      );

      if (response.data.length === 0) {
        setError(
          "No receivables data found for the selected customer and filters",
        );
        return;
      }

      // Generate PDF
      generateCustomerReceivablesPDF(
        response.data,
        companyId,
        selectedCustomer.name,
        {
          fromDate,
          toDate,
          sourceType,
          agingBucket,
        },
      );

      // Keep modal open as per user preference
    } catch (error) {
      console.error("Error generating receivables report:", error);
      setError("Failed to generate receivables report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = (): void => {
    setSelectedCustomer(null);
    setCustomers([]);
    setCustomerInputValue("");
    setFromDate("");
    setToDate("");
    setSourceType("all");
    setAgingBucket("all");
    setError(null);
  };

  const handleClose = (): void => {
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog size="lg" sx={{ minWidth: 700 }}>
        <ModalClose />
        <Typography level="h4" component="h2">
          Print Customer Receivables
        </Typography>
        <Divider sx={{ my: 2 }} />

        {error !== null && error !== "" && (
          <Alert color="danger" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Customer Selection */}
          <FormControl required>
            <FormLabel>Customer</FormLabel>
            <Autocomplete
              placeholder="Search and select a customer..."
              value={selectedCustomer}
              onChange={(_, newValue) => {
                setSelectedCustomer(newValue);
                setError(null);
              }}
              inputValue={customerInputValue}
              onInputChange={(_, newInputValue) => {
                setCustomerInputValue(newInputValue);
              }}
              onOpen={fetchCustomers}
              getOptionLabel={(option) => option.name}
              options={customers}
              loading={loadingCustomers}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                return filtered;
              }}
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
                          <span style={{ fontWeight: 500, color: "#d32f2f" }}>
                            Outstanding: ₱
                            {option.customer_balance.toLocaleString()}
                          </span>
                        )}
                    </div>
                  </div>
                </li>
              )}
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
                loadingCustomers
                  ? "Loading customers..."
                  : "No customers with receivables found"
              }
            />
          </FormControl>

          {/* Date Range Filters */}
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>From Date</FormLabel>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>To Date</FormLabel>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </FormControl>
          </Stack>

          {/* Source Type and Aging Filters */}
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Source Type</FormLabel>
              <Select
                value={sourceType}
                onChange={(_, newValue) => setSourceType(newValue ?? "all")}
              >
                <Option value="all">All Transaction Types</Option>
                <Option value="customer_dr">Customer DR</Option>
                <Option value="cr">Sales Return</Option>
                <Option value="other">Other Transactions</Option>
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Payment Age Range</FormLabel>
              <Select
                value={agingBucket}
                onChange={(_, newValue) => setAgingBucket(newValue ?? "all")}
              >
                <Option value="all">All Outstanding Balances</Option>
                <Option value="current">0-30 days</Option>
                <Option value="30-60">30-60 days</Option>
                <Option value="60-90">60-90 days</Option>
                <Option value="over-90">Over 90 days</Option>
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          {/* Action Buttons */}
          <div className="flex justify-end mt-6">
            <Button
              size="sm"
              variant="outlined"
              sx={{ mr: 2, width: 100 }}
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-button-primary"
              sx={{ width: 100 }}
              onClick={handlePrint}
              loading={isGenerating}
              disabled={selectedCustomer === null || isGenerating}
            >
              Print
            </Button>
          </div>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
