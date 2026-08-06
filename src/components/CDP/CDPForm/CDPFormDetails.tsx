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
  Typography,
} from "@mui/joy";
import type { CDPFormDetailsProps, UnplannedAlloc } from "../interface";
import TooltipAutocomplete from "../../shared/TooltipAutocomplete";
import TooltipInput from "../../shared/TooltipInput";
import { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import {
  formatToDateTime,
  addCommaToNumberWithTwoPlaces,
} from "../../../helper";
import SelectAllocModal from "./SelectAllocModal";

const CDPFormDetails = ({
  openEdit,
  selectedRow,
  customers,
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

  return (
    <Box className="transaction-details">
      <SelectAllocModal
        open={isSelectModalOpen}
        setOpen={setIsSelectModalOpen}
        unservedAllocs={unservedAllocs}
        setFormattedAllocs={setFormattedAllocs}
        isLoadingUnserved={isLoadingUnserved}
      />
      <Card variant="soft" color="neutral">
        <div>
          <div className="flex justify-between items-center mb-2">
            {openEdit && (
              <div>
                <Typography level="title-lg">
                  CDP No. {selectedRow?.id}
                </Typography>
              </div>
            )}
          </div>
          {openEdit && <Divider />}

          <Box className="transaction-details__fields" sx={{ mb: 1, mt: 1 }}>
            <FormControl size="sm">
              <FormLabel>Customer</FormLabel>
              <div className="flex">
                <TooltipAutocomplete
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
            <FormControl size="sm">
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
            <FormControl size="sm">
              <FormLabel>Transaction Date</FormLabel>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                disabled={isEditDisabled}
                required
              />
            </FormControl>
            <FormControl size="sm">
              <FormLabel>Ref No.</FormLabel>
              <TooltipInput
                size="sm"
                placeholder="Search"
                onChange={(e) => setReferenceNumber(e.target.value)}
                value={referenceNumber}
                disabled={isEditDisabled}
                required
              />
            </FormControl>
          </Box>
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
      <Card variant="soft" color="neutral">
        <div>
          <div className="flex justify-around">
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>Total Items</FormLabel>
              <h5>{totalItems}</h5>{" "}
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>Total Gross</FormLabel>
              <h5>{`${addCommaToNumberWithTwoPlaces(totalGross)}`}</h5>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1 }}>
              <FormLabel>Total NET</FormLabel>
              <h5>{`${addCommaToNumberWithTwoPlaces(totalNet)}`}</h5>
            </FormControl>
          </div>
          <Divider />
          <Box className="transaction-details__fields" sx={{ mb: 2, mt: 2 }}>
            <FormControl size="sm">
              <FormLabel>Created by</FormLabel>
              <p className="text-sm">
                {selectedRow?.creator?.full_name ?? "-"}
              </p>
            </FormControl>
            <FormControl size="sm">
              <FormLabel>Date Created</FormLabel>
              <p className="text-sm">
                {formatToDateTime(selectedRow?.date_created)}
              </p>
            </FormControl>
            <FormControl size="sm">
              <FormLabel>Modified by</FormLabel>
              <p className="text-sm">
                {selectedRow?.modifier?.full_name ?? "-"}
              </p>
            </FormControl>
            <FormControl size="sm">
              <FormLabel>Date Modified</FormLabel>
              <p className="text-sm">
                {formatToDateTime(selectedRow?.date_modified)}
              </p>
            </FormControl>
          </Box>
        </div>
      </Card>
    </Box>
  );
};

export default CDPFormDetails;
