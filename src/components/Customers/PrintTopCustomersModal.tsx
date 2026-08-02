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
  Input,
  Stack,
  Alert,
  Box,
} from "@mui/joy";
import axiosInstance, { getCompanyId } from "../../utils/axiosConfig";
import { generateTopCustomersPDF } from "./generateTopCustomersPDF";

// Interface for customer sales analytics
interface CustomerSalesAnalytics {
  customer_id: number;
  customer_name: string;
  dr_count: number;
  dr_total: number;
  cr_count: number;
  cr_total: number;
  net_sales: number;
}

interface PaginatedResponse {
  total: number;
  items: CustomerSalesAnalytics[];
  next_page?: string;
  previous_page?: string;
}

interface PrintTopCustomersModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PrintTopCustomersModal({
  open,
  onClose,
}: PrintTopCustomersModalProps): React.JSX.Element {
  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState<string>("50");

  // Loading and error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = getCompanyId();

  const handlePrint = async (): Promise<void> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build query parameters
      const params: Record<string, string> = {
        page: "1",
        limit: limit !== "" ? limit : "50",
      };

      if (fromDate !== "") params.from_date = fromDate;
      if (toDate !== "") params.to_date = toDate;

      // Fetch top customers data
      const response = await axiosInstance.get<PaginatedResponse>(
        `/customer-financial/top-customers-by-sales`,
        { params },
      );

      if (response.data.items.length === 0) {
        setError("No customer sales data found for the selected filters");
        return;
      }

      // Generate PDF
      generateTopCustomersPDF(response.data.items, companyId, {
        fromDate,
        toDate,
        limit: parseInt(limit !== "" ? limit : "50"),
        total: response.data.total,
      });

      // Keep modal open as per user preference
    } catch (error) {
      console.error("Error generating top customers report:", error);
      setError("Failed to generate top customers report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = (): void => {
    setFromDate("");
    setToDate("");
    setLimit("50");
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
          Print Top Customers by Sales
        </Typography>
        <Divider sx={{ my: 1 }} />

        {error !== null && error !== "" && (
          <Alert color="danger" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ p: 1 }}>
          <Stack spacing={3}>
            {/* Date Range Filters */}
            <Stack direction="row" spacing={2}>
              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>From Date</FormLabel>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  size="sm"
                  sx={{ minHeight: 32 }}
                />
              </FormControl>
              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>To Date</FormLabel>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  size="sm"
                  sx={{ minHeight: 32 }}
                />
              </FormControl>
            </Stack>

            {/* Number of Top Customers */}
            <FormControl size="sm">
              <FormLabel>Number of Top Customers to Show</FormLabel>
              <Input
                type="number"
                placeholder="50"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                size="sm"
                sx={{ minHeight: 32, maxWidth: 200 }}
                slotProps={{
                  input: {
                    min: 1,
                    max: 500,
                  },
                }}
              />
            </FormControl>

            <Divider />

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                size="sm"
                variant="outlined"
                sx={{ width: 100 }}
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
                disabled={isGenerating}
              >
                Print
              </Button>
            </Box>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
