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
import {
  convertToQueryParams,
  addCommaToNumberWithTwoPlaces,
} from "../../helper";
import { generatePricelistPDF } from "./generatePricelistPDF";
import type { PaginatedItems } from "../../interface";

interface PrintTotalCostDetailModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  categories: string[];
  brands: string[];
}

const PrintTotalCostDetailModal = ({
  open,
  setOpen,
  categories,
  brands,
}: PrintTotalCostDetailModalProps): JSX.Element => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [isPrinting, setIsPrinting] = useState(false);

  const companyId = getCompanyId();

  const handlePrint = (): void => {
    setIsPrinting(true);

    const queryParams: Record<string, any> = {
      sort_by: "stock_code",
      sort_order: "asc",
      stock_filter: stockFilter,
      brand: selectedBrand,
      category: selectedCategory,
      status: "active", // Only print active items
    };

    axiosInstance
      .get<PaginatedItems>(`/api/items/?${convertToQueryParams(queryParams)}`)
      .then((response) => {
        const items = response.data.items;
        const data = items.map((item) => {
          return {
            availableQty: item.total_on_stock,
            stockCode: item.stock_code,
            stock: item.name,
            netCostTotal: addCommaToNumberWithTwoPlaces(
              Number(item?.total_on_stock ?? 0) *
                Number(item.net_cost_before_tax),
            ),
          };
        });
        generatePricelistPDF(data, companyId);
        setIsPrinting(false);
        setOpen(false);
        // Reset filters after printing
        setSelectedCategory("");
        setSelectedBrand("");
        setStockFilter("all");
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
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog size="lg" sx={{ minWidth: 700 }}>
        <ModalClose />
        <Typography level="h4" component="h2">
          Print Total Cost Detail Report
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

            <FormControl size="sm">
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
                size="sm"
                sx={{ minHeight: 32 }}
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

export default PrintTotalCostDetailModal;
