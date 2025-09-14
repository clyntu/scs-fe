import { useState } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box, FormControl, FormLabel, Select, Option } from "@mui/joy";
import axiosInstance, { getCompanyId } from "../../utils/axiosConfig";
import { convertToQueryParams } from "../../helper";
import { generateStocksPDF } from "./generateStocksPDF";
import type { PrintInventoryResponse } from "../../interface";

interface PrintStocksModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  categories: string[];
  brands: string[];
}

const PrintStocksModal = ({
  open,
  setOpen,
  categories,
  brands,
}: PrintStocksModalProps): JSX.Element => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [isPrinting, setIsPrinting] = useState(false);

  const companyId = getCompanyId();

  const handlePrint = (): void => {
    setIsPrinting(true);
    axiosInstance
      .get<PrintInventoryResponse>(
        `/api/inventory/?${convertToQueryParams({
          sort_by: "stock_code",
          sort_order: "asc",
          stock_filter: stockFilter,
          brand: selectedBrand,
          category: selectedCategory,
          status: "active", // Only print active items
        })}`,
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
          width: 500,
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
              <Select
                value={selectedBrand}
                onChange={(event, value) => {
                  if (value !== null) setSelectedBrand(value);
                }}
                placeholder="All Brands"
              >
                <Option value="">All Brands</Option>
                {brands.map((brand) => (
                  <Option key={brand} value={brand}>
                    {brand.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </FormControl>

            <FormControl size="sm">
              <FormLabel>Category</FormLabel>
              <Select
                value={selectedCategory}
                onChange={(event, value) => {
                  if (value !== null) setSelectedCategory(value);
                }}
                placeholder="All Categories"
              >
                <Option value="">All Categories</Option>
                {categories.map((category) => (
                  <Option key={category} value={category}>
                    {category.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </FormControl>

            <FormControl size="sm">
              <FormLabel>Stock Filter</FormLabel>
              <Select
                value={stockFilter}
                onChange={(event, value) => {
                  if (value !== null) setStockFilter(value);
                }}
                placeholder="Select Filter"
              >
                <Option value="all">All</Option>
                <Option value="with_stock">With Stock Only</Option>
                <Option value="without_stock">Without Stock Only</Option>
              </Select>
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
