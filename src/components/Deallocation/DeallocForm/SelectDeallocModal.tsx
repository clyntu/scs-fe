import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box, ListItem, List, Checkbox } from "@mui/joy";
import type { DeliveryReceipt, PaginatedSDR } from "../../../interface";

const SelectDeallocModal = ({
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
  const [checkedSDRs, setCheckedSDRs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const options: Record<string, boolean> = {};
    if (unservedSDRs?.items !== undefined)
      unservedSDRs.items.forEach((SDR) => {
        options[SDR.reference_number] = false;
      });
    setCheckedSDRs(options);
  }, [unservedSDRs]);

  const handleCheckboxChange = (referenceNumber: string): void => {
    setCheckedSDRs((prev) => ({
      ...prev,
      [referenceNumber]: !prev[referenceNumber],
    }));
  };

  const selectCheckedSDRs = (): void => {
    if (unservedSDRs?.items !== undefined) {
      const selectedRefNos = Object.keys(checkedSDRs).filter(
        (refNo) => checkedSDRs[refNo],
      );

      const selectedSDRs = unservedSDRs.items.filter((SDR) =>
        selectedRefNos.includes(SDR.reference_number),
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
            maxWidth: 500,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <Box>
            <h4 className="mb-6">Select Purchase Orders</h4>

            <div>
              <List size="sm" className="h-[250px] overflow-y-scroll">
                {unservedSDRs?.items !== undefined &&
                  unservedSDRs.items.length > 0 &&
                  unservedSDRs.items.map((SDR) => (
                    <ListItem key={SDR.id}>
                      <Checkbox
                        checked={!!checkedSDRs[SDR.reference_number]}
                        label={`Ref No. ${SDR.reference_number}`}
                        onChange={() =>
                          handleCheckboxChange(SDR.reference_number)
                        }
                      />
                    </ListItem>
                  ))}
                {(unservedSDRs?.items === undefined ||
                  unservedSDRs.items.length === 0) &&
                  "No Supplier Delivery Receipts"}
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

export default SelectDeallocModal;
