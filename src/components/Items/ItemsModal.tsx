import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import {
  FormControl,
  FormLabel,
  Input,
  Card,
  Stack,
  Button,
  Box,
  Select,
  Option,
  Divider,
} from "@mui/joy";
import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import ViewWHModal from "../../components/Items/ViewWHModal";
import type {
  Item,
  PaginatedSuppliers,
  ItemsModalProps,
} from "../../interface";
import StockHistory from "./StockHistory";
import { addTwoPlaces, addFourPlaces, getErrorMessage } from "../../helper";

const formatWithCommas = (value: string | number | undefined): string => {
  if (value === "" || value === undefined || value === null) return "";
  const str = String(value);
  const [whole, decimal] = str.split(".");
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
};

const stripCommas = (value: string): string => {
  return value.replace(/,/g, "");
};

const ItemsModal = ({
  open,
  title,
  setOpen,
  row,
  onSave,
  currencies = [],
}: ItemsModalProps): JSX.Element => {
  const [, setSuppliers] = useState<PaginatedSuppliers>({
    total: 0,
    items: [],
  });
  const [openStockHistory, setOpenStockHistory] = useState(false);
  const [openWH, setOpenWH] = useState(false);
  const [stockHistoryRefetchTrigger, setStockHistoryRefetchTrigger] =
    useState(0);

  const handleStockAdjustmentSuccess = (): void => {
    // Trigger refetch of stock history by incrementing the trigger
    setStockHistoryRefetchTrigger((prev) => prev + 1);
  };

  const generateItem = (): Item => {
    // Use the first currency from the list if none is specified
    const defaultCurrency =
      currencies.length > 0 ? currencies[0] : { id: 0, code: "" };

    // Check if this is a new item (no existing row data)
    const isNewItem = row?.id === undefined;

    return {
      id: row?.id ?? 0,
      stock_code: row?.stock_code ?? "",
      name: row?.name ?? "",
      status: row?.status ?? "",
      category: row?.category ?? "",
      brand: row?.brand ?? "",
      // acquisition_cost: required field, empty for new items
      acquisition_cost: isNewItem
        ? ""
        : addTwoPlaces(Number(row?.acquisition_cost) ?? 0),
      // net_cost_before_tax: not required, defaults to 0
      net_cost_before_tax: isNewItem
        ? ""
        : addFourPlaces(Number(row?.net_cost_before_tax) ?? 0),
      currency: row?.currency ?? defaultCurrency,
      currency_id: row?.currency_id ?? defaultCurrency.id,
      rate: row?.rate ?? undefined,
      // srp: required field, empty for new items
      srp: isNewItem ? "" : addTwoPlaces(Number(row?.srp) ?? 0),
      // last_sale_price: not required, defaults to 0
      last_sale_price: isNewItem
        ? ""
        : addTwoPlaces(Number(row?.last_sale_price) ?? 0),
      total_on_stock: row?.total_on_stock ?? 0,
      total_allocated: row?.total_allocated ?? 0,
      total_purchased: row?.total_purchased ?? 0,
      total_sold: row?.total_sold ?? 0,
      created_by: row?.created_by ?? 0,
      modified_by: row?.modified_by ?? 0,
      date_created: row?.date_created ?? "",
      date_modified: row?.date_modified ?? "",
    };
  };

  const [item, setItem] = useState<Item>(generateItem());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setItem(generateItem());
    void fetchSuppliers();
  }, [row]);

  const fetchSuppliers = async (): Promise<void> => {
    try {
      const response =
        await axiosInstance.get<PaginatedSuppliers>("/api/suppliers/");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name } = e.target;
    const value =
      e.target instanceof HTMLSelectElement
        ? e.target.value
        : (e.target as HTMLInputElement).value;
    setItem({ ...item, [name]: value });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    const raw = stripCommas(value);
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      setItem({ ...item, [name]: raw });
    }
  };

  const handleCurrencyChange = (
    event:
      | React.MouseEvent<Element, MouseEvent>
      | React.KeyboardEvent<Element>
      | React.FocusEvent<Element, Element>
      | null,
    value: number | null,
  ): void => {
    if (value !== null) {
      // Find the selected currency to get both ID and code
      const selectedCurrency = currencies.find((curr) => curr.id === value);
      if (selectedCurrency !== undefined) {
        setItem({
          ...item,
          currency_id: selectedCurrency.id,
          currency: selectedCurrency,
        });
      }
    }
  };

  const handleSave = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    setIsSaving(true);
    e.preventDefault();
    try {
      // Create a copy of the item to process before saving
      const itemToSave = { ...item };

      // Ensure net_cost_before_tax and last_sale_price default to 0 if empty
      if (
        itemToSave.net_cost_before_tax === undefined ||
        itemToSave.net_cost_before_tax === 0 ||
        itemToSave.net_cost_before_tax === "" ||
        (typeof itemToSave.net_cost_before_tax === "number" &&
          isNaN(itemToSave.net_cost_before_tax))
      ) {
        itemToSave.net_cost_before_tax = 0;
      }
      if (
        itemToSave.last_sale_price === undefined ||
        itemToSave.last_sale_price === 0 ||
        itemToSave.last_sale_price === "" ||
        (typeof itemToSave.last_sale_price === "number" &&
          isNaN(itemToSave.last_sale_price))
      ) {
        itemToSave.last_sale_price = 0;
      }

      await onSave(itemToSave);
      setItem(generateItem());
      setOpen(false);
      setIsSaving(false);
    } catch (error: any) {
      toast.error(
        `Error message: ${getErrorMessage(error, "Save unsuccessful")}`,
      );
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          setItem(generateItem());
          setOpen(false);
        }}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <form onSubmit={async (e) => await handleSave(e)}>
          <Sheet
            variant="outlined"
            sx={{
              width: 800,
              borderRadius: "md",
              p: 3,
              boxShadow: "lg",
            }}
          >
            <ModalClose variant="plain" sx={{ m: 1 }} />
            <Box>
              <h3 className="mb-6">{title}</h3>
              <Card className="w-[100%] mr-7">
                <div>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                      <FormLabel>Stock Code</FormLabel>
                      <Input
                        name="stock_code"
                        size="sm"
                        placeholder="ABC-123"
                        value={item?.stock_code}
                        onChange={handleChange}
                        required
                      />
                    </FormControl>
                    <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                      <FormLabel>Status</FormLabel>
                      <Select
                        name="status"
                        size="sm"
                        value={item?.status}
                        onChange={(event, value) => {
                          if (value !== null) {
                            setItem({ ...item, status: value });
                          }
                        }}
                        required
                      >
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                      </Select>
                    </FormControl>
                  </Stack>
                  <Stack>
                    <FormControl size="sm" sx={{ mb: 1, width: "98%" }}>
                      <FormLabel>Description</FormLabel>
                      <Input
                        name="name"
                        size="sm"
                        placeholder="Stock Description"
                        value={item?.name}
                        onChange={handleChange}
                        required
                      />
                    </FormControl>
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                      <FormLabel>Category</FormLabel>
                      <Input
                        name="category"
                        size="sm"
                        placeholder="Fans"
                        value={item?.category}
                        onChange={handleChange}
                        required
                      />
                    </FormControl>
                    <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                      <FormLabel>Brand</FormLabel>
                      <Input
                        name="brand"
                        size="sm"
                        placeholder="Hayes"
                        value={item?.brand}
                        onChange={handleChange}
                        required
                      />
                    </FormControl>
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <FormControl size="sm" sx={{ mb: 1, width: "22.9%" }}>
                      <FormLabel>Acquisition Cost</FormLabel>
                      <Input
                        sx={{ input: { textAlign: "right" } }}
                        name="acquisition_cost"
                        size="sm"
                        placeholder="Enter acquisition cost"
                        value={formatWithCommas(item?.acquisition_cost)}
                        onChange={handlePriceChange}
                        required
                      />
                    </FormControl>
                    <FormControl size="sm" sx={{ mb: 1, width: "22.9%" }}>
                      <FormLabel>Net Cost B/F Tax (₱)</FormLabel>
                      <Input
                        sx={{ input: { textAlign: "right" } }}
                        name="net_cost_before_tax"
                        size="sm"
                        placeholder="0 (default)"
                        value={formatWithCommas(item?.net_cost_before_tax)}
                        onChange={handlePriceChange}
                      />
                    </FormControl>
                    <FormControl size="sm" sx={{ mb: 1, width: "22.9%" }}>
                      <FormLabel>SRP (₱)</FormLabel>
                      <Input
                        sx={{ input: { textAlign: "right" } }}
                        name="srp"
                        size="sm"
                        placeholder="Enter SRP"
                        value={formatWithCommas(item?.srp)}
                        onChange={handlePriceChange}
                        required
                      />
                    </FormControl>
                    <FormControl size="sm" sx={{ mb: 1, width: "22.9%" }}>
                      <FormLabel>Last Sale Price (₱)</FormLabel>
                      <Input
                        sx={{ input: { textAlign: "right" } }}
                        name="last_sale_price"
                        size="sm"
                        placeholder="0 (default)"
                        value={formatWithCommas(item?.last_sale_price)}
                        onChange={handlePriceChange}
                      />
                    </FormControl>
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                      <FormLabel>Currency Used</FormLabel>
                      <Select
                        name="currency_id"
                        size="sm"
                        value={item?.currency_id}
                        onChange={handleCurrencyChange}
                        required
                      >
                        {currencies.map((currency) => (
                          <Option key={currency.id} value={currency.id}>
                            {currency.code}
                          </Option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                      <FormLabel>Philippine Peso Rate (₱)</FormLabel>
                      <Input
                        sx={{ input: { textAlign: "right" } }}
                        name="rate"
                        size="sm"
                        placeholder="0"
                        value={formatWithCommas(item?.rate ?? "")}
                        onChange={handlePriceChange}
                        required
                      />
                    </FormControl>
                  </Stack>
                  {title === "Edit Stock" && (
                    <>
                      <Divider sx={{ my: 2 }}>Stock Quantities</Divider>
                      <Stack
                        direction="row"
                        spacing={3}
                        sx={{ flexWrap: "wrap", justifyContent: "center" }}
                      >
                        <Box sx={{ textAlign: "center" }}>
                          <p className="text-xs text-gray-500">On Stock</p>
                          <p className="text-sm font-semibold">
                            {formatWithCommas(
                              item?.total_on_stock + item?.total_allocated,
                            )}
                          </p>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <p className="text-xs text-gray-500">Available</p>
                          <p className="text-sm font-semibold">
                            {formatWithCommas(item?.total_on_stock)}
                          </p>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <p className="text-xs text-gray-500">Allocated</p>
                          <p className="text-sm font-semibold">
                            {formatWithCommas(item?.total_allocated)}
                          </p>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <p className="text-xs text-gray-500">Purchased</p>
                          <p className="text-sm font-semibold">
                            {formatWithCommas(item?.total_purchased)}
                          </p>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <p className="text-xs text-gray-500">Sold</p>
                          <p className="text-sm font-semibold">
                            {formatWithCommas(item?.total_sold)}
                          </p>
                        </Box>
                      </Stack>
                    </>
                  )}
                </div>
              </Card>
              <div className="flex justify-end mt-5">
                {title === "Edit Stock" && (
                  <Button
                    size="sm"
                    variant="soft"
                    className="bg-button-soft-primary"
                    sx={{
                      ml: 2,
                      width: "100px",
                    }}
                    onClick={() => {
                      setOpenWH(true);
                    }}
                  >
                    Locations
                  </Button>
                )}

                {title === "Edit Stock" && (
                  <Button
                    onClick={() => setOpenStockHistory(true)}
                    className="bg-button-soft-primary"
                    size="sm"
                    variant="soft"
                    sx={{
                      ml: 2,
                      width: "130px",
                    }}
                  >
                    Stock History
                  </Button>
                )}

                <Button
                  type="submit"
                  className="bg-button-primary"
                  size="sm"
                  loading={isSaving}
                  sx={{
                    ml: 2,
                    width: "130px",
                  }}
                >
                  Save
                </Button>
              </div>
            </Box>
          </Sheet>
        </form>
      </Modal>
      <StockHistory
        open={openStockHistory}
        setOpen={setOpenStockHistory}
        row={row}
        refetchTrigger={stockHistoryRefetchTrigger}
      />
      <ViewWHModal
        open={openWH}
        setOpen={setOpenWH}
        row={row}
        type="item"
        onStockAdjustmentSuccess={handleStockAdjustmentSuccess}
      />
    </>
  );
};

export default ItemsModal;
