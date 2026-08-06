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
  Autocomplete,
  Typography,
} from "@mui/joy";
import type { DeallocFormDetailsProps } from "../interface";
import { formatToDateTime } from "../../../helper";
import TooltipAutocomplete from "../../shared/TooltipAutocomplete";

const DeallocFormDetails = ({
  openEdit,
  selectedRow,
  // Fields
  status,
  setStatus,
  transactionDate,
  setTransactionDate,
  remarks,
  setRemarks,

  allocs,
  selectedAlloc,
  setSelectedAlloc,

  customers,
  selectedCustomer,
  setSelectedCustomer,

  getAllocsByCustomer,
  getAllocItemsByAlloc,
  setAllocItems,
}: DeallocFormDetailsProps): JSX.Element => {
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  return (
    <Box className="transaction-details">
      <Card variant="soft" color="neutral">
        <div>
          <div className="flex justify-between items-center mb-2">
            {openEdit && (
              <div>
                <Typography level="title-lg">
                  Dealloc No. {selectedRow?.id}
                </Typography>
              </div>
            )}
          </div>

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
                    setSelectedAlloc(null);
                    setAllocItems([]);
                    if (newValue !== null) {
                      getAllocsByCustomer(newValue.customer_id);
                    }
                  }}
                  size="sm"
                  className="w-[100%]"
                  placeholder="Select Customer"
                  disabled={isEditDisabled}
                  required
                />
              </div>
              <FormLabel sx={{ mt: 1 }}>Allocation No.</FormLabel>
              <div className="flex">
                <Autocomplete
                  options={allocs.items}
                  getOptionLabel={(option) => String(option.id)}
                  value={selectedAlloc}
                  onChange={(event, newValue) => {
                    // Set selected alloc
                    setSelectedAlloc(newValue);

                    // Show alloc items
                    if (newValue !== null) {
                      getAllocItemsByAlloc(newValue);
                    } else {
                      setAllocItems([]);
                    }
                  }}
                  size="sm"
                  className="w-[100%]"
                  placeholder="Select Alloc No."
                  disabled={isEditDisabled || selectedCustomer === null}
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
                {/* Display only - an archived record must never be created as one */}
                {status === "archived" && (
                  <Option value="archived">Archived</Option>
                )}
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
      <Card variant="soft" color="neutral">
        <div>
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1.7 }}>
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

export default DeallocFormDetails;
