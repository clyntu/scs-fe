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
import { AVAILABLE_CURRENCIES } from "../../constants";
import { toast } from "react-toastify";

import type { Customer, CustomersModalProps } from "../../interface";

const CustomersModal = ({
  open,
  title,
  setOpen,
  row,
  onSave,
}: CustomersModalProps): JSX.Element => {
  const [isSaving, setIsSaving] = useState(false);
  const generateCustomer = (): Customer => {
    return {
      customer_id: row?.customer_id ?? 0,
      code: row?.code ?? "",
      name: row?.name ?? "",
      address: row?.address ?? "",
      contact_person: row?.contact_person ?? "",
      contact_number: row?.contact_number ?? "",
      email: row?.email ?? "",
      customer_balance: row?.customer_balance,
      created_by: row?.created_by ?? 0,
      modified_by: row?.modified_by ?? 0,
      date_created: row?.date_created ?? "",
      date_modified: row?.date_modified ?? "",
      notes: row?.notes ?? "",
    };
  };

  const [customer, setCustomer] = useState<Customer>(generateCustomer());

  useEffect(() => {
    setCustomer(generateCustomer());
  }, [row]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  const handleSave = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(customer);
      setCustomer(generateCustomer());
      setOpen(false);
      setIsSaving(false);
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
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
        setCustomer(generateCustomer());
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
                      value={customer.code}
                      onChange={handleChange}
                      required
                    />
                  </FormControl>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Name</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Name"
                      name="name"
                      value={customer.name}
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
                      value={customer.address}
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
                      value={customer.contact_person}
                      onChange={handleChange}
                      required
                    />
                  </FormControl>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Contact Number</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Contact Number"
                      name="contact_number"
                      value={customer.contact_number}
                      onChange={handleChange}
                      required
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
                      value={customer.email || ""}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormControl size="sm" sx={{ mb: 1, width: "48%" }}>
                    <FormLabel>Customer Balance</FormLabel>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="0"
                      name="customer_balance"
                      value={customer.customer_balance || 0}
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
                      minRows={5}
                      name="notes"
                      value={customer.notes}
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

export default CustomersModal;
