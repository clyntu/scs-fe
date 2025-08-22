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
  Box,
} from "@mui/joy";
import { WarningRounded, InfoOutlined } from "@mui/icons-material";
import { toast } from "react-toastify";
import type { CPO } from "../../interface";
import { StatusChip } from "../../utils/statusUtils";

interface Allocation {
  allocation_id: number;
  reference_number: string;
  transaction_date: string;
  status: string;
  customer_name: string;
  customer_id: number;
  notes?: string;
  total_items: number;
  total_quantity: number;
}

interface AllocationSummary {
  has_allocations: boolean;
  total_allocations: number;
  total_items_affected: number;
  total_quantity_affected: number;
  earliest_allocation_date: string;
  latest_allocation_date: string;
  allocations: Allocation[];
}

interface ImpactSummary {
  warehouses_affected: Array<{
    warehouse_id: number;
    warehouse_name: string;
    warehouse_code: string;
    items_affected: number;
    total_quantity_returned: number;
  }>;
  customers_affected: Array<{
    customer_id: number;
    customer_name: string;
    allocations_count: number;
    total_value_affected: number;
  }>;
}

interface ConflictResponse {
  message: string;
  allocation_summary: AllocationSummary;
  allocations: Allocation[];
  requires_confirmation: boolean;
  impact_summary: ImpactSummary;
}

interface DeleteCPOModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedCPO: CPO | null;
  onDelete: (reason?: string, forceDeallocation?: boolean) => Promise<void>;
}

const DeleteCPOModal: React.FC<DeleteCPOModalProps> = ({
  open,
  setOpen,
  selectedCPO,
  onDelete,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "conflict" | "confirmation">(
    "initial",
  );
  const [conflictData, setConflictData] = useState<ConflictResponse | null>(
    null,
  );

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
          return "Failed to cancel CPO: Missing user information for deallocation process. Please contact system administrator.";
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
    setStep("initial");
    setConflictData(null);
    setLoading(false);
  };

  const handleClose = (): void => {
    setOpen(false);
    resetModal();
  };

  const getModalTitle = (): string => {
    if (isUnposted) return "Delete Customer Purchase Order";
    if (step === "conflict") return "Allocation Conflict Detected";
    if (step === "confirmation") return "Confirm Cancellation & Deallocation";
    return "Cancel Customer Purchase Order";
  };

  const getButtonText = (): string => {
    if (isUnposted) return "Delete";
    if (step === "conflict") return "Proceed";
    if (step === "confirmation") return "Cancel & Deallocate";
    return "Cancel";
  };

  const handleInitialAction = async (): Promise<void> => {
    if (isPosted && reason.trim() === "") {
      return;
    }

    setLoading(true);
    try {
      const reasonToSend = reason.trim() === "" ? undefined : reason.trim();
      await onDelete(reasonToSend, false);
      handleClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        const responseData = error.response.data;
        setConflictData(responseData.detail as ConflictResponse);
        setStep("conflict");
      } else {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);
        console.error("Error deleting/cancelling CPO:", error);
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConflictProceed = (): void => {
    setStep("confirmation");
  };

  const handleFinalConfirmation = async (): Promise<void> => {
    setLoading(true);
    try {
      await onDelete(reason, true);
      handleClose();
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      console.error("Error with forced deallocation:", error);
      // Don't close modal immediately on error so user can see the toast
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (): JSX.Element => {
    if (step === "initial") {
      return (
        <>
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
                    remain viewable but cannot be edited. Cancellation reason is
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
              onClick={handleInitialAction}
              disabled={isPosted && reason.trim() === ""}
            >
              {getButtonText()}
            </Button>
          </DialogActions>
        </>
      );
    }

    if (step === "conflict") {
      return (
        <>
          <DialogContent>
            <Stack spacing={3}>
              <Alert
                color="warning"
                variant="soft"
                startDecorator={<WarningRounded />}
              >
                <Typography level="body-sm">
                  {conflictData?.message ??
                    "CPO has allocations that need to be handled"}
                </Typography>
              </Alert>

              {/* Affected Allocations */}
              {conflictData?.allocation_summary?.allocations != null &&
                conflictData.allocation_summary.allocations.length > 0 && (
                  <Box>
                    <Typography level="title-sm" sx={{ mb: 2 }}>
                      Affected Allocations (
                      {conflictData.allocation_summary.allocations.length})
                    </Typography>
                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "sm",
                        overflow: "hidden",
                      }}
                    >
                      {/* Table Header */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1.5fr 1.5fr 1.5fr 1fr",
                          gap: 1,
                          p: 1.5,
                          bgcolor: "background.level2",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography level="body-xs" sx={{ fontWeight: "bold" }}>
                          Allocation
                        </Typography>
                        <Typography level="body-xs" sx={{ fontWeight: "bold" }}>
                          Customer
                        </Typography>
                        <Typography level="body-xs" sx={{ fontWeight: "bold" }}>
                          Date
                        </Typography>
                        <Typography level="body-xs" sx={{ fontWeight: "bold" }}>
                          Status
                        </Typography>
                        <Typography level="body-xs" sx={{ fontWeight: "bold" }}>
                          Items
                        </Typography>
                      </Box>

                      {/* Table Body - Scrollable */}
                      <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                        {conflictData.allocation_summary?.allocations?.map(
                          (allocation: Allocation, index: number) => (
                            <Box
                              key={allocation.allocation_id}
                              sx={{
                                display: "grid",
                                gridTemplateColumns:
                                  "1fr 1.5fr 1.5fr 1.5fr 1fr",
                                gap: 1,
                                p: 1.5,
                                borderBottom:
                                  index <
                                  (conflictData.allocation_summary?.allocations
                                    ?.length ?? 0) -
                                    1
                                    ? "1px solid"
                                    : "none",
                                borderColor: "divider",
                                "&:hover": {
                                  bgcolor: "background.level1",
                                },
                              }}
                            >
                              <Typography
                                level="body-sm"
                                sx={{ fontWeight: "medium" }}
                              >
                                {allocation.reference_number}
                              </Typography>
                              <Typography level="body-sm">
                                {allocation.customer_name}
                              </Typography>
                              <Typography level="body-xs">
                                {allocation.transaction_date}
                              </Typography>
                              <StatusChip status={allocation.status} />
                              <Box>
                                <Typography level="body-xs">
                                  {allocation.total_items} items
                                </Typography>
                                <Typography
                                  level="body-xs"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {allocation.total_quantity} units
                                </Typography>
                              </Box>
                            </Box>
                          ),
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}

              <Alert color="danger" variant="soft">
                <Typography level="body-sm">
                  <strong>Important:</strong> Cancelling this CPO will
                  automatically cancel all associated allocations and return the
                  allocated items to available inventory. This action cannot be
                  undone.
                </Typography>
              </Alert>
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
              onClick={handleConflictProceed}
            >
              {getButtonText()}
            </Button>
          </DialogActions>
        </>
      );
    }

    if (step === "confirmation") {
      return (
        <>
          <DialogContent>
            <Stack spacing={2}>
              <Alert
                color="danger"
                variant="soft"
                startDecorator={<WarningRounded />}
              >
                <Typography level="body-sm">
                  <strong>Final Confirmation Required</strong>
                </Typography>
                <Typography level="body-sm" sx={{ mt: 1 }}>
                  You are about to cancel this CPO and automatically deallocate{" "}
                  {conflictData?.allocation_summary?.total_allocations ?? 0}{" "}
                  allocation(s). This action is irreversible.
                </Typography>
              </Alert>

              <Typography level="body-sm">
                <strong>CPO:</strong> {selectedCPO?.reference_number}
                <br />
                <strong>Reason:</strong> {reason}
                <br />
                <strong>Allocations to be removed:</strong>{" "}
                {conflictData?.allocation_summary?.total_allocations ?? 0}
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              variant="outlined"
              onClick={(): void => setStep("conflict")}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              variant="soft"
              color="danger"
              className="bg-delete-red"
              loading={loading}
              onClick={handleFinalConfirmation}
            >
              {getButtonText()}
            </Button>
          </DialogActions>
        </>
      );
    }

    return <div>Invalid step</div>;
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        variant="outlined"
        role="alertdialog"
        sx={{
          maxWidth:
            step === "conflict" &&
            conflictData?.allocations != null &&
            conflictData.allocations.length > 0
              ? 800
              : 500,
          width: "90%",
        }}
      >
        <DialogTitle>{getModalTitle()}</DialogTitle>
        {renderContent()}
      </ModalDialog>
    </Modal>
  );
};

export default DeleteCPOModal;
