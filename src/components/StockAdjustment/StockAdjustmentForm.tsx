import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import Input from "@mui/joy/Input";
import Radio from "@mui/joy/Radio";
import RadioGroup from "@mui/joy/RadioGroup";
import Button from "@mui/joy/Button";
import Alert from "@mui/joy/Alert";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CircularProgress from "@mui/joy/CircularProgress";
import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../utils/axiosConfig";
import TooltipAutocomplete from "../shared/TooltipAutocomplete";
import { createFilterOptions } from "@mui/joy/Autocomplete";
import type {
  StockAdjustmentRequest,
  StockAdjustmentResponse,
  PaginatedItems,
  PaginatedWarehouse,
  PaginatedWarehouseItems,
  Item,
  Warehouse,
  WarehouseItem,
} from "../../interface";
import { addFourPlaces } from "../../helper";

const formatWithCommas = (value: string | number): string => {
  if (value === "" || value === undefined || value === null) return "";
  const str = String(value);
  const [whole, decimal] = str.split(".");
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
};

const stripCommas = (value: string): string => {
  return value.replace(/,/g, "");
};

interface StockAdjustmentFormProps {
  setOpen: (isOpen: boolean) => void;
  openCreate: boolean;
}

const StockAdjustmentForm = ({
  setOpen,
  openCreate,
}: StockAdjustmentFormProps): JSX.Element => {
  // Selection state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null,
  );

  // Form state
  const [adjustmentType, setAdjustmentType] = useState<"surplus" | "deficit">(
    "surplus",
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [netCost, setNetCost] = useState<string>("");

  // Data state
  const [items, setItems] = useState<PaginatedItems>({ total: 0, items: [] });
  const [warehouses, setWarehouses] = useState<PaginatedWarehouse>({
    total: 0,
    items: [],
  });
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(0);

  // Loading states
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI state
  const [touched, setTouched] = useState({
    amount: false,
    netCost: false,
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Filter options for prefix-only matching in autocompletes
  const stockCodeFilterOptions = createFilterOptions({
    matchFrom: "start",
    stringify: (option: Item) => `${option.stock_code} (${option.name})`,
  });

  const stockNameFilterOptions = createFilterOptions({
    matchFrom: "start",
    stringify: (option: Item) => option.name,
  });

  const warehouseFilterOptions = createFilterOptions({
    matchFrom: "start",
    stringify: (option: Warehouse) => option.code,
  });

  // Fetch items for autocomplete
  useEffect(() => {
    const fetchItems = async (): Promise<void> => {
      setIsLoadingItems(true);
      try {
        const response = await axiosInstance.get<PaginatedItems>("/api/items");
        setItems(response.data);
      } catch (err) {
        console.error("Error fetching items:", err);
        setError("Failed to load items");
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, []);

  // Fetch warehouses for autocomplete
  useEffect(() => {
    const fetchWarehouses = async (): Promise<void> => {
      setIsLoadingWarehouses(true);
      try {
        const response =
          await axiosInstance.get<PaginatedWarehouse>("/api/warehouses");
        setWarehouses(response.data);
      } catch (err) {
        console.error("Error fetching warehouses:", err);
        setError("Failed to load warehouses");
      } finally {
        setIsLoadingWarehouses(false);
      }
    };

    fetchWarehouses();
  }, []);

  // Fetch item details and set default net cost when item is selected
  useEffect(() => {
    if (selectedItem) {
      const defaultNetCost = Number(selectedItem.net_cost_before_tax) || 0;
      setNetCost(addFourPlaces(defaultNetCost).toString());
    } else {
      setNetCost("");
    }
  }, [selectedItem]);

  // Fetch warehouse items for the selected item
  const fetchWarehouseItems = async (itemId: number): Promise<void> => {
    try {
      const response = await axiosInstance.get<PaginatedWarehouseItems>(
        `/api/warehouse_items?item_id=${itemId}&limit=1000`,
      );
      setWarehouseItems(response.data.items);
    } catch (err: any) {
      console.error("Error fetching warehouse items:", err);
      setWarehouseItems([]);
    }
  };

  // Fetch warehouse items when item is selected
  useEffect(() => {
    if (selectedItem) {
      fetchWarehouseItems(selectedItem.id);
    } else {
      setWarehouseItems([]);
    }
  }, [selectedItem]);

  // Fetch current stock when both item and warehouse are selected
  useEffect(() => {
    if (selectedItem && selectedWarehouse) {
      const fetchCurrentStock = async (): Promise<void> => {
        setIsLoadingStock(true);
        try {
          const response = await axiosInstance.get<PaginatedWarehouseItems>(
            `/api/warehouse_items?warehouse_id=${selectedWarehouse.id}&item_id=${selectedItem.id}`,
          );
          // Extract the first item from the paginated response
          const warehouseItem = response.data.items[0];
          setCurrentStock(warehouseItem?.on_stock || 0);
        } catch (err: any) {
          // If 404 or no items found, stock doesn't exist yet, default to 0
          console.error("Error fetching current stock:", err);
          setCurrentStock(0);
        } finally {
          setIsLoadingStock(false);
        }
      };

      fetchCurrentStock();
    } else {
      setCurrentStock(0);
    }
  }, [selectedItem, selectedWarehouse]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!selectedItem) {
      setError("Please select an item");
      return;
    }

    if (!selectedWarehouse) {
      setError("Please select a warehouse");
      return;
    }

    const amount = parseInt(adjustmentAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    const rawNetCost = stripCommas(netCost);
    const cost = parseFloat(rawNetCost);
    if (isNaN(cost) || cost <= 0) {
      setError("Net Cost must be a positive number");
      return;
    }

    // Check for max 4 decimal places
    const decimalPart = rawNetCost.split(".")[1];
    if (decimalPart && decimalPart.length > 4) {
      setError("Net Cost can have a maximum of 4 decimal places");
      return;
    }

    if (adjustmentType === "deficit" && amount > currentStock) {
      setError(
        `Insufficient stock. Current stock: ${currentStock}, attempting to remove: ${amount}`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const request: StockAdjustmentRequest = {
        adjustment_type: adjustmentType,
        adjustment_amount: amount,
        net_cost: cost,
      };

      const response = await axiosInstance.post<StockAdjustmentResponse>(
        `/api/warehouse_items/${selectedWarehouse.id}/items/${selectedItem.id}/adjust-stock`,
        request,
      );

      setSuccess(
        `Stock adjusted successfully. New quantity: ${response.data.new_on_stock} units`,
      );

      // Reset form and close after success
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to adjust stock. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = (): void => {
    setSelectedItem(null);
    setSelectedWarehouse(null);
    setAdjustmentAmount("");
    setNetCost("");
    setAdjustmentType("surplus");
    setCurrentStock(0);
    setTouched({ amount: false, netCost: false });
    setError("");
    setSuccess("");
  };

  const predictedStock = (): number => {
    const amount = parseInt(adjustmentAmount, 10);
    if (isNaN(amount)) return currentStock;
    return adjustmentType === "surplus"
      ? currentStock + amount
      : currentStock - amount;
  };

  // Validation helpers with error messages
  const getAmountError = useMemo(() => {
    if (!touched.amount || isSubmitting || success) return null;
    const amount = parseFloat(adjustmentAmount);
    if (!adjustmentAmount) return "Amount is required";
    if (isNaN(amount)) return "Please enter a valid number";
    if (amount <= 0) return "Amount must be greater than 0";
    return null;
  }, [adjustmentAmount, touched.amount, isSubmitting, success]);

  const getNetCostError = useMemo(() => {
    if (!touched.netCost || isSubmitting || success) return null;
    const rawNetCost = stripCommas(netCost);
    const cost = parseFloat(rawNetCost);
    if (!rawNetCost) return "Net Cost is required";
    if (isNaN(cost)) return "Please enter a valid number";
    if (cost <= 0) return "Net Cost must be greater than 0";

    // Check for max 4 decimal places
    const decimalPart = rawNetCost.split(".")[1];
    if (decimalPart && decimalPart.length > 4) {
      return "Net Cost can have a maximum of 4 decimal places";
    }

    return null;
  }, [netCost, touched.netCost, isSubmitting, success]);

  const isFormValid = useMemo(() => {
    const amount = parseFloat(adjustmentAmount);
    const rawNetCost = stripCommas(netCost);
    const cost = parseFloat(rawNetCost);

    // Check for max 4 decimal places
    const decimalPart = rawNetCost.split(".")[1];
    const hasValidDecimals = !decimalPart || decimalPart.length <= 4;

    return (
      selectedItem !== null &&
      selectedWarehouse !== null &&
      !isNaN(amount) &&
      amount > 0 &&
      !isNaN(cost) &&
      cost > 0 &&
      hasValidDecimals
    );
  }, [selectedItem, selectedWarehouse, adjustmentAmount, netCost]);

  // Create filtered warehouse options with stock quantity display
  const warehouseOptions = useMemo(() => {
    // Create a map of warehouse_id to on_stock for quick lookup
    const stockMap = new Map<number, number>();
    warehouseItems.forEach((item) => {
      stockMap.set(item.warehouse_id, item.on_stock);
    });

    // For deficit, filter to only show warehouses with stock > 0
    // For surplus, show all warehouses
    const baseWarehouses =
      adjustmentType === "deficit"
        ? warehouses.items.filter((wh) => (stockMap.get(wh.id) || 0) > 0)
        : warehouses.items;

    // Extend warehouses with stock information for display
    const warehousesWithStock = baseWarehouses.map((wh) => ({
      ...wh,
      _stock: stockMap.get(wh.id) || 0,
    }));

    // Sort warehouses
    return warehousesWithStock.sort((a, b) => {
      if (adjustmentType === "deficit") {
        // For deficit: sort by stock descending (highest stock first)
        return b._stock - a._stock;
      } else {
        // For surplus: two-tier sorting
        // 1st tier: warehouses with stock first, then without stock
        // 2nd tier: alphabetical by warehouse code within each tier
        if (a._stock > 0 !== b._stock > 0) {
          return a._stock > 0 ? -1 : 1; // Warehouses with stock come first
        }
        return a.code.localeCompare(b.code); // Then sort alphabetically
      }
    });
  }, [warehouses.items, warehouseItems, adjustmentType]);

  // Clear selected warehouse if it's no longer in the filtered options
  // This happens when switching from surplus to deficit and the selected warehouse has no stock
  useEffect(() => {
    if (selectedWarehouse && warehouseOptions.length > 0) {
      const isWarehouseInOptions = warehouseOptions.some(
        (wh) => wh.id === selectedWarehouse.id,
      );
      if (!isWarehouseInOptions) {
        setSelectedWarehouse(null);
        setCurrentStock(0);
      }
    }
  }, [warehouseOptions, selectedWarehouse]);

  return (
    <Stack spacing={3}>
      <div>
        <Typography level="h2" component="h1">
          Stock Adjustment
        </Typography>
        <Typography level="body-sm" sx={{ mt: 0.5 }}>
          Adjust stock levels for any item in any warehouse
        </Typography>
      </div>

      <Card variant="outlined" sx={{ maxWidth: 900 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Error and Success Messages */}
              {error && (
                <Alert color="danger" variant="soft" size="sm">
                  <Typography level="body-sm">{error}</Typography>
                </Alert>
              )}

              {success && (
                <Alert color="success" variant="soft" size="sm">
                  <Typography level="body-sm">{success}</Typography>
                </Alert>
              )}

              {/* Item and Warehouse Selection - Side by Side */}
              <Stack direction="row" spacing={2}>
                <FormControl required sx={{ flex: 1 }}>
                  <FormLabel>Stock Code</FormLabel>
                  <TooltipAutocomplete
                    placeholder="Select an Stock Code"
                    options={items.items}
                    getOptionLabel={(item) =>
                      `${item.stock_code} (${item.name})`
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    filterOptions={stockCodeFilterOptions}
                    onChange={(_, value) => {
                      setSelectedItem(value);
                      setError("");
                      setSuccess("");
                    }}
                    value={selectedItem}
                    size="sm"
                    loading={isLoadingItems}
                    autoHighlight={false}
                    slotProps={{
                      listbox: {
                        sx: {
                          width: 350,
                          fontSize: "13px",
                        },
                      },
                    }}
                  />
                  <FormHelperText>
                    Select the stock code to adjust stock for
                  </FormHelperText>
                </FormControl>

                <FormControl required sx={{ flex: 1 }}>
                  <FormLabel>Stock Name</FormLabel>
                  <TooltipAutocomplete
                    placeholder="Select a Stock Name"
                    options={items.items}
                    getOptionLabel={(item) => `${item.name}`}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    filterOptions={stockNameFilterOptions}
                    onChange={(_, value) => {
                      setSelectedItem(value);
                      setError("");
                      setSuccess("");
                    }}
                    value={selectedItem}
                    size="sm"
                    loading={isLoadingItems}
                    autoHighlight={false}
                    slotProps={{
                      listbox: {
                        sx: {
                          width: 350,
                          fontSize: "13px",
                        },
                      },
                    }}
                  />
                  <FormHelperText>
                    Select the stock name to adjust stock for
                  </FormHelperText>
                </FormControl>

                <FormControl required sx={{ flex: 1 }}>
                  <FormLabel>Warehouse</FormLabel>
                  <TooltipAutocomplete
                    placeholder="Select a warehouse"
                    options={warehouseOptions}
                    getOptionLabel={(warehouse) => {
                      const stock = (warehouse as any)._stock;
                      return stock > 0
                        ? `${warehouse.code} (Qty: ${stock})`
                        : warehouse.code;
                    }}
                    filterOptions={warehouseFilterOptions}
                    onChange={(_, value) => {
                      setSelectedWarehouse(value);
                      setError("");
                      setSuccess("");
                    }}
                    value={selectedWarehouse}
                    size="sm"
                    loading={isLoadingWarehouses}
                    autoHighlight={false}
                    slotProps={{
                      listbox: {
                        sx: {
                          width: 300,
                          fontSize: "13px",
                        },
                      },
                    }}
                  />
                  <FormHelperText>
                    {adjustmentType === "deficit"
                      ? "Only warehouses with stock are shown"
                      : "Select the warehouse to adjust stock in"}
                  </FormHelperText>
                </FormControl>
              </Stack>

              {/* Current Stock Display */}
              {selectedItem && selectedWarehouse && (
                <Alert color="neutral" variant="soft" size="sm">
                  <Stack spacing={0.5}>
                    <Typography level="body-sm">
                      <strong>Item:</strong> {selectedItem.name} (
                      {selectedItem.stock_code})
                    </Typography>
                    <Typography level="body-sm">
                      <strong>Warehouse:</strong> {selectedWarehouse.code}
                    </Typography>
                    <Typography level="body-sm">
                      <strong>Current Stock:</strong>{" "}
                      {isLoadingStock ? (
                        <CircularProgress size="sm" />
                      ) : (
                        `${currentStock} units`
                      )}
                    </Typography>
                  </Stack>
                </Alert>
              )}

              {/* Adjustment Type */}
              <FormControl required size="sm">
                <FormLabel>Adjustment Type</FormLabel>
                <RadioGroup
                  value={adjustmentType}
                  onChange={(e) =>
                    setAdjustmentType(e.target.value as "surplus" | "deficit")
                  }
                  size="sm"
                >
                  <Radio
                    value="surplus"
                    label="Surplus (Add Stock)"
                    color="success"
                    size="sm"
                  />
                  <Radio
                    value="deficit"
                    label="Deficit (Subtract Stock)"
                    color="danger"
                    size="sm"
                  />
                </RadioGroup>
              </FormControl>

              {/* Amount and Net Cost - Side by Side */}
              <Stack direction="row" spacing={2}>
                <FormControl
                  required
                  error={!!getAmountError}
                  size="sm"
                  sx={{ flex: 1 }}
                >
                  <FormLabel>Quantity</FormLabel>
                  <Input
                    type="number"
                    size="sm"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, amount: true }))
                    }
                    placeholder="Enter stock adjustment amount"
                    disabled={isSubmitting}
                    slotProps={{
                      input: {
                        min: 1,
                        step: 1,
                      },
                    }}
                  />
                  {getAmountError && (
                    <FormHelperText>{getAmountError}</FormHelperText>
                  )}
                </FormControl>

                <FormControl
                  required
                  error={!!getNetCostError}
                  size="sm"
                  sx={{ flex: 1 }}
                >
                  <FormLabel>Net Cost Before Tax</FormLabel>
                  <Input
                    size="sm"
                    value={formatWithCommas(netCost)}
                    onChange={(e) => {
                      const raw = stripCommas(e.target.value);
                      if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                        setNetCost(raw);
                      }
                    }}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, netCost: true }))
                    }
                    placeholder="Enter net cost before tax"
                    disabled={isSubmitting || !selectedItem}
                  />
                  {getNetCostError ? (
                    <FormHelperText>{getNetCostError}</FormHelperText>
                  ) : (
                    <FormHelperText>
                      Cost per unit before tax (max 4 decimal places)
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>

              {/* Predicted Stock Display */}
              {adjustmentAmount &&
                !isNaN(parseFloat(adjustmentAmount)) &&
                parseFloat(adjustmentAmount) > 0 &&
                selectedItem &&
                selectedWarehouse && (
                  <Typography level="body-sm">
                    New stock level will be:{" "}
                    <strong
                      style={{
                        color:
                          adjustmentType === "surplus"
                            ? "green"
                            : predictedStock() < 0
                              ? "red"
                              : "inherit",
                      }}
                    >
                      {predictedStock()} units
                    </strong>
                  </Typography>
                )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  size="sm"
                  variant="outlined"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outlined"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  {success ? "Go Back" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  className="bg-button-primary"
                  loading={isSubmitting}
                  disabled={isSubmitting || !isFormValid || !!success}
                >
                  {adjustmentType === "surplus"
                    ? "Add Stock"
                    : "Subtract Stock"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default StockAdjustmentForm;
