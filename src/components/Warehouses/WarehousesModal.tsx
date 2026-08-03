import React, { useEffect, useState } from "react";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import {
  FormControl,
  FormLabel,
  Input,
  Card,
  Stack,
  Button,
  Box,
} from "@mui/joy";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { toast } from "react-toastify";
import type { Warehouse, WarehousesModalProps } from "../../interface";
import { getErrorMessage } from "../../helper";

const WarehousesModal = ({
  open,
  title,
  setOpen,
  row,
  onSave,
}: WarehousesModalProps): JSX.Element => {
  const [isSaving, setIsSaving] = useState(false);
  const generateWarehouse = (): Warehouse => {
    return {
      id: row?.id ?? 0,
      name: row?.name ?? "",
      code: row?.code ?? "",
      type: row?.type ?? "Stock",
      created_by: row?.created_by ?? 0,
      modified_by: row?.modified_by ?? 0,
      date_created: row?.date_created ?? "",
      date_modified: row?.date_modified ?? "",
    };
  };

  const [warehouse, setWarehouse] = useState<Warehouse>(generateWarehouse());

  useEffect(() => {
    setWarehouse(generateWarehouse());
  }, [row]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setWarehouse({ ...warehouse, [name]: value });
  };

  const handleSelectChange = (
    event:
      | React.MouseEvent<Element, MouseEvent>
      | React.KeyboardEvent<Element>
      | React.FocusEvent<Element, Element>
      | null,
    value: string | null,
  ): void => {
    if (value !== null) {
      setWarehouse({ ...warehouse, type: value });
    }
  };

  const handleSave = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(warehouse);
      setWarehouse(generateWarehouse());
      setOpen(false);
      setIsSaving(false);
    } catch (error: any) {
      toast.error(
        `Error message: ${getErrorMessage(error, "Save unsuccessful")}`,
      );
      setIsSaving(false);
    }
  };

  return (
    <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        setWarehouse(generateWarehouse());
        setOpen(false);
      }}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <form onSubmit={async (e) => await handleSave(e)}>
        <Sheet
          variant="outlined"
          sx={{
            width: "calc(100vw - 32px)",
            maxWidth: 500,
            maxHeight: "calc(100dvh - 32px)",
            overflowY: "auto",
            boxSizing: "border-box",
            borderRadius: "md",
            p: { xs: 2, sm: 3 },
            boxShadow: "lg",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <Box>
            <h3 className="mb-6">{title}</h3>
            <Card sx={{ width: "100%", boxSizing: "border-box" }}>
              <div>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mb: 1 }}
                >
                  <FormControl
                    size="sm"
                    sx={{ mb: 1, width: { xs: "100%", sm: "48%" } }}
                  >
                    <FormLabel>Code</FormLabel>
                    <Input
                      size="sm"
                      placeholder="ABC-123"
                      name="code"
                      value={warehouse.code}
                      onChange={handleChange}
                      required
                    />
                  </FormControl>
                  <FormControl
                    size="sm"
                    sx={{ mb: 1, width: { xs: "100%", sm: "48%" } }}
                  >
                    <FormLabel>Name</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Name"
                      name="name"
                      value={warehouse.name}
                      onChange={handleChange}
                      required
                    />
                  </FormControl>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mb: 1 }}
                >
                  <FormControl
                    size="sm"
                    sx={{ mb: 1, width: { xs: "100%", sm: "48%" } }}
                  >
                    <FormLabel>Type</FormLabel>
                    <Select
                      name="type"
                      value={warehouse.type}
                      size="sm"
                      onChange={handleSelectChange}
                    >
                      <Option value="Stock">Stock</Option>
                      <Option value="Receiving">Receiving</Option>
                      <Option value="Preparation">Preparation</Option>
                    </Select>
                  </FormControl>
                </Stack>
              </div>
            </Card>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="flex-end"
              sx={{ mt: 2.5 }}
            >
              <Button
                type="submit"
                sx={{ width: { xs: "100%", sm: 130 } }}
                className="bg-button-primary"
                size="sm"
                loading={isSaving}
              >
                Save
              </Button>
            </Stack>
          </Box>
        </Sheet>
      </form>
    </Modal>
  );
};

export default WarehousesModal;
