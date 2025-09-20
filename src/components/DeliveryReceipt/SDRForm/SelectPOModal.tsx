import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box, ListItem, List, Checkbox, Table } from "@mui/joy";
import type { PurchaseOrder } from "../../../interface";
import { withTooltip } from "../../shared/withTooltip";

const SelectPOModal = ({
  open,
  setOpen,
  unservedPOs,
  setSelectedPOs,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  unservedPOs: PurchaseOrder[];
  setSelectedPOs: Dispatch<SetStateAction<PurchaseOrder[]>>;
}): JSX.Element => {
  const [checkedPOs, setCheckedPOs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const options: Record<string, boolean> = {};
    unservedPOs.forEach((PO) => {
      options[PO.reference_number] = false;
    });
    setCheckedPOs(options);
  }, [unservedPOs]);

  const handleCheckboxChange = (referenceNumber: string): void => {
    setCheckedPOs((prev) => ({
      ...prev,
      [referenceNumber]: !prev[referenceNumber],
    }));
  };

  const selectCheckedPOs = (): void => {
    const selectedRefNos = Object.keys(checkedPOs).filter(
      (refNo) => checkedPOs[refNo],
    );

    const selectedPOs = unservedPOs.filter((PO) =>
      selectedRefNos.includes(PO.reference_number),
    );

    setSelectedPOs(selectedPOs);
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
            <h4 className="mb-6">Select Purchase Orders</h4>
            <div>
              <List size="sm" className="h-[250px] w-100 overflow-y-scroll">
                <Table>
                  <thead>
                    <tr>
                      <th>Check</th>
                      <th>PO No.</th>
                      <th>Ref No.</th>
                      <th>Trans. Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unservedPOs !== undefined &&
                      unservedPOs.length > 0 &&
                      unservedPOs.map((PO) => (
                        <tr key={PO.id}>
                          <td>
                            <ListItem>
                              <Checkbox
                                checked={!!checkedPOs[PO.reference_number]}
                                onChange={() =>
                                  handleCheckboxChange(PO.reference_number)
                                }
                              />
                            </ListItem>
                          </td>
                          <td>{PO.id}</td>
                          <td>{withTooltip(PO.reference_number, "120px")}</td>
                          <td>{PO.transaction_date}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                {(unservedPOs === undefined || unservedPOs.length === 0) && (
                  <p className="mt-5 text-sm">
                    No Purchase Orders with Unserved Quantities
                  </p>
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
                onClick={selectCheckedPOs}
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

export default SelectPOModal;
