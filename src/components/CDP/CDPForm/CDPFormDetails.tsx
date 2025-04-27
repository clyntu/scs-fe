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
  Autocomplete,
} from "@mui/joy";
import type {
  AllocItemsFE,
  CDPFormDetailsProps,
  UnplannedAlloc,
} from "../interface";
import { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import {
  formatToDateTime,
  addCommaToNumberWithFourPlaces,
} from "../../../helper";
import SelectAllocModal from "./SelectAllocModal";

const CDPFormDetails = ({
  openEdit,
  selectedRow,
  customers,
  formattedAllocs,
  setFormattedAllocs,
  selectedCustomer,
  setSelectedCustomer,
  status,
  setStatus,
  transactionDate,
  setTransactionDate,
  remarks,
  setRemarks,
  referenceNumber,
  setReferenceNumber,
  isEditDisabled,
  totalNet,
  totalGross,
  totalItems,
  amountDiscount,
  setAmountDiscount,
}: CDPFormDetailsProps): JSX.Element => {
  const [isLoadingUnserved, setIsLoadingUnserved] = useState(false);
  const [unservedAllocs, setUnservedAllocs] = useState<UnplannedAlloc[]>([]);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  useEffect(() => {
    if (selectedCustomer !== null && selectedCustomer !== undefined) {
      setIsLoadingUnserved(true);
      axiosInstance
        .get<UnplannedAlloc[]>(
          `/api/allocations/unplanned/${selectedCustomer.customer_id}`,
        )
        .then((response) => {
          setUnservedAllocs(
            response.data
              .filter((alloc) => alloc.status === "posted")
              .sort((a, b) => b.id - a.id),
          );
          setIsLoadingUnserved(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          setIsLoadingUnserved(false);
        });
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (!openEdit) getFixedAmtDiscounts();
  }, [formattedAllocs]);

  const isAmtDiscountAlreadyApplied = (allocItem: AllocItemsFE): boolean => {
    // If the total of allocated + unserved is less than the volume, that means some allocated items are planned already
    // Meaning, the discount has already been applied
    if (
      allocItem.alloc_qty + allocItem.cpo_item_unserved <
      allocItem.cpo_item_volume
    ) {
      return true;
    }
    return false;
  };

  const getFixedAmtDiscounts = (): void => {
    let total = 0;
    for (const allocItem of formattedAllocs) {
      console.log(allocItem);
      if (isAmtDiscountAlreadyApplied(allocItem)) {
        continue;
      }
      if (!allocItem.customer_discount_1.includes("%"))
        total += Number(allocItem.customer_discount_1);

      if (!allocItem.customer_discount_2.includes("%"))
        total += Number(allocItem.customer_discount_2);

      if (!allocItem.customer_discount_3.includes("%"))
        total += Number(allocItem.customer_discount_3);

      if (!allocItem.transaction_discount_1.includes("%"))
        total += Number(allocItem.transaction_discount_1);

      if (!allocItem.transaction_discount_2.includes("%"))
        total += Number(allocItem.transaction_discount_2);

      if (!allocItem.transaction_discount_3.includes("%"))
        total += Number(allocItem.transaction_discount_3);
    }

    setAmountDiscount(total);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <SelectAllocModal
        open={isSelectModalOpen}
        setOpen={setIsSelectModalOpen}
        unservedAllocs={unservedAllocs}
        setFormattedAllocs={setFormattedAllocs}
        isLoadingUnserved={isLoadingUnserved}
      />
      <Card className="w-[60%] mr-7">
        <div>
          <div className="flex justify-between items-center mb-2">
            {openEdit && (
              <div>
                <h4>CDP No. {selectedRow?.id}</h4>
              </div>
            )}
          </div>
          {openEdit && <Divider />}

          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1 }}>
            <FormControl size="sm" sx={{ mb: 1, mt: 1, width: "22%" }}>
              <FormLabel>Customer</FormLabel>
              <div className="flex">
                <Autocomplete
                  options={customers.items}
                  getOptionLabel={(option) => option.name}
                  value={selectedCustomer}
                  onChange={(event, newValue) => {
                    setSelectedCustomer(newValue);
                    setFormattedAllocs([]);
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
                <Option value="posted">Posted</Option>
                <Option value="unposted">Unposted</Option>
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
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            sx={{ mb: 1, alignItems: "flex-end" }}
          >
            <FormControl size="sm" sx={{ mb: 1, width: "46%" }}>
              <FormLabel>Remarks</FormLabel>
              <Textarea
                minRows={1}
                placeholder="Remarks"
                onChange={(e) => setRemarks(e.target.value)}
                value={remarks}
                disabled={isEditDisabled}
              />
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22.5%" }}>
              <FormLabel>Amount Discount</FormLabel>
              <Textarea
                minRows={1}
                placeholder="0"
                value={amountDiscount}
                disabled
              />
            </FormControl>
            {(!openEdit || status === "unposted") && (
              <Button
                sx={{ mb: 1, width: "22.5%" }}
                className="bg-button-primary"
                size="sm"
                onClick={() => setIsSelectModalOpen(true)}
                disabled={selectedCustomer === null}
              >
                Fill Table
              </Button>
            )}
          </Stack>
        </div>
      </Card>
      <Card className="w-[40%]">
        <div>
          <div className="flex justify-around">
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>Total Items</FormLabel>
              <h5>{totalItems}</h5>{" "}
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>Total Gross</FormLabel>
              <h5>{`${addCommaToNumberWithFourPlaces(totalGross)}`}</h5>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>Total NET</FormLabel>
              <h5>{`${addCommaToNumberWithFourPlaces(totalNet)}`}</h5>
            </FormControl>
          </div>
          <Divider />
          <Stack direction="row" spacing={2} sx={{ mb: 2, mt: 2 }}>
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
        </div>
      </Card>
    </Box>
  );
};

export default CDPFormDetails;
