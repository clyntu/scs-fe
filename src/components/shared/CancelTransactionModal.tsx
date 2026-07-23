import React, { useState } from "react";
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Stack,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  Typography,
  Box,
} from "@mui/joy";
import { WarningRounded } from "@mui/icons-material";

interface CancelTransactionModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  transactionType: string;
  transactionId: number | string;
  onCancel: (reason: string) => Promise<void>;
}

const CancelTransactionModal: React.FC<CancelTransactionModalProps> = ({
  open,
  setOpen,
  title,
  transactionType,
  transactionId,
  onCancel,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async (): Promise<void> => {
    if (reason.trim() === "") {
      return;
    }

    setLoading(true);
    try {
      await onCancel(reason);
      setOpen(false);
      setReason("");
    } catch (error) {
      console.error("Error cancelling transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setOpen(false);
    setReason("");
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog variant="outlined" role="alertdialog" size="md">
        <DialogTitle>
          <WarningRounded sx={{ color: "warning.main", mr: 1 }} />
          {title}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography level="body-md">
              Are you sure you want to cancel this {transactionType}?
            </Typography>

            <Box sx={{ p: 2, bgcolor: "warning.softBg", borderRadius: "sm" }}>
              <Typography level="body-sm" sx={{ color: "warning.main" }}>
                <strong>Warning:</strong> Once cancelled, this transaction
                cannot be edited or reversed. This action will not affect
                inventory levels.
              </Typography>
            </Box>

            <Typography level="body-sm">
              <strong>{transactionType} ID:</strong> {transactionId}
            </Typography>

            <FormControl required>
              <FormLabel>Cancellation Reason</FormLabel>
              <Textarea
                placeholder="Please provide a reason for cancelling this transaction..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minRows={3}
                maxRows={5}
              />
            </FormControl>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="plain" color="neutral" onClick={handleClose}>
                Keep Transaction
              </Button>
              <Button
                variant="plain"
                color="danger"
                onClick={handleCancel}
                loading={loading}
              >
                Cancel Transaction
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
};

export default CancelTransactionModal;
