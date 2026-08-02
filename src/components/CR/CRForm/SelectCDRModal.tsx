import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box, ListItem, List, Checkbox, Table, Input } from "@mui/joy";
import { type DRItemsFE } from "../interface";
import { type CDR } from "../../../interface";
import CircularProgress from "@mui/joy/CircularProgress";
import { withTooltip } from "../../shared/withTooltip";
import { buildInitialSourceAllocations } from "./helpers";

const SelectCDRModal = ({
  open,
  setOpen,
  CDRs,
  setFormattedDRs,
  isFetchingCDRs,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  CDRs: CDR[];
  setFormattedDRs: Dispatch<SetStateAction<DRItemsFE[]>>;
  isFetchingCDRs: boolean;
}): JSX.Element => {
  const [checkedCDRs, setCheckedCDRs] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const options: Record<string, boolean> = {};
    CDRs.forEach((cdr) => {
      options[cdr.id] = false;
    });
    setCheckedCDRs(options);
  }, [CDRs]);

  const handleCheckboxChange = (referenceNumber: string): void => {
    setCheckedCDRs((prev) => ({
      ...prev,
      [referenceNumber]: !prev[referenceNumber],
    }));
  };

  const selectCheckedCDRs = (): void => {
    const selectedIds = Object.keys(checkedCDRs).filter(
      (id) => checkedCDRs[id],
    );

    const selectedCDRs = CDRs.filter((cdr) =>
      selectedIds.includes(String(cdr.id)),
    );

    const formattedCDRs = selectedCDRs
      .map((cdr: CDR) => {
        return cdr.receipt_items.map((receiptItem) => {
          const allocatedItem = receiptItem.delivery_plan_item.allocation_item;
          const itemObj = allocatedItem.customer_purchase_order.items.find(
            (item) => item.item_id === allocatedItem.item_id,
          );
          const sourceFulfillments = receiptItem.source_fulfillments ?? [];

          return {
            id: cdr.id,
            delivery_receipt_item_id: receiptItem.id,
            item_id: allocatedItem.item_id,
            alloc_no: allocatedItem.allocation_id,
            cpo_id: allocatedItem.customer_purchase_order_id,
            stock_code: itemObj?.item.stock_code ?? "",
            name: itemObj?.item.name ?? "",
            return_warehouse: null,
            return_qty: "0",
            price: String(itemObj?.price),
            gross_amount: 0,
            customer_discount_1:
              allocatedItem.customer_purchase_order.customer_discount_1,
            customer_discount_2:
              allocatedItem.customer_purchase_order.customer_discount_2,
            customer_discount_3:
              allocatedItem.customer_purchase_order.customer_discount_3,

            transaction_discount_1:
              allocatedItem.customer_purchase_order.transaction_discount_1,
            transaction_discount_2:
              allocatedItem.customer_purchase_order.transaction_discount_2,
            transaction_discount_3:
              allocatedItem.customer_purchase_order.transaction_discount_3,
            source_fulfillments: sourceFulfillments,
            source_allocations:
              buildInitialSourceAllocations(sourceFulfillments),
          };
        });
      })
      .flat();

    setFormattedDRs(formattedCDRs);
    setOpen(false);
  };

  // Filter CDRs based on search query
  const filteredCDRs = CDRs.filter(
    (cdr) =>
      cdr.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      cdr.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        setOpen(false);
      }}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <div>
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 800,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <Box>
            <h4 className="mb-6">Select Delivery Receipts</h4>
            <Input
              placeholder="Search by CDR No. or Reference No."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
            />
            <div>
              <List size="sm" className="h-[250px] w-100 overflow-y-scroll">
                <Table>
                  {isFetchingCDRs ? (
                    <div className="w-full flex justify-center mt-[70px]">
                      <CircularProgress size="md" variant="soft" />
                    </div>
                  ) : (
                    <>
                      <thead>
                        <tr>
                          <th>Check</th>
                          <th>CDR No.</th>
                          <th>Ref No.</th>
                          <th>Trans. Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!isFetchingCDRs &&
                          filteredCDRs.length > 0 &&
                          filteredCDRs.map((cdr) => (
                            <tr key={cdr.id}>
                              <td>
                                <ListItem>
                                  <Checkbox
                                    checked={!!checkedCDRs[cdr.id]}
                                    onChange={() =>
                                      handleCheckboxChange(String(cdr.id))
                                    }
                                  />
                                </ListItem>
                              </td>
                              <td>{cdr.id}</td>
                              <td>
                                {withTooltip(cdr.reference_number, "120px")}
                              </td>
                              <td>{cdr.transaction_date}</td>
                            </tr>
                          ))}
                      </tbody>
                    </>
                  )}
                </Table>
                {!isFetchingCDRs &&
                  filteredCDRs.length === 0 &&
                  searchQuery !== "" && (
                    <p className="mt-5 text-sm">
                      No CDRs found matching your search
                    </p>
                  )}
                {!isFetchingCDRs && CDRs.length === 0 && searchQuery === "" && (
                  <p className="mt-5 text-sm">No CDRs to Plan</p>
                )}
              </List>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                size="sm"
                variant="outlined"
                sx={{ ml: 2, width: 130 }}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                sx={{ ml: 2, width: 130 }}
                className="bg-button-primary"
                color="primary"
                size="sm"
                onClick={selectCheckedCDRs}
              >
                Confirm
              </Button>
            </div>
          </Box>
        </Sheet>
      </div>
    </Modal>
  );
};

export default SelectCDRModal;
