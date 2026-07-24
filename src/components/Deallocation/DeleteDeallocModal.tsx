import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box } from "@mui/joy";
import type { DeleteModalProps } from "../../interface";
import { useState } from "react";

const DeleteDeallocModal = ({
  open,
  title,
  setOpen,
  onDelete,
  isUnposted,
}: DeleteModalProps & { isUnposted: boolean }): JSX.Element => {
  const actionLabel = isUnposted ? "Delete" : "Cancel";
  const [isDeleting, setIsDeleting] = useState(false);
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
            <h4 className="mb-6">{title}</h4>
            <div className="mb-7">
              <p className="text-sm">
                Are you sure you want to {isUnposted ? "delete" : "cancel"} this
                Deallocation?
              </p>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                size="sm"
                variant="outlined"
                sx={{ ml: 2, width: 130 }}
                onClick={() => setOpen(false)}
              >
                Go Back
              </Button>
              <Button
                className="bg-button-warning"
                sx={{ ml: 2, width: 130 }}
                color={isUnposted ? "danger" : "warning"}
                size="sm"
                loading={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  await onDelete(); // Call the onDelete function when the button is clicked
                  setOpen(false);
                  setIsDeleting(false);
                }}
              >
                {actionLabel}
              </Button>
            </div>
          </Box>
        </Sheet>
      </div>
    </Modal>
  );
};

export default DeleteDeallocModal;
