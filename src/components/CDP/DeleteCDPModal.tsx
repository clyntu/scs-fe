import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box } from "@mui/joy";
import type { DeleteModalProps } from "../../interface";
import { useState } from "react";

const DeleteCDPModal = ({
  open,
  title,
  setOpen,
  onDelete,
}: DeleteModalProps): JSX.Element => {
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
                Are you sure you want to archive this Delivery Plan?
              </p>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                className="ml-4 w-[130px]"
                size="sm"
                variant="outlined"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="ml-4 w-[130px] bg-button-warning"
                color="danger"
                size="sm"
                loading={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  await onDelete(); // Call the onDelete function when the button is clicked
                  setOpen(false);
                  setIsDeleting(false);
                }}
              >
                Archive
              </Button>
            </div>
          </Box>
        </Sheet>
      </div>
    </Modal>
  );
};

export default DeleteCDPModal;
