import { useEffect, useState } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box, FormControl, FormLabel, Autocomplete } from "@mui/joy";
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
    <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        handleClose();
      }}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Sheet
        variant="outlined"
        sx={{
          width: 700,
          borderRadius: "md",
          p: 3,
          boxShadow: "lg",
        }}
      >
        <ModalClose variant="plain" sx={{ m: 1 }} />
        <Box>
          <h3 className="mb-6">Print Stocks</h3>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mb: 2,
            }}
          >
            <FormControl size="sm">
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
              />
            </FormControl>

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
                disabled={selectedLocation !== null}
                size="sm"
              />
            </FormControl>

            <FormControl size="sm">
              <FormLabel>Location</FormLabel>
              <Autocomplete
                placeholder="None"
                options={[{ id: null, name: "None" }, ...warehouses.items]}
                value={
                  selectedLocation !== null
                    ? warehouses.items.find((w) => w.id === selectedLocation) ??
                      null
                    : { id: null, name: "None" }
                }
                onChange={(event, value) => {
                  setSelectedLocation(value?.id ?? null);
                  if (value?.id !== null) {
                    setStockFilter("with_stock");
                  }
                }}
                getOptionLabel={(option) => option.name}
                size="sm"
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
            >
              Print
            </Button>
          </div>
        </Box>
      </Sheet>
    </Modal>
  );
};

export default PrintStocksModal;
