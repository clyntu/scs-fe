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
import type { SDRFormDetailsProps } from "../interface";
import { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import type { PaginatedPO, PurchaseOrder } from "../../../interface";
import SelectPOModal from "./SelectPOModal";
import TooltipAutocomplete from "../../shared/TooltipAutocomplete";
import {
  formatToDateTime,
  addCommaToNumberWithTwoPlaces,
  addCommaToNumberWithFourPlaces,
} from "../../../helper";

const SDRFormDetails = ({
  openEdit,
  selectedRow,
  suppliers,
  selectedPOs,
  setSelectedPOs,

  // Fields
  selectedSupplier,
  setSelectedSupplier,
  status,
  setStatus,
  transactionDate,
  setTransactionDate,
  remarks,
  setRemarks,
  referenceNumber,
  setReferenceNumber,
  pesoRate,
  currencyUsed,
  isEditDisabled,

  // Summary Amounts
  fobTotal,
  netAmount,
  landedTotal,
  amountDiscount,
  setAmountDiscount,
}: SDRFormDetailsProps): JSX.Element => {
  const [unservedPOs, setUnservedPOs] = useState<PurchaseOrder[]>([]);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  const isAmtDiscountAlreadyApplied = (PO: PurchaseOrder): boolean => {
    for (const POItem of PO.items) {
      // If on stock increased, meaning this PO has already been handled before
      if (POItem.on_stock > 0 || POItem.allocated > 0 || POItem.in_transit > 0)
        return true;
    }
    return false;
  };

  const getFixedAmtDiscounts = (): void => {
    let total = 0;

    for (const PO of selectedPOs) {
      // Check if this is not the first SDR with this PO
      // to apply the amount discount
      if (isAmtDiscountAlreadyApplied(PO)) {
        continue;
      }

      if (!PO.supplier_discount_1.includes("%"))
        total += Number(PO.supplier_discount_1);

      if (!PO.supplier_discount_2.includes("%"))
        total += Number(PO.supplier_discount_2);

      if (!PO.supplier_discount_3.includes("%"))
        total += Number(PO.supplier_discount_3);

      if (!PO.transaction_discount_1.includes("%"))
        total += Number(PO.transaction_discount_1);

      if (!PO.transaction_discount_2.includes("%"))
        total += Number(PO.transaction_discount_2);

      if (!PO.transaction_discount_3.includes("%"))
        total += Number(PO.transaction_discount_3);
    }

    setAmountDiscount(total);
  };

  useEffect(() => {
    if (selectedSupplier !== null && selectedSupplier !== undefined) {
      axiosInstance
        .get<PaginatedPO>(
          `/api/purchase_orders/supplier/${selectedSupplier.supplier_id}`,
        )
        .then((response) =>
          setUnservedPOs(
            response.data.items
              .filter((PO) => PO.status === "posted")
              .filter((PO) => PO.status === "posted")
              .sort((a, b) => b.id - a.id),
          ),
        )
        .catch((error) => console.error("Error:", error));
    }
  }, [selectedSupplier]);

  useEffect(() => {
    getFixedAmtDiscounts();
  }, [selectedPOs]);

  return (
    <Box sx={{ display: "flex" }}>
      <SelectPOModal
        open={isSelectModalOpen}
        setOpen={setIsSelectModalOpen}
        unservedPOs={unservedPOs}
        setSelectedPOs={setSelectedPOs}
      />
      <Card className="w-[60%] mr-7">
        <div>
          <div className="flex justify-between items-center mb-2">
            {openEdit && (
              <div>
                <h4>SDR No. {selectedRow?.id}</h4>
              </div>
            )}
          </div>
          {openEdit && <Divider />}

          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1 }}>
            <FormControl size="sm" sx={{ mb: 1, mt: 1, width: "22%" }}>
              <FormLabel>Supplier</FormLabel>
              <div className="flex">
                <TooltipAutocomplete
                  options={suppliers.items}
                  getOptionLabel={(option) => option.name}
                  value={selectedSupplier}
                  onChange={(event, newValue) => {
                    setSelectedSupplier(newValue);
                    setSelectedPOs([]);
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
                  if (value !== null) setStatus(value);
                }}
                size="sm"
                value={status}
                disabled={isEditDisabled}
              >
                <Option value="posted">Posted</Option>
                <Option value="unposted">Unposted</Option>
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
            <FormControl size="sm" sx={{ width: "22%" }}>
              <FormLabel>Amount Disc. Total</FormLabel>
              <Textarea value={amountDiscount} disabled />
            </FormControl>
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            sx={{ mb: 1, alignItems: "flex-end" }}
          >
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
            {(!openEdit || status === "unposted") && (
              <Button
                sx={{ mb: 1, width: "22.5%" }}
                className="bg-button-primary"
                size="sm"
                onClick={() => setIsSelectModalOpen(true)}
                disabled={selectedSupplier === null}
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
              <FormLabel>FOB Total</FormLabel>
              <h5>{`${currencyUsed} ${addCommaToNumberWithTwoPlaces(fobTotal)}`}</h5>{" "}
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>NET Amount</FormLabel>
              <h5>{`${currencyUsed} ${addCommaToNumberWithTwoPlaces(netAmount)}`}</h5>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>LANDED Total</FormLabel>
              <h5>{`${currencyUsed} ${addCommaToNumberWithTwoPlaces(landedTotal / pesoRate || 0)}`}</h5>
            </FormControl>
          </div>
          <div className="flex justify-around">
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>FOB Total</FormLabel>
              <h5>
                ₱{addCommaToNumberWithTwoPlaces(fobTotal * pesoRate)}
              </h5>{" "}
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>NET Amount</FormLabel>
              <h5>₱{addCommaToNumberWithTwoPlaces(netAmount * pesoRate)}</h5>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>LANDED Total</FormLabel>
              <h5>₱{addCommaToNumberWithFourPlaces(landedTotal)}</h5>
            </FormControl>
          </div>
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
        </div>
      </Card>
    </Box>
  );
};

export default SDRFormDetails;
