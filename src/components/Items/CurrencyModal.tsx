import React, { useState, useEffect } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import { AxiosError } from "axios";
import type { Currency } from "../../interface";
import CircularProgress from "@mui/joy/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

interface CurrencyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onChange?: () => void;
}

const CurrencyModal = ({ open, setOpen, onChange }: CurrencyModalProps) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [newCode, setNewCode] = useState("");
  const [editing, setEditing] = useState<Currency | null>(null);
  const [editCode, setEditCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchCurrencies = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<Currency[]>("/api/currencies");
      setCurrencies(res.data);
    } catch (e) {
      if (e instanceof AxiosError) {
        toast.error(`Error fetching currencies: ${e.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCurrencies();
    }
  }, [open]);

  const handleAdd = async () => {
    if (!newCode.trim()) return;
    setIsAdding(true);
    try {
      await axiosInstance.post("/api/currencies", { code: newCode.trim() });
      setNewCode("");
      await fetchCurrencies();
      onChange?.();
      toast.success("Currency added");
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        console.log(e);
        toast.error(
          `Failed to add currency: ${e.response?.data?.detail[0].msg || e.response?.data?.detail || "Unknown error"}`,
        );
      } else {
        toast.error("Failed to add currency: Unknown error");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async () => {
    if (!editing || !editCode.trim()) return;
    try {
      await axiosInstance.put(`/api/currencies/${editing.id}`, {
        code: editCode.trim(),
      });
      setEditing(null);
      setEditCode("");
      await fetchCurrencies();
      onChange?.();
      toast.success("Currency updated");
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        toast.error(
          `Failed to update currency: ${e.response?.data?.detail[0].msg || e.response?.data?.detail || "Unknown error"}`,
        );
      } else {
        toast.error("Failed to update currency: Unknown error");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this currency?")) return;
    setIsDeleting(String(id));
    try {
      await axiosInstance.delete(`/api/currencies/${id}`);
      await fetchCurrencies();
      onChange?.();
      toast.success("Currency deleted");
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        toast.error(
          `Failed to delete currency: ${e.response?.data?.detail || "Unknown error"}`,
        );
      } else {
        toast.error("Failed to delete currency: Unknown error");
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <Sheet
        sx={{
          width: 500,
          maxWidth: "90%",
          mx: "auto",
          mt: 8,
          p: 4,
          borderRadius: "md",
          boxShadow: "sm",
          pb: 6, // extra margin at the bottom
        }}
      >
        <ModalClose onClick={() => setOpen(false)} />
        <Box sx={{ mb: 3 }}>
          <Typography
            level="h2"
            sx={{
              color: "var(--joy-palette-primary-600)",
              mb: 0.5,
              fontSize: "1.5rem",
              fontWeight: 600,
            }}
          >
            Manage Currencies
          </Typography>
          <Typography
            level="body-sm"
            sx={{
              color: "var(--joy-palette-neutral-600)",
            }}
          >
            Add, edit, or remove currency codes
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 3,
            alignItems: "center",
            backgroundColor: "var(--joy-palette-background-level1)",
            p: 1.5,
            borderRadius: "sm",
          }}
        >
          <Input
            placeholder="Currency Code (e.g. USD)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            sx={{
              flex: 1,
              "--Input-focusedInset": "0px",
              "--Input-focusedThickness": "2px",
              "& input": {
                fontWeight: 500,
              },
            }}
            variant="outlined"
            size="md"
          />
          <Button
            onClick={handleAdd}
            variant="soft"
            color="primary"
            disabled={isAdding || !newCode.trim()}
            sx={{
              px: 2,
              fontWeight: 600,
              minWidth: "80px",
            }}
            startDecorator={
              isAdding ? (
                <CircularProgress size="sm" />
              ) : (
                <AddIcon fontSize="small" />
              )
            }
          >
            {isAdding ? "Adding" : "Add"}
          </Button>
        </Box>

        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 4,
              backgroundColor: "var(--joy-palette-background-level1)",
              borderRadius: "md",
              mb: 3,
            }}
          >
            <CircularProgress size="md" />
            <Typography
              level="body-sm"
              sx={{ ml: 2, color: "var(--joy-palette-text-secondary)" }}
            >
              Loading currencies...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 320, overflowY: "auto", mb: 2 }}>
            <Table
              sx={{
                "& th": {
                  backgroundColor: "var(--joy-palette-background-level2)",
                  color: "var(--joy-palette-text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                },
                "& tr:nth-child(even)": {
                  backgroundColor: "var(--joy-palette-background-level1)",
                },
                "& td": {
                  padding: "12px 16px",
                  fontSize: "0.875rem",
                },
                "--TableCell-height": "48px",
                borderRadius: "md",
                overflow: "hidden",
                border: "1px solid var(--joy-palette-divider)",
              }}
            >
              <thead>
                <tr>
                  <th>Currency Code</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((cur) => (
                  <tr key={cur.id}>
                    <td style={{ fontWeight: 500 }}>
                      {editing?.id === cur.id ? (
                        <Input
                          value={editCode}
                          onChange={(e) =>
                            setEditCode(e.target.value.toUpperCase())
                          }
                          size="sm"
                          variant="outlined"
                          sx={{
                            "--Input-focusedInset": "0px",
                            "--Input-focusedThickness": "2px",
                          }}
                        />
                      ) : (
                        cur.code
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {editing?.id === cur.id ? (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            size="sm"
                            onClick={handleEdit}
                            variant="soft"
                            color="success"
                            sx={{ fontWeight: 600 }}
                            startDecorator={<SaveIcon fontSize="small" />}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setEditing(null)}
                            variant="plain"
                            color="neutral"
                            sx={{ fontWeight: 500 }}
                            startDecorator={<CloseIcon fontSize="small" />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditing(cur);
                              setEditCode(cur.code);
                            }}
                            variant="plain"
                            color="primary"
                            sx={{ fontWeight: 500 }}
                            startDecorator={<EditIcon fontSize="small" />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            onClick={() => handleDelete(cur.id)}
                            variant="soft"
                            disabled={isDeleting === String(cur.id)}
                            sx={{ fontWeight: 500, minWidth: "70px" }}
                            startDecorator={
                              isDeleting === String(cur.id) ? (
                                <CircularProgress size="sm" />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )
                            }
                          >
                            {isDeleting === String(cur.id)
                              ? "Deleting"
                              : "Delete"}
                          </Button>
                        </Box>
                      )}
                    </td>
                  </tr>
                ))}
                {currencies.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "var(--joy-palette-text-tertiary)",
                      }}
                    >
                      No currencies found. Add your first currency above.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Box>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="neutral"
            onClick={() => setOpen(false)}
            sx={{ fontWeight: 600 }}
          >
            Close
          </Button>
        </Box>
      </Sheet>
    </Modal>
  );
};

export default CurrencyModal;
