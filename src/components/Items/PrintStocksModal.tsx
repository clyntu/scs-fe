import { useState } from "react";
import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Divider,
  Button,
  Box,
  FormControl,
  FormLabel,
  Autocomplete,
  Stack,
} from "@mui/joy";
import axiosInstance, { getCompanyId } from "../../utils/axiosConfig";
import { convertToQueryParams } from "../../helper";
import { generateStocksPDF } from "./generateStocksPDF";
import type {
  PaginatedWarehouse,
  PrintInventoryResponse,
} from "../../interface";

interface PrintStocksModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  categories: string[];
  brands: string[];
  warehouses: PaginatedWarehouse;
}

const PrintStocksModal = ({
  open,
  setOpen,
  categories,
  brands,
  warehouses,
}: PrintStocksModalProps): JSX.Element => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const companyId = getCompanyId();

  const handlePrint = (): void => {
    setIsPrinting(true);

    const queryParams: Record<string, any> = {
      sort_by: "stock_code",
      sort_order: "asc",
      stock_filter: selectedLocation !== null ? "with_stock" : stockFilter,
      brand: selectedBrand,
      category: selectedCategory,
      status: "active", // Only print active items
    };

    if (selectedLocation !== null) {
      queryParams.warehouse_id = selectedLocation;
    }

    axiosInstance
      .get<PrintInventoryResponse>(
        `/api/inventory/?${convertToQueryParams(queryParams)}`,
      )
      .then((response) => {
        const items = response.data.items;
        generateStocksPDF(items, companyId);
        setIsPrinting(false);
        setOpen(false);
        // Reset filters after printing
        setSelectedCategory("");
        setSelectedBrand("");
        setStockFilter("all");
        setSelectedLocation(null);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsPrinting(false);
      });
  };

  const handleClose = (): void => {
    setOpen(false);
    // Reset filters when closing
    setSelectedCategory("");
    setSelectedBrand("");
    setStockFilter("all");
    setSelectedLocation(null);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog size="lg" sx={{ minWidth: 700 }}>
        <ModalClose />
        <Typography level="h4" component="h2">
          Print Stocks Report
        </Typography>
        <Divider sx={{ my: 1 }} />

        <Box sx={{ p: 1 }}>
          <Stack spacing={3}>
            {/* Filter Options */}
            <Stack direction="row" spacing={2}>
              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>Brand</FormLabel>
                <Autocomplete
                  placeholder="All Brands"
                  options={["", ...brands]}
                  value={selectedBrand}
                  onChange={(event, value) => {
                    setSelectedBrand(value ?? "");
                  }}
                  getOptionLabel={(option) => {
                    if (option === "") return "All Brands";
                    return option.toUpperCase();
                  }}
                  size="sm"
                  sx={{ minHeight: 32 }}
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

              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>Category</FormLabel>
                <Autocomplete
                  placeholder="All Categories"
                  options={["", ...categories]}
                  value={selectedCategory}
                  onChange={(event, value) => {
                    setSelectedCategory(value ?? "");
                  }}
                  getOptionLabel={(option) => {
                    if (option === "") return "All Categories";
                    return option.toUpperCase();
                  }}
                  size="sm"
                  sx={{ minHeight: 32 }}
                />
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>Stock Filter</FormLabel>
                <Autocomplete
                  placeholder="Select Filter"
                  options={[
                    { value: "all", label: "All" },
                    { value: "with_stock", label: "With Stock Only" },
                    { value: "without_stock", label: "Without Stock Only" },
                  ]}
                  value={
                    stockFilter !== ""
                      ? {
                          value: stockFilter,
                          label:
                            stockFilter === "all"
                              ? "All"
                              : stockFilter === "with_stock"
                                ? "With Stock Only"
                                : "Without Stock Only",
                        }
                      : null
                  }
                  onChange={(event, value) => {
                    setStockFilter(value?.value ?? "all");
                  }}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  disabled={selectedLocation !== null}
                  size="sm"
                  sx={{ minHeight: 32 }}
                />
              </FormControl>

              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>Location</FormLabel>
                <Autocomplete
                  placeholder="None"
                  options={[{ id: null, name: "None" }, ...warehouses.items]}
                  value={
                    selectedLocation !== null
                      ? warehouses.items.find(
                          (w) => w.id === selectedLocation,
                        ) ?? null
                      : { id: null, name: "None" }
                  }
                  onChange={(event, value) => {
                    setSelectedLocation(value?.id ?? null);
                    if (value?.id !== null) {
                      setStockFilter("with_stock");
                    }
                  }}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  size="sm"
                  sx={{ minHeight: 32 }}
                />
              </FormControl>
            </Stack>

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
              >
                Print
              </Button>
            </Box>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

export default PrintStocksModal;
