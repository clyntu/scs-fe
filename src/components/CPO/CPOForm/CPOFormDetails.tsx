import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Card,
  Stack,
  Button,
  Select,
  Option,
  Box,
  Divider,
} from "@mui/joy";
import TooltipAutocomplete from "../../shared/TooltipAutocomplete";
import {
  formatToDateTime,
  addCommaToNumberWithTwoPlaces,
} from "../../../helper";
import type { CPOFormProps } from "../interface";

const INITIAL_SELECTED_ITEMS = [{ id: null }];

const CPOFormDetails = ({
  openEdit,
  selectedRow,
  customers,
  setSelectedItems,

  // Fields
  selectedCustomer,
  setSelectedCustomer,
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
  // Summary Amounts
  netTotal,
  grossTotal,
}: CPOFormProps): JSX.Element => {
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  const handleDiscountChange = (
    type: "customer" | "transaction",
    index: number,
    value: string,
  ): void => {
    const newDiscounts = { ...discounts };
    newDiscounts[type][index] = value;
    setDiscounts(newDiscounts);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Card className="w-[60%] mr-7">
        <div>
          <div className="flex justify-between items-center mb-2">
            {openEdit && (
              <div>
                <h4>CPO No. {selectedRow?.id}</h4>
              </div>
            )}
          </div>
          {openEdit && <Divider />}
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1 }}>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Customer</FormLabel>
              <div className="flex">
                <TooltipAutocomplete
                  options={customers.items}
                  getOptionLabel={(option) => option.name}
                  value={selectedCustomer}
                  onChange={(event, newValue) => {
                    setSelectedCustomer(newValue);
                    // @ts-expect-error (Used null instead of undefined.)
                    setSelectedItems(INITIAL_SELECTED_ITEMS);
                  }}
                  size="sm"
                  className="w-[100%]"
                  placeholder="Select Customer"
                  disabled={isEditDisabled}
                  required
                />
              </div>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Status</FormLabel>
              <Select
                onChange={(event, value) => {
                  if (value !== null) setStatus(value);
                }}
                size="sm"
                value={status}
                disabled={isEditDisabled}
              >
                <Option value="unposted">Unposted</Option>
                <Option value="posted">Posted</Option>
                <Option value="archived">Cancelled</Option>
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
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Ref No.</FormLabel>
              <Input
                size="sm"
                placeholder="Ref No."
                onChange={(e) => setReferenceNumber(e.target.value)}
                value={referenceNumber}
                disabled={isEditDisabled}
              />
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 2 }}>
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Cust Disc. 1 (%)</FormLabel>
              <Input
                value={discounts.customer[0]}
                onChange={(e) =>
                  handleDiscountChange("customer", 0, e.target.value)
                }
                placeholder="Enter discount"
                disabled={isEditDisabled}
              />
            </FormControl>
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Trans Disc. 1 (%)</FormLabel>
              <Input
                value={discounts.transaction[0]}
                onChange={(e) =>
                  handleDiscountChange("transaction", 0, e.target.value)
                }
                placeholder="Enter discount"
                disabled={isEditDisabled}
              />
            </FormControl>
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Cust Disc. 2 (%)</FormLabel>
              <Input
                value={discounts.customer[1]}
                onChange={(e) =>
                  handleDiscountChange("customer", 1, e.target.value)
                }
                placeholder="Enter discount"
                disabled={isEditDisabled}
              />
            </FormControl>
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Trans Disc. 2 (%)</FormLabel>
              <Input
                value={discounts.transaction[1]}
                onChange={(e) =>
                  handleDiscountChange("transaction", 1, e.target.value)
                }
                placeholder="Enter discount"
                disabled={isEditDisabled}
              />
            </FormControl>
          </Stack>
          {/* <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 2 }}>
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Cust Disc. 3 (%)</FormLabel>
              <Input
                value={discounts.customer[2]}
                onChange={(e) =>
                  handleDiscountChange("customer", 2, e.target.value)
                }
                placeholder="Enter discount"
                disabled={isEditDisabled}
              />
            </FormControl>
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Trans Disc. 3 (%)</FormLabel>
              <Input
                value={discounts.transaction[2]}
                onChange={(e) =>
                  handleDiscountChange("transaction", 2, e.target.value)
                }
                placeholder="Enter discount"
                disabled={isEditDisabled}
              />
            </FormControl>
          </Stack> */}
        </div>
      </Card>
      <Card className="w-[40%]">
        <div>
          <div className="flex justify-around">
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>Gross Total</FormLabel>
              <h5>{addCommaToNumberWithTwoPlaces(grossTotal)}</h5>{" "}
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>NET Amount</FormLabel>
              <h5>{addCommaToNumberWithTwoPlaces(netTotal)}</h5>
            </FormControl>
          </div>
          <Divider />
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 3.5 }}>
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
          <FormControl size="sm" sx={{ mb: 3, mt: 3 }}>
            <FormLabel>Remarks</FormLabel>
            <Textarea
              minRows={1}
              placeholder="Remarks"
              onChange={(e) => setRemarks(e.target.value)}
              value={remarks}
              disabled={isEditDisabled}
            />
          </FormControl>
        </div>
      </Card>
    </Box>
  );
};

export default CPOFormDetails;
