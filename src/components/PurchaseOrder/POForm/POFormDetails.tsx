import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Card,
  Stack,
  Select,
  Option,
  Box,
  Divider,
  Autocomplete,
  Button,
} from "@mui/joy";
import { useEffect, useState } from "react";

import type { POFormProps } from "../interface";
import type { Currency } from "../../../interface";
import axiosInstance from "../../../utils/axiosConfig";
import {
  formatToDateTime,
  addCommaToNumberWithTwoPlaces,
  addCommaToNumberWithFourPlaces,
} from "../../../helper";

const INITIAL_SELECTED_ITEMS = [{ id: null }];

const POFormDetails = ({
  openEdit,
  selectedRow,
  suppliers,
  setSelectedItems,

  // Fields
  selectedSupplier,
  setSelectedSupplier,
  status,
  setStatus,
  transactionDate,
  setTransactionDate,
  discounts,
  setDiscounts,
  remarks,
  setRemarks,
  referenceNumber,
  setReferenceNumber,
  currencyUsed,
  setCurrencyUsed,
  pesoRate,
  setPesoRate,
  // Toggle for showing/hiding totals
  showTotals,
  setShowTotals,
  // Summary Amounts
  fobTotal,
  netAmount,
  landedTotal,
}: POFormProps): JSX.Element => {
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const code = selectedSupplier?.currency;
    if (typeof code === "string" && code.trim() !== "") {
      const placeholder: Currency = { id: -1, code };
      return [placeholder];
    }
    return [];
  });

  const handleDiscountChange = (
    type: "supplier" | "transaction",
    index: number,
    value: string,
  ): void => {
    const newDiscounts = { ...discounts };
    newDiscounts[type][index] = value;
    setDiscounts(newDiscounts);
  };

  useEffect(() => {
    const code = selectedSupplier?.currency;
    if (typeof code === "string" && code.trim() !== "") {
      const placeholder: Currency = { id: -1, code };
      setCurrencies([placeholder]);
      setCurrencyUsed(code); // Update currencyUsed to match supplier's currency
    }
  }, [selectedSupplier]);

  useEffect(() => {
    axiosInstance
      .get<Currency[]>("/api/currencies")
      .then((response) => setCurrencies(response.data))
      .catch((error) => console.error("Error fetching currencies:", error));
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <Card className="w-[60%] mr-7">
        <div>
          <div className="flex justify-between items-center mb-2">
            {openEdit && (
              <div>
                <h4>PO No. {selectedRow?.id}</h4>
              </div>
            )}
          </div>
          {openEdit && <Divider />}

          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1 }}>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Supplier</FormLabel>
              <div className="flex">
                <Autocomplete
                  options={suppliers.items}
                  getOptionLabel={(option) => option.name}
                  value={selectedSupplier}
                  onChange={(event, newValue) => {
                    setSelectedSupplier(newValue);
                    // @ts-expect-error (Item object, unless its using the empty object)
                    setSelectedItems(INITIAL_SELECTED_ITEMS);
                  }}
                  size="sm"
                  className="w-[100%]"
                  placeholder="Select Supplier"
                  disabled={isEditDisabled}
                  required
                />
              </div>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Status</FormLabel>
              <Select
                onChange={(event, value) => {
                  if (value !== null) {
                    setStatus(value);
                    // Automatically show totals when status is changed to posted
                    if (value === "posted" && setShowTotals) {
                      setShowTotals(true);
                    }
                  }
                }}
                size="sm"
                value={status}
                disabled={isEditDisabled}
              >
                <Option value="unposted">Unposted</Option>
                <Option value="posted">Posted</Option>
                <Option value="archived">Archived</Option>
              </Select>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Transaction Date</FormLabel>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                disabled={isEditDisabled}
                required
              />
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Currency Used</FormLabel>
              <Select
                onChange={(event, value) => {
                  if (value !== null) setCurrencyUsed(value);
                }}
                size="sm"
                placeholder="USD"
                value={currencyUsed}
                disabled={isEditDisabled}
              >
                {currencies.map((currency) => (
                  <Option key={currency.id} value={currency.code}>
                    {currency.code}
                  </Option>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack spacing={2} sx={{ mb: 1, mt: 2 }}>
            <Stack direction="row" spacing={2}>
              <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
                <FormLabel>Philippine Peso Rate</FormLabel>
                <Input
                  startDecorator="₱"
                  type="number"
                  size="sm"
                  placeholder="56"
                  value={pesoRate}
                  onChange={(e) => {
                    setPesoRate(e.target.value);
                  }}
                  slotProps={{
                    input: {
                      min: 0,
                      step: ".0001",
                    },
                  }}
                  disabled={isEditDisabled}
                  required
                />
              </FormControl>
              <FormControl size="sm" sx={{ width: "22%" }}>
                <FormLabel>Ref No.</FormLabel>
                <Input
                  size="sm"
                  placeholder="Search"
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  value={referenceNumber}
                  disabled={isEditDisabled}
                  required
                />
              </FormControl>
              <FormControl size="sm" sx={{ width: "22%" }}>
                <FormLabel>Supp Disc. 1</FormLabel>
                <Input
                  value={discounts.supplier[0]}
                  onChange={(e) =>
                    handleDiscountChange("supplier", 0, e.target.value)
                  }
                  placeholder="% or Fixed Amt"
                  disabled={isEditDisabled}
                />
              </FormControl>
              <FormControl size="sm" sx={{ width: "22%" }}>
                <FormLabel>Trans Disc. 1</FormLabel>
                <Input
                  value={discounts.transaction[0]}
                  onChange={(e) =>
                    handleDiscountChange("transaction", 0, e.target.value)
                  }
                  placeholder="% or Fixed Amt"
                  disabled={isEditDisabled}
                />
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl size="sm" sx={{ width: "22%" }}>
                <FormLabel>Supp Disc. 2</FormLabel>
                <Input
                  value={discounts.supplier[1]}
                  onChange={(e) =>
                    handleDiscountChange("supplier", 1, e.target.value)
                  }
                  placeholder="% or Fixed Amt"
                  disabled={isEditDisabled}
                />
              </FormControl>
              <FormControl size="sm" sx={{ width: "22%" }}>
                <FormLabel>Trans Disc. 2</FormLabel>
                <Input
                  value={discounts.transaction[1]}
                  onChange={(e) =>
                    handleDiscountChange("transaction", 1, e.target.value)
                  }
                  placeholder="% or Fixed Amt"
                  disabled={isEditDisabled}
                />
              </FormControl>
              <FormControl size="sm" sx={{ width: "22%" }}>
                <FormLabel>Supp Disc. 3</FormLabel>
                <Input
                  value={discounts.supplier[2]}
                  onChange={(e) =>
                    handleDiscountChange("supplier", 2, e.target.value)
                  }
                  placeholder="% or Fixed Amt"
                  disabled={isEditDisabled}
                />
              </FormControl>
              <FormControl size="sm" sx={{ width: "22%" }}>
                <FormLabel>Trans Disc. 3</FormLabel>
                <Input
                  value={discounts.transaction[2]}
                  onChange={(e) =>
                    handleDiscountChange("transaction", 2, e.target.value)
                  }
                  placeholder="% or Fixed Amt"
                  disabled={isEditDisabled}
                />
              </FormControl>
            </Stack>
          </Stack>
        </div>
      </Card>
      <Card className="w-[40%]">
        <div>
          <div className="flex justify-between mb-2">
            <h4>Order Summary</h4>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setShowTotals && setShowTotals((prev) => !prev)}
            >
              {showTotals ? "Hide Totals" : "Show Totals"}
            </Button>
          </div>
          {showTotals === true && (
            <>
              <div className="flex justify-around">
                <FormControl size="sm" sx={{ mb: 1 }}>
                  <FormLabel>FOB Total</FormLabel>
                  <h5>{`${currencyUsed} ${addCommaToNumberWithTwoPlaces(fobTotal)}`}</h5>
                </FormControl>
                <FormControl size="sm" sx={{ mb: 1 }}>
                  <FormLabel>NET Amount</FormLabel>
                  <h5>{`${currencyUsed} ${addCommaToNumberWithTwoPlaces(netAmount)}`}</h5>
                </FormControl>
                <FormControl size="sm" sx={{ mb: 1 }}>
                  <FormLabel>LANDED Total</FormLabel>
                  <h5>{`${currencyUsed} ${addCommaToNumberWithTwoPlaces(landedTotal / Number(pesoRate))}`}</h5>
                </FormControl>
              </div>
              <div className="flex justify-around">
                <FormControl size="sm" sx={{ mb: 1 }}>
                  <FormLabel>FOB Total</FormLabel>
                  <h5>
                    ₱
                    {addCommaToNumberWithTwoPlaces(fobTotal * Number(pesoRate))}
                  </h5>
                </FormControl>
                <FormControl size="sm" sx={{ mb: 1 }}>
                  <FormLabel>NET Amount</FormLabel>
                  <h5>
                    ₱
                    {addCommaToNumberWithTwoPlaces(
                      netAmount * Number(pesoRate),
                    )}
                  </h5>
                </FormControl>
                <FormControl size="sm" sx={{ mb: 1 }}>
                  <FormLabel>LANDED Total</FormLabel>
                  <h5>₱{addCommaToNumberWithFourPlaces(landedTotal)}</h5>
                </FormControl>
              </div>
            </>
          )}
          <Divider />
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1 }}>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Created by</FormLabel>
              <p className="text-sm">
                {selectedRow?.creator?.full_name ?? "-"}
              </p>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Date Created</FormLabel>
              <p className="text-sm">
                {formatToDateTime(selectedRow?.date_created)}
              </p>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Modified by</FormLabel>
              <p className="text-sm">
                {selectedRow?.modifier?.full_name ?? "-"}
              </p>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Date Modified</FormLabel>
              <p className="text-sm">
                {formatToDateTime(selectedRow?.date_modified)}
              </p>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 2 }}>
            <FormControl size="sm" sx={{ mb: 3, width: "100%" }}>
              <FormLabel>Remarks</FormLabel>
              <Textarea
                minRows={1}
                placeholder="Remarks"
                onChange={(e) => setRemarks(e.target.value)}
                value={remarks}
                disabled={isEditDisabled}
              />
            </FormControl>
          </Stack>
        </div>
      </Card>
    </Box>
  );
};

export default POFormDetails;
