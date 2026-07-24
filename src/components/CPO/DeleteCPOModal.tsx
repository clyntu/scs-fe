import React, { useState } from "react";
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  Typography,
  Alert,
} from "@mui/joy";
import { WarningRounded, InfoOutlined } from "@mui/icons-material";
import { toast } from "react-toastify";
import type { CPO } from "../../interface";

interface DeleteCPOModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedCPO: CPO | null;
  onDelete: (reason?: string) => Promise<void>;
}

const DeleteCPOModal: React.FC<DeleteCPOModalProps> = ({
  open,
  setOpen,
  selectedCPO,
  onDelete,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isUnposted = selectedCPO?.status === "unposted";
  const isPosted = selectedCPO?.status === "posted";

  // Helper function to extract meaningful error message
  const getErrorMessage = (error: any): string => {
    if (error.response?.data?.detail != null) {
      const detail = error.response.data.detail;

      // Handle database constraint violations
      if (typeof detail === "string") {
        if (
          detail.includes("NotNullViolation") &&
          detail.includes("created_by")
        ) {
          return "Failed to cancel CPO: Missing user information. Please contact system administrator.";
        }
        if (detail.includes("ForeignKeyViolation")) {
          return "Failed to cancel CPO: Cannot delete due to related records. Please ensure all dependencies are handled first.";
        }
        if (detail.includes("psycopg2.errors")) {
          return "Failed to cancel CPO: Database error occurred. Please contact system administrator.";
        }
        // Return first line of detail if it's a readable error
        const firstLine = detail.split("\n")[0];
        if (firstLine.length > 0 && firstLine.length < 200) {
          return firstLine;
        }
      }

      // Handle object detail
      if (typeof detail === "object" && detail?.message != null) {
        return detail.message;
      }
    }

    // Handle error message
    if (error.response?.data?.message != null) {
      return error.response.data.message;
    }

    // Generic fallback
    return "Failed to cancel CPO. Please try again or contact system administrator.";
  };

  const resetModal = (): void => {
    setReason("");
    setLoading(false);
  };

  const handleClose = (): void => {
    setOpen(false);
    resetModal();
  };

  const handleConfirm = async (): Promise<void> => {
    if (isPosted && reason.trim() === "") {
      return;
    }

    setLoading(true);
    try {
      const reasonToSend = reason.trim() === "" ? undefined : reason.trim();
      await onDelete(reasonToSend);
      handleClose();
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      console.error("Error deleting/cancelling CPO:", error);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        variant="outlined"
        role="alertdialog"
        sx={{ maxWidth: 500, width: "90%" }}
      >
        <DialogTitle>
          {isUnposted
            ? "Delete Customer Purchase Order"
            : "Cancel Customer Purchase Order"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {isUnposted ? (
              <Alert
                color="warning"
                variant="soft"
                startDecorator={<WarningRounded />}
              >
                <Typography level="body-sm">
                  This will permanently delete the CPO. This action cannot be
                  undone.
                </Typography>
              </Alert>
            ) : (
              <Alert
                color="neutral"
                variant="soft"
                startDecorator={<InfoOutlined />}
              >
                <Typography level="body-sm">
                  This will cancel the CPO and update its status. The CPO will
                  remain viewable but cannot be edited. If it already has
                  allocations, deallocate them first. Cancellation reason is
                  required.
                </Typography>
              </Alert>
            )}

            {isPosted && (
              <FormControl required>
                <FormLabel>Cancellation Reason</FormLabel>
                <Textarea
                  placeholder="Please provide a reason for cancellation..."
                  value={reason}
                  onChange={(e): void => setReason(e.target.value)}
                  minRows={3}
                  maxRows={5}
                />
              </FormControl>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleClose} disabled={loading}>
            Close
          </Button>
          <Button
            variant="soft"
            color="danger"
            className="bg-delete-red"
            loading={loading}
            onClick={handleConfirm}
            disabled={isPosted && reason.trim() === ""}
          >
            {isUnposted ? "Delete" : "Cancel"}
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
};

export default DeleteCPOModal;
