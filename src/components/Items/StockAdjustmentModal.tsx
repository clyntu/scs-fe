import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import Stack from "@mui/joy/Stack";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Radio from "@mui/joy/Radio";
import RadioGroup from "@mui/joy/RadioGroup";
import Button from "@mui/joy/Button";
import Alert from "@mui/joy/Alert";
import Typography from "@mui/joy/Typography";
import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../utils/axiosConfig";
import type {
  StockAdjustmentRequest,
  StockAdjustmentResponse,
} from "../../interface";

interface StockAdjustmentModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  warehouseId: number;
  warehouseName: string;
  itemId: number;
  itemName: string;
  stockCode: string;
  currentStock: number;
  onSuccess: () => void;
}

const StockAdjustmentModal = ({
  open,
  setOpen,
  warehouseId,
  warehouseName,
  itemId,
  itemName,
  stockCode,
  currentStock,
  onSuccess,
}: StockAdjustmentModalProps): JSX.Element => {
  const [adjustmentType, setAdjustmentType] = useState<"surplus" | "deficit">(
    "surplus",
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ amount: false, reason: false });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Reset form state when modal opens
  useEffect(() => {
    if (open) {
      setAdjustmentAmount("");
      setReason("");
      setNotes("");
      setAdjustmentType("surplus");
      setTouched({ amount: false, reason: false });
      setError("");
      setSuccess("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    const amount = parseInt(adjustmentAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters");
      return;
    }

    if (reason.trim().length > 500) {
      setError("Reason cannot exceed 500 characters");
      return;
    }

    if (notes.trim().length > 1000) {
      setError("Notes cannot exceed 1000 characters");
      return;
    }

    if (adjustmentType === "deficit" && amount > currentStock) {
      setError(
        `Insufficient stock. Current stock: ${currentStock}, attempting to remove: ${amount}`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const request: StockAdjustmentRequest = {
        adjustment_type: adjustmentType,
        adjustment_amount: amount,
        reason: reason.trim(),
        ...(notes.trim() && { notes: notes.trim() }),
      };

      const response = await axiosInstance.post<StockAdjustmentResponse>(
        `/api/warehouse_items/${warehouseId}/items/${itemId}/adjust-stock`,
        request,
      );

      setSuccess(
        `Stock adjusted successfully. New quantity: ${response.data.new_on_stock} units`,
      );

      // Wait a moment to show success message, then close and refresh
      setTimeout(() => {
        setOpen(false);
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to adjust stock. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!isSubmitting) {
      setOpen(false);
      setAdjustmentAmount("");
      setReason("");
      setNotes("");
      setAdjustmentType("surplus");
      setError("");
      setSuccess("");
    }
  };

  const predictedStock = (): number => {
    const amount = parseInt(adjustmentAmount, 10);
    if (isNaN(amount)) return currentStock;
    return adjustmentType === "surplus"
      ? currentStock + amount
      : currentStock - amount;
  };

  // Validation helpers with error messages
  const getAmountError = useMemo(() => {
    // Don't show errors during submission or after success
    if (!touched.amount || isSubmitting || success) return null;
    const amount = parseFloat(adjustmentAmount);
    if (!adjustmentAmount) return "Amount is required";
    if (isNaN(amount)) return "Please enter a valid number";
    if (amount <= 0) return "Amount must be greater than 0";
    return null;
  }, [adjustmentAmount, touched.amount, isSubmitting, success]);

  const getReasonError = useMemo(() => {
    // Don't show errors during submission or after success
    if (!touched.reason || isSubmitting || success) return null;
    const trimmedReason = reason.trim();
    if (!trimmedReason) return "Reason is required";
    if (trimmedReason.length < 5)
      return `Reason must be at least 5 characters (${trimmedReason.length}/5)`;
    if (trimmedReason.length > 500)
      return `Reason must not exceed 500 characters (${trimmedReason.length}/500)`;
    return null;
  }, [reason, touched.reason, isSubmitting, success]);

  const getNotesError = useMemo(() => {
    // Don't show errors during submission or after success
    if (isSubmitting || success) return null;
    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > 1000)
      return `Notes must not exceed 1000 characters (${trimmedNotes.length}/1000)`;
    return null;
  }, [notes, isSubmitting, success]);

  const isFormValid = useMemo(() => {
    const trimmedReason = reason.trim();
    const amount = parseFloat(adjustmentAmount);

    return (
      !isNaN(amount) &&
      amount > 0 &&
      trimmedReason.length >= 5 &&
      trimmedReason.length <= 500 &&
      notes.trim().length <= 1000
    );
  }, [adjustmentAmount, reason, notes]);

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog variant="outlined" role="alertdialog" size="md">
        <ModalClose disabled={isSubmitting} />
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {/* Item Info */}
            <Alert color="neutral" variant="soft">
              <Stack spacing={0.5}>
                <Typography level="body-sm">
                  <strong>Warehouse:</strong> {warehouseName}
                </Typography>
                <Typography level="body-sm">
                  <strong>Item:</strong> {itemName} ({stockCode})
                </Typography>
                <Typography level="body-sm">
                  <strong>Current Stock:</strong> {currentStock} units
                </Typography>
              </Stack>
            </Alert>

            {error && (
              <Alert color="danger" variant="soft">
                {error}
              </Alert>
            )}

            {success && (
              <Alert color="success" variant="soft">
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {/* Adjustment Type */}
                <FormControl required>
                  <FormLabel>Adjustment Type</FormLabel>
                  <RadioGroup
                    value={adjustmentType}
                    onChange={(e) =>
                      setAdjustmentType(e.target.value as "surplus" | "deficit")
                    }
                  >
                    <Radio
                      value="surplus"
                      label="Surplus (Add Stock)"
                      color="success"
                    />
                    <Radio
                      value="deficit"
                      label="Deficit (Subtract Stock)"
                      color="danger"
                    />
                  </RadioGroup>
                </FormControl>

                {/* Amount */}
                <FormControl required error={!!getAmountError}>
                  <FormLabel>Amount</FormLabel>
                  <Input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, amount: true }))
                    }
                    placeholder="Enter stock adjustment amount"
                    disabled={isSubmitting}
                    slotProps={{
                      input: {
                        min: 1,
                        step: 1,
                      },
                    }}
                  />
                  {getAmountError && (
                    <FormHelperText>{getAmountError}</FormHelperText>
                  )}
                  {adjustmentAmount &&
                    !isNaN(parseFloat(adjustmentAmount)) &&
                    parseFloat(adjustmentAmount) > 0 && (
                      <Typography level="body-sm" sx={{ mt: 0.5 }}>
                        New stock level will be:{" "}
                        <strong
                          style={{
                            color:
                              adjustmentType === "surplus"
                                ? "green"
                                : predictedStock() < 0
                                  ? "red"
                                  : "inherit",
                          }}
                        >
                          {predictedStock()} units
                        </strong>
                      </Typography>
                    )}
                </FormControl>

                {/* Reason */}
                <FormControl required error={!!getReasonError}>
                  <FormLabel>Reason for Adjustment</FormLabel>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, reason: true }))
                    }
                    placeholder="Explain why this adjustment is needed (minimum 5 characters)"
                    minRows={2}
                    disabled={isSubmitting}
                  />
                  {getReasonError ? (
                    <FormHelperText>{getReasonError}</FormHelperText>
                  ) : (
                    <FormHelperText>
                      {reason.trim().length > 0
                        ? `${reason.trim().length}/5 characters minimum (max 500)`
                        : "Minimum 5 characters required"}
                    </FormHelperText>
                  )}
                </FormControl>

                {/* Notes */}
                <FormControl error={!!getNotesError}>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional details (optional, max 1000 characters)"
                    minRows={2}
                    disabled={isSubmitting}
                  />
                  {getNotesError ? (
                    <FormHelperText>{getNotesError}</FormHelperText>
                  ) : notes.trim().length > 0 ? (
                    <FormHelperText>
                      {notes.trim().length}/1000 characters
                    </FormHelperText>
                  ) : (
                    <FormHelperText>
                      Optional additional information
                    </FormHelperText>
                  )}
                </FormControl>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color={adjustmentType === "surplus" ? "success" : "danger"}
                    loading={isSubmitting}
                    disabled={isSubmitting || !isFormValid}
                  >
                    {adjustmentType === "surplus"
                      ? "Add Stock"
                      : "Subtract Stock"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
};

export default StockAdjustmentModal;
