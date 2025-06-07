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
  Select,
  Option,
  Textarea,
} from "@mui/joy";
import { toast } from "react-toastify";
import type { SuppliersModalProps, Supplier, Currency } from "../../interface";
import axiosInstance from "../../utils/axiosConfig";

const SuppliersModal = ({
  open,
  title,
  setOpen,
  row,
  onSave,
}: SuppliersModalProps): JSX.Element => {
  const [isSaving, setIsSaving] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const generateSupplier = (): Supplier => {
    return {
      supplier_id: row?.supplier_id ?? 0,
      code: row?.code ?? "",
      name: row?.name ?? "",
      address: row?.address ?? "",
      contact_person: row?.contact_person ?? "",
      contact_number: row?.contact_number ?? "",
      email: row?.email ?? "",
      currency: row?.currency ?? "",
      supplier_balance: row?.supplier_balance,
      created_by: row?.created_by ?? 0,
      modified_by: row?.modified_by ?? 0,
      date_created: row?.date_created ?? "",
      date_modified: row?.date_modified ?? "",
      notes: row?.notes ?? "",
    };
  };

  const [supplier, setSupplier] = useState<Supplier>(generateSupplier());

  useEffect(() => {
    setSupplier(generateSupplier());
  }, [row]);

  useEffect(() => {
    axiosInstance
      .get<Currency[]>("/api/currencies")
      .then((response) => setCurrencies(response.data))
      .catch((error) => console.error("Error fetching currencies:", error));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value } = e.target;
    setSupplier({ ...supplier, [name]: value });
  };

  const handleSave = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(supplier);
      setSupplier(generateSupplier());
      setOpen(false);
      setIsSaving(false);
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
      setIsSaving(false);
    }
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
      setSupplier({ ...supplier, currency: value });
    }
  };

  return (
    <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        setSupplier(generateSupplier());
        setOpen(false);
      }}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <form onSubmit={async (e) => await handleSave(e)}>
        <Sheet
          variant="outlined"
          sx={{
            width: 800,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <Box>
            <h3 className="mb-6">{title}</h3>
            <Card className="w-[100%] mr-7">
              <div>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Code</FormLabel>
                    <Input
                      size="sm"
                      placeholder="ABC-123"
                      name="code"
                      value={supplier.code}
                      onChange={handleChange}
                      // required
                    />
                  </FormControl>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Name</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Name"
                      name="name"
                      value={supplier.name}
                      onChange={handleChange}
                      required
                    />
                  </FormControl>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <FormControl size="sm" sx={{ mb: 1, width: "100%" }}>
                    <FormLabel>Address</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Complete Address"
                      name="address"
                      value={supplier.address}
                      onChange={handleChange}
                      required
                    />
                  </FormControl>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Contact Person</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Contact Person"
                      name="contact_person"
                      value={supplier.contact_person}
                      onChange={handleChange}
                      // required
                    />
                  </FormControl>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Contact Number</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Contact Number"
                      name="contact_number"
                      value={supplier.contact_number}
                      onChange={handleChange}
                      // required
                    />
                  </FormControl>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Email (Optional)</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Email"
                      name="email"
                      value={supplier.email || ""}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      name="currency"
                      size="sm"
                      value={supplier?.currency}
                      onChange={handleSelectChange}
                      required
                    >
                      {currencies.map((currency) => (
                        <Option key={currency.id} value={currency.code}>
                          {currency.code}
                        </Option>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Supplier Balance</FormLabel>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="0"
                      name="supplier_balance"
                      value={supplier.supplier_balance || 0}
                      onChange={handleChange}
                      required
                    />
                  </FormControl>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <FormControl size="sm" sx={{ mb: 1, width: "100%" }}>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      size="sm"
                      minRows={1}
                      name="notes"
                      value={supplier.notes}
                      onChange={handleChange}
                    />
                  </FormControl>
                </Stack>
              </div>
            </Card>
            <div className="flex justify-end mt-5">
              <Button
                type="submit"
                sx={{ ml: 2, width: 130 }}
                className="bg-button-primary"
                size="sm"
                loading={isSaving}
              >
                Save
              </Button>
            </div>
          </Box>
        </Sheet>
      </form>
    </Modal>
  );
};

export default SuppliersModal;
