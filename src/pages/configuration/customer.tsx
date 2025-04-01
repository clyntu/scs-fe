import { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import { Input } from "@mui/joy";
import CustomersModal from "../../components/Customers/CustomersModal";
import axiosInstance from "../../utils/axiosConfig";
import type { User } from "../Login";
import { toast } from "react-toastify";
import { Pagination } from "@mui/material";

import type { Customer, PaginatedCustomers } from "../../interface";

import { convertToQueryParams } from "../../helper";
import DeleteCustomersModal from "../../components/Customers/DeleteCustomersModal";

const PAGE_LIMIT = 10;

const CustomerForm = (): JSX.Element => {
  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Customer>();
  const [userId, setUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);

  const getAllCustomers = (page: number, search_term: string) => {
    axiosInstance
      .get<PaginatedCustomers>(
        `/api/customers/?${convertToQueryParams({
          page,
          limit: PAGE_LIMIT,
          sort_by: "customer_id",
          sort_order: "desc",
          search_term,
        })}`,
      )
      .then((response) => setCustomers(response.data))
      .catch((error) => console.error("Error:", error));
  };

  const changePage = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ): void => {
    setPage(value);
    getAllCustomers(value, searchTerm);
  };

  useEffect(() => {
    // Fetch customers
    getAllCustomers(page, searchTerm);

    // Fetch user ID
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error("Error fetching user ID:", error));
  }, []);

  const handleSaveCustomer = async (newCustomer: Customer): Promise<void> => {
    const url = `/api/customers/${newCustomer.customer_id}`;

    const payload = {
      customer_id: newCustomer.customer_id,
      code: newCustomer.code,
      name: newCustomer.name,
      building_address: newCustomer.building_address,
      street_address: newCustomer.street_address,
      city: newCustomer.city,
      province: newCustomer.province,
      country: newCustomer.country,
      zip_code: newCustomer.zip_code,
      contact_person: newCustomer.contact_person,
      contact_number: newCustomer.contact_number,
      email: newCustomer.email,
      fax_number: newCustomer.fax_number,
      currency: newCustomer.currency,
      discount_rate: newCustomer.discount_rate,
      customer_balance: newCustomer.customer_balance,
      modified_by: userId,
      notes: newCustomer.notes,
    };

    const response = await axiosInstance.put(url, payload);
    setCustomers((prevCustomers) => ({
      ...prevCustomers,
      items: prevCustomers.items.map((customer) =>
        customer.customer_id === response.data.customer_id
          ? response.data
          : customer,
      ),
    }));

    toast.success("Save successful!");
  };

  const handleCreateCustomer = async (newCustomer: Customer): Promise<void> => {
    const payload = {
      code: newCustomer.code,
      name: newCustomer.name,
      building_address: newCustomer.building_address,
      street_address: newCustomer.street_address,
      city: newCustomer.city,
      province: newCustomer.province,
      country: newCustomer.country,
      zip_code: newCustomer.zip_code,
      contact_person: newCustomer.contact_person,
      contact_number: newCustomer.contact_number,
      email: newCustomer.email,
      fax_number: newCustomer.fax_number,
      currency: newCustomer.currency,
      discount_rate: newCustomer.discount_rate,
      customer_balance: newCustomer.customer_balance,
      created_by: userId,
      notes: newCustomer.notes,
    };
    const response = await axiosInstance.post("/api/customers/", payload);

    setCustomers((prevCustomers) => ({
      ...prevCustomers,
      items: [response.data, ...prevCustomers.items],
      total: prevCustomers.total + 1,
    }));

    toast.success("Save successful!");
  };

  const handleDeleteCustomer = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/customers/${selectedRow.customer_id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
        setCustomers((prevCustomers) => ({
          ...prevCustomers,
          items: prevCustomers.items.filter(
            (customer) => customer.customer_id !== selectedRow.customer_id,
          ),
          total: prevCustomers.total - 1,
        }));
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box className="flex justify-between mb-6">
          <h2>Customers</h2>
          <Button
            className="mt-2 mb-4 bg-button-primary"
            color="primary"
            onClick={() => {
              setOpenAdd(true);
            }}
          >
            Add Customers
          </Button>
        </Box>

        <Box className="flex items-center mb-6">
          <Input
            size="sm"
            placeholder="Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            onClick={() => getAllCustomers(1, searchTerm)}
            className="ml-4 w-[80px] bg-button-primary"
            size="sm"
          >
            Search
          </Button>
        </Box>
        <Sheet
          sx={{
            "--TableCell-height": "40px",
            // the number is the amount of the header rows.
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "150px",
            "--Table-lastColumnWidth": "144px",
            // background needs to have transparency to show the scrolling shadows
            "--TableRow-stripeBackground": "rgba(0 0 0 / 0.04)",
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.08)",
            overflow: "auto",
            borderRadius: 8,
            background: (
              theme,
            ) => `linear-gradient(to right, ${theme.vars.palette.background.surface} 30%, rgba(255, 255, 255, 0)),
            linear-gradient(to right, rgba(255, 255, 255, 0), ${theme.vars.palette.background.surface} 70%) 0 100%,
            radial-gradient(
              farthest-side at 0 50%,
              rgba(0, 0, 0, 0.12),
              rgba(0, 0, 0, 0)
            ),
            radial-gradient(
                farthest-side at 100% 50%,
                rgba(0, 0, 0, 0.12),
                rgba(0, 0, 0, 0)
              )
              0 100%`,
            backgroundSize:
              "40px calc(100% - var(--TableCell-height)), 40px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height))",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local, local, scroll, scroll",
            backgroundPosition:
              "var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height), var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height)",
            backgroundColor: "background.surface",
            maxHeight: "600px",
          }}
        >
          <Table
            className="h-5"
            sx={{
              "& tr > *:first-child": {
                position: "sticky",
                left: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.surface",
              },
              "& tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "var(--TableCell-headBackground)",
              },
              "& tbody tr:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.015)", // Add hover effect
                cursor: "pointer", // Change cursor on hover
              },
            }}
            borderAxis="both"
          >
            <thead>
              <tr>
                <th style={{ width: "var(--Table-firstColumnWidth)" }}>Code</th>
                <th style={{ width: 300 }}>Name</th>
                <th style={{ width: 300 }}>Building Address</th>
                <th style={{ width: 300 }}>Street Address</th>
                <th style={{ width: 150 }}>City</th>
                <th style={{ width: 150 }}>Province</th>
                <th style={{ width: 150 }}>Country</th>
                <th style={{ width: 100 }}>Zip Code</th>
                <th style={{ width: 150 }}>Contact Person</th>
                <th style={{ width: 150 }}>Contact Number</th>
                <th style={{ width: 300 }}>Contact Email</th>
                <th style={{ width: 150 }}>Fax Number</th>
                <th style={{ width: 100 }}>Currency</th>
                <th style={{ width: 100 }}>Discount Rate</th>
                <th style={{ width: 100 }}>Customer Balance</th>
                <th style={{ width: 200 }}>Created By</th>
                <th style={{ width: 250 }}>Date Created</th>
                <th style={{ width: 200 }}>Modified By</th>
                <th style={{ width: 250 }}>Date Modified</th>
                <th
                  aria-label="last"
                  style={{ width: "var(--Table-lastColumnWidth)" }}
                />
              </tr>
            </thead>
            <tbody>
              {customers.items.map((customer) => (
                <tr
                  key={customer.customer_id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(customer);
                  }}
                >
                  <td>{customer.code}</td>
                  <td>{customer.name}</td>
                  <td>{customer.building_address}</td>
                  <td>{customer.street_address}</td>
                  <td>{customer.city}</td>
                  <td>{customer.province}</td>
                  <td>{customer.country}</td>
                  <td>{customer.zip_code}</td>
                  <td>{customer.contact_person}</td>
                  <td>{customer.contact_number}</td>
                  <td>{customer.email}</td>
                  <td>{customer.fax_number}</td>
                  <td>{customer.currency}</td>
                  <td>{customer.discount_rate}</td>
                  <td>{customer.customer_balance}</td>
                  <td>{customer?.creator?.full_name}</td>
                  <td>{customer.date_created}</td>
                  <td>{customer?.modifier?.full_name}</td>
                  <td>{customer.date_modified}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(customer);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(customer);
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Sheet>
      </Box>
      <Box className="flex align-center justify-end">
        <Pagination
          count={Math.floor(customers.total / PAGE_LIMIT) + 1}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>
      <CustomersModal
        open={openAdd}
        setOpen={setOpenAdd}
        title="Add Customers"
        onSave={handleCreateCustomer}
      />
      <CustomersModal
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Customers"
        row={selectedRow}
        onSave={handleSaveCustomer}
      />
      <DeleteCustomersModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Customers"
        onDelete={handleDeleteCustomer}
      />
    </>
  );
};

export default CustomerForm;
