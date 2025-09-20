import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box, ListItem, List, Checkbox, Table } from "@mui/joy";
import type { DeliveryReceipt, PaginatedSDR } from "../../../interface";
import { withTooltip } from "../../shared/withTooltip";

const SelectSDRModal = ({
  open,
  setOpen,
  unservedSDRs,
  setSelectedSDRs,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  unservedSDRs: PaginatedSDR | undefined;
  setSelectedSDRs: Dispatch<SetStateAction<DeliveryReceipt[]>>;
}): JSX.Element => {
  const [checkedSDRs, setCheckedSDRs] = useState<Record<number, boolean>>({});
  const postedUnservedSDRs = unservedSDRs?.items.filter(
    (SDR) => SDR.status === "posted",
  );

  useEffect(() => {
    const options: Record<string, boolean> = {};
    if (unservedSDRs?.items !== undefined)
      unservedSDRs.items.forEach((SDR) => {
        options[SDR.id] = false;
      });
    setCheckedSDRs(options);
  }, [unservedSDRs]);

  const handleCheckboxChange = (id: number): void => {
    setCheckedSDRs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectCheckedSDRs = (): void => {
    if (unservedSDRs?.items !== undefined) {
      const selectedSDRIds = Object.keys(checkedSDRs).filter(
        (id: string) => checkedSDRs[parseInt(id)],
      );

      const selectedSDRs = unservedSDRs.items.filter((SDR: DeliveryReceipt) =>
        selectedSDRIds.includes(String(SDR.id)),
      );

      setSelectedSDRs(selectedSDRs);
      setOpen(false);
    }
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
            <h4 className="mb-6">Select Delivery Receipts</h4>

            <div>
              <List size="sm" className="h-[250px] w-100 overflow-y-scroll">
                <Table>
                  <thead>
                    <tr>
                      <th>Check</th>
                      <th>SDR No.</th>
                      <th>Ref No.</th>
                      <th>Trans. Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postedUnservedSDRs !== undefined &&
                      postedUnservedSDRs.length > 0 &&
                      postedUnservedSDRs.map((SDR) => (
                        <tr key={SDR.id}>
                          <td>
                            <ListItem>
                              <Checkbox
                                checked={!!checkedSDRs[SDR.id]}
                                onChange={() => handleCheckboxChange(SDR.id)}
                              />
                            </ListItem>
                          </td>
                          <td>{SDR.id}</td>
                          <td>{withTooltip(SDR.reference_number, "120px")}</td>
                          <td>{SDR.transaction_date}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                {(postedUnservedSDRs === undefined ||
                  postedUnservedSDRs.length === 0) && (
                  <p className="mt-5 text-sm">No Supplier Delivery Receipts</p>
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
                onClick={selectCheckedSDRs}
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

export default SelectSDRModal;
