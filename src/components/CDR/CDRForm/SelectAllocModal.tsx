import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box, ListItem, List, Checkbox, Table } from "@mui/joy";
import { type AllocItemsFE, type UnplannedAlloc } from "../interface";

const SelectAllocModal = ({
  open,
  setOpen,
  unservedAllocs,
  setFormattedAllocs,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  unservedAllocs: UnplannedAlloc[];
  setFormattedAllocs: Dispatch<SetStateAction<AllocItemsFE[]>>;
}): JSX.Element => {
  const [checkedAllocs, setCheckedAllocs] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const options: Record<string, boolean> = {};
    unservedAllocs.forEach((alloc) => {
      options[alloc.id] = false;
    });
    setCheckedAllocs(options);
  }, [unservedAllocs]);

  const handleCheckboxChange = (referenceNumber: string): void => {
    setCheckedAllocs((prev) => ({
      ...prev,
      [referenceNumber]: !prev[referenceNumber],
    }));
  };

  const selectCheckedAllocs = (): void => {
    const selectedIds = Object.keys(checkedAllocs).filter(
      (id) => checkedAllocs[id],
    );

    const selectedAllocs = unservedAllocs.filter((alloc) =>
      selectedIds.includes(String(alloc.id)),
    );

    const formattedAllocs = selectedAllocs
      .map((alloc: UnplannedAlloc) => {
        return alloc.allocation_items.map((allocItem) => {
          const itemObj = allocItem.customer_purchase_order.items.find(
            (item) => item.item_id === allocItem.item_id,
          );

          return {
            id: alloc.id,
            alloc_item_id: allocItem.id,
            stock_code: itemObj?.item.stock_code ?? "",
            name: itemObj?.item.name ?? "",
            cpo_id: allocItem.customer_purchase_order_id,
            alloc_qty: allocItem.total_available,
            dp_qty: "",

            cpo_item_volume: itemObj?.volume ?? 0,
            cpo_item_unserved: itemObj?.unserved_cpo ?? 0,

            price: itemObj?.price ?? 0,
            gross_amount: 0,
            net_amount: 0,

            customer_discount_1:
              allocItem.customer_purchase_order.customer_discount_1,
            customer_discount_2:
              allocItem.customer_purchase_order.customer_discount_2,
            customer_discount_3:
              allocItem.customer_purchase_order.customer_discount_3,

            transaction_discount_1:
              allocItem.customer_purchase_order.transaction_discount_1,
            transaction_discount_2:
              allocItem.customer_purchase_order.transaction_discount_2,
            transaction_discount_3:
              allocItem.customer_purchase_order.transaction_discount_3,
          };
        });
      })
      .flat();

    setFormattedAllocs(formattedAllocs);
    setOpen(false);
  };

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
            <h4 className="mb-6">Select Allocations</h4>
            <div>
              <List size="sm" className="h-[250px] w-100 overflow-y-scroll">
                <Table>
                  <thead>
                    <tr>
                      <th>Check</th>
                      <th>Alloc No.</th>
                      <th>Trans. Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unservedAllocs !== undefined &&
                      unservedAllocs.length > 0 &&
                      unservedAllocs.map((alloc) => (
                        <tr key={alloc.id}>
                          <td>
                            <ListItem>
                              <Checkbox
                                checked={!!checkedAllocs[alloc.id]}
                                onChange={() =>
                                  handleCheckboxChange(String(alloc.id))
                                }
                              />
                            </ListItem>
                          </td>
                          <td>{alloc.id}</td>
                          <td>{alloc.transaction_date}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                {(unservedAllocs === undefined ||
                  unservedAllocs.length === 0) && (
                  <p className="mt-5 text-sm">No Allocations to Plan</p>
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
                className="ml-4 w-[130px] bg-button-primary"
                color="primary"
                size="sm"
                onClick={selectCheckedAllocs}
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

export default SelectAllocModal;
