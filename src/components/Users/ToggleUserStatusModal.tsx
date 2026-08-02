import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Button, Box } from "@mui/joy";
import { useState } from "react";

interface ToggleUserStatusModalProps {
  open: boolean;
  title: string;
  setOpen: (isOpen: boolean) => void;
  onToggleStatus: () => Promise<void>;
  isDisabling: boolean; // true if disabling user, false if enabling user
}

const ToggleUserStatusModal = ({
  open,
  title,
  setOpen,
  onToggleStatus,
  isDisabling,
}: ToggleUserStatusModalProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);

  const actionText = isDisabling ? "disable" : "enable";
  const actionTextCapitalized = isDisabling ? "Disable" : "Enable";

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
                Are you sure you want to {actionText} this user?{" "}
                {isDisabling ? (
                  <>
                    The user will not be able to log in or access the website
                    until they are re-enabled by an admin.
                  </>
                ) : (
                  <>
                    The user will be able to log in and access the website
                    again.
                  </>
                )}
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
                color={isDisabling ? "warning" : "success"}
                size="sm"
                loading={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  await onToggleStatus();
                  setOpen(false);
                  setIsLoading(false);
                }}
              >
                {actionTextCapitalized}
              </Button>
            </div>
          </Box>
        </Sheet>
      </div>
    </Modal>
  );
};

export default ToggleUserStatusModal;
