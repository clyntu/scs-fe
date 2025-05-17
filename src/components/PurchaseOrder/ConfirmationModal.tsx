import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box } from "@mui/joy";

const ConfirmationModal = ({
  open,
  setOpen,
  onConfirm,
  onCancel,
  itemName,
}: {
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  itemName: string;
}): JSX.Element => {
  return (
    <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        onCancel();
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
            <h4 className="mb-6">Confirm Price Change</h4>
            <div className="mb-7">
              <p className="text-sm">
                Are you sure you want to adjust the price of{" "}
                <strong>{itemName}</strong>?
              </p>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                sx={{ ml: 2, width: 130 }}
                size="sm"
                variant="outlined"
                onClick={() => {
                  onCancel();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                sx={{ ml: 2, width: 130 }}
                className="bg-button-primary"
                color="primary"
                size="sm"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
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

export default ConfirmationModal;
