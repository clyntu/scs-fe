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
import { useRouter } from "next/router";
import axiosInstance from "../../utils/axiosConfig";
import TooltipAutocomplete from "../../components/shared/TooltipAutocomplete";
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
import type { User } from "../Login";
import { addFourPlaces } from "../../helper";

const StockAdjustmentPage = (): JSX.Element => {
  const router = useRouter();
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
  const [currentStock, setCurrentStock] = useState<number>(0);

  // Loading states
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // UI state
  const [touched, setTouched] = useState({
    amount: false,
    netCost: false,
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isAdmin = currentUser?.is_admin === true;

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async (): Promise<void> => {
      try {
        const response = await axiosInstance.get<User>("/api/users/me/");
        setCurrentUser(response.data);

        if (!response.data.is_admin) {
          // Redirect non-admin users to home page
          await router.push("/configuration/item");
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        await router.push("/");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  // Fetch items for autocomplete
  useEffect(() => {
    const fetchItems = async (): Promise<void> => {
      setIsLoadingItems(true);
      try {
        const response = await axiosInstance.get<PaginatedItems>(
          "/api/items",
        );
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
        const response = await axiosInstance.get<PaginatedWarehouse>(
          "/api/warehouses",
        );
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

    const cost = parseFloat(netCost);
    if (isNaN(cost) || cost <= 0) {
      setError("Net Cost must be a positive number");
      return;
    }

    // Check for max 4 decimal places
    const decimalPart = netCost.split(".")[1];
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

      // Reset form after success
      setTimeout(() => {
        setAdjustmentAmount("");
        setAdjustmentType("surplus");
        setTouched({ amount: false, netCost: false });
        setSuccess("");
        // Refresh current stock
        setCurrentStock(response.data.new_on_stock);
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
    const cost = parseFloat(netCost);
    if (!netCost) return "Net Cost is required";
    if (isNaN(cost)) return "Please enter a valid number";
    if (cost <= 0) return "Net Cost must be greater than 0";

    // Check for max 4 decimal places
    const decimalPart = netCost.split(".")[1];
    if (decimalPart && decimalPart.length > 4) {
      return "Net Cost can have a maximum of 4 decimal places";
    }

    return null;
  }, [netCost, touched.netCost, isSubmitting, success]);

  const isFormValid = useMemo(() => {
    const amount = parseFloat(adjustmentAmount);
    const cost = parseFloat(netCost);

    // Check for max 4 decimal places
    const decimalPart = netCost.split(".")[1];
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

  // Show loading while checking authorization
  if (isCheckingAuth) {
    return (
      <div className="p-6">
        <Stack
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ py: 10 }}
        >
          <CircularProgress />
          <Typography level="body-sm">Checking access...</Typography>
        </Stack>
      </div>
    );
  }

  // Don't render if not admin (will be redirected)
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert color="danger" variant="soft">
          <Typography level="body-sm">
            Access Denied: This page is only accessible to administrators.
          </Typography>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Stack spacing={3}>
        <div>
          <Typography level="h3" component="h1">
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
                        `${item.stock_code}`
                      }
                      onChange={(_, value) => {
                        setSelectedItem(value);
                        setError("");
                        setSuccess("");
                      }}
                      value={selectedItem}
                      size="sm"
                      loading={isLoadingItems}
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
                      getOptionLabel={(item) =>
                        `${item.name}`
                      }
                      onChange={(_, value) => {
                        setSelectedItem(value);
                        setError("");
                        setSuccess("");
                      }}
                      value={selectedItem}
                      size="sm"
                      loading={isLoadingItems}
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
                      options={warehouses.items}
                      getOptionLabel={(warehouse) => warehouse.name}
                      onChange={(_, value) => {
                        setSelectedWarehouse(value);
                        setError("");
                        setSuccess("");
                      }}
                      value={selectedWarehouse}
                      size="sm"
                      loading={isLoadingWarehouses}
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
                      Select the warehouse to adjust stock in
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
                        <strong>Warehouse:</strong> {selectedWarehouse.name}
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
                      setAdjustmentType(
                        e.target.value as "surplus" | "deficit",
                      )
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
                    <FormLabel>Amount</FormLabel>
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
                      type="number"
                      size="sm"
                      value={netCost}
                      onChange={(e) => setNetCost(e.target.value)}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, netCost: true }))
                      }
                      placeholder="Enter net cost before tax"
                      disabled={isSubmitting || !selectedItem}
                      slotProps={{
                        input: {
                          min: 0.0001,
                          step: 0.0001,
                        },
                      }}
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
                    color="neutral"
                    onClick={handleReset}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    color={adjustmentType === "surplus" ? "success" : "danger"}
                    loading={isSubmitting}
                    disabled={isSubmitting || !isFormValid}
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
    </div>
  );
};

export default StockAdjustmentPage;
