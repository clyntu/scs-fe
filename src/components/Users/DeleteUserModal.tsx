import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box } from "@mui/joy";
import type { DeleteModalProps } from "../../interface";
import { useState } from "react";

const DeleteUserModal = ({
  open,
  title,
  setOpen,
  onDelete,
}: DeleteModalProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
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
                Are you sure you want to delete this user? This action will
                remove the user from both the database and Supabase
                authentication system. This action cannot be undone.
              </p>
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
                className="bg-button-warning"
                color="danger"
                size="sm"
                loading={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  await onDelete();
                  setOpen(false);
                  setIsLoading(false);
                }}
              >
                Delete
              </Button>
            </div>
          </Box>
        </Sheet>
      </div>
    </Modal>
  );
};

export default DeleteUserModal;
