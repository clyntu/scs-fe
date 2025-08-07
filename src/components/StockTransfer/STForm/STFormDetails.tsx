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
} from "@mui/joy";
import RecordNavigation from "../../RecordNavigation";
import type { STFormDetailsProps } from "../interface";
import { formatToDateTime } from "../../../helper";
import { type Warehouse, type StockTransfer } from "../../../interface";

const STFormDetails = ({
  openEdit,
  selectedRow,
  setSelectedRow,
  viewFilters,

  // Fields
  status,
  setStatus,
  transactionDate,
  setTransactionDate,
  remarks,
  setRemarks,
  rrTransfer,
  setRRTransfer,
  warehouses,
  selectedWarehouse,
  setSelectedWarehouse,
  receivingReports,
  selectedRR,
  setSelectedRR,
  suppliers,
  selectedSupplier,
  setSelectedSupplier,
  fetchWarehouseItems,
  setWarehouseItems,
}: STFormDetailsProps): JSX.Element => {
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  const handleRRTransferChange = (value: string | null): void => {
    if (value !== null) {
      if (value === "no") {
        setSelectedRR(null);
        setSelectedSupplier(null);
        fetchWarehouseItems(selectedWarehouse?.id ?? 1, null);
      } else {
        setWarehouseItems([]);
        const receivingArea: Warehouse | undefined = warehouses.items.find(
          (warehouse) => warehouse.id === 1,
        );
        if (receivingArea !== undefined) {
          setSelectedWarehouse(receivingArea);
        }
      }
      setRRTransfer(value);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Card className="w-[60%] mr-7">
        <div>
          <div className="flex justify-between items-center mb-2">
            {openEdit &&
            selectedRow !== null &&
            selectedRow !== undefined &&
            typeof selectedRow.id === "number" &&
            setSelectedRow !== null &&
            setSelectedRow !== undefined ? (
              <RecordNavigation<StockTransfer>
                currentRecord={selectedRow}
                onRecordChange={setSelectedRow}
                apiEndpoint="/api/stock-transfers"
                recordIdField="id"
                recordDisplayField="id"
                recordDisplayPrefix="STR No."
                sortBy="id"
                sortOrder="desc"
                viewFilters={viewFilters}
              />
            ) : openEdit &&
              selectedRow !== null &&
              selectedRow !== undefined &&
              typeof selectedRow.id === "number" ? (
              <div>
                <h4>STR No. {selectedRow.id}</h4>
              </div>
            ) : null}
          </div>
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1 }}>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>RR Transfer</FormLabel>
              <Select
                onChange={(_, value) => handleRRTransferChange(value)}
                size="sm"
                value={rrTransfer}
                disabled={isEditDisabled}
              >
                <Option value="yes">Yes</Option>
                <Option value="no">No</Option>
              </Select>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "22%" }}>
              <FormLabel>Supplier</FormLabel>
              <div className="flex">
                <Autocomplete
                  options={suppliers.items}
                  getOptionLabel={(option) => option.name}
                  value={selectedSupplier}
                  onChange={(event, newValue) => {
                    setSelectedSupplier(newValue);
                    setWarehouseItems([]);
                    setSelectedRR(null);
                  }}
                  size="sm"
                  className="w-[100%]"
                  placeholder="Select Supplier"
                  disabled={isEditDisabled || rrTransfer === "no"}
                  required
                />
              </div>
            </FormControl>
            <FormControl size="sm" sx={{ mb: 1, width: "46.5%" }}>
              <FormLabel>RR Ref No.</FormLabel>
              <Autocomplete
                options={receivingReports.items}
                getOptionLabel={(option) => option.reference_number}
                value={selectedRR}
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    setSelectedRR(newValue);
                    console.log("Called");
                    fetchWarehouseItems(1, newValue);
                  }
                }}
                size="sm"
                className="w-[100%]"
                placeholder="Select Receiving Report"
                disabled={
                  rrTransfer === "no" ||
                  selectedSupplier === null ||
                  selectedSupplier === undefined
                }
              />
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 1 }}>
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
            <FormControl size="sm" sx={{ mb: 1, width: "46.5%" }}>
              <FormLabel>From Warehouse</FormLabel>
              <Autocomplete
                options={warehouses.items}
                getOptionLabel={(option) => option.name}
                value={selectedWarehouse}
                onChange={(event, newValue) => {
                  setSelectedWarehouse(newValue);
                  if (newValue !== null && newValue !== undefined) {
                    fetchWarehouseItems(newValue.id, null);
                  }
                }}
                size="sm"
                className="w-[100%]"
                placeholder="Select Warehouse"
                disabled={isEditDisabled || rrTransfer === "yes"}
                required
              />
            </FormControl>
          </Stack>
        </div>
      </Card>
      <Card className="w-[40%]">
        <div>
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
          <FormControl size="sm" sx={{ mb: 3 }}>
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

export default STFormDetails;
