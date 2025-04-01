import { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import { Input } from "@mui/joy";
import WarehousesModal from "../../components/Warehouses/WarehousesModal";
import DeleteWarehousesModal from "../../components/Warehouses/DeleteWarehouseModal";
import ViewWHModal from "../../components/Items/ViewWHModal";
import axiosInstance from "../../utils/axiosConfig";
import type { User } from "../Login";
import { toast } from "react-toastify";
import { Pagination } from "@mui/material";

import type { Warehouse, PaginatedWarehouse } from "../../interface";

import { convertToQueryParams } from "../../helper";

const PAGE_LIMIT = 10;

const WarehouseForm = (): JSX.Element => {
  const [openWH, setOpenWH] = useState(false);
  const [warehouses, setWarehouses] = useState<PaginatedWarehouse>({
    total: 0,
    items: [],
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Warehouse>();
  const [userId, setUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const getAllWarehouse = (page: number, search_term: string) => {
    axiosInstance
      .get<PaginatedWarehouse>(
        `/api/warehouses/?${convertToQueryParams({
          page,
          limit: PAGE_LIMIT,
          sort_by: "id",
          sort_order: "desc",
          search_term,
        })}`,
      )
      .then((response) => setWarehouses(response.data))
      .catch((error) => console.error("Error:", error));
  };

  const changePage = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ): void => {
    setPage(value);
    getAllWarehouse(value, searchTerm);
  };

  useEffect(() => {
    // Fetch warehouses
    getAllWarehouse(page, searchTerm);
    // Fetch user ID
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error("Error fetching user ID:", error));
  }, []);

  const handleSaveWarehouse = async (
    newWarehouse: Warehouse,
  ): Promise<void> => {
    const url = `/api/warehouses/${newWarehouse.id}`;

    const payload = {
      name: newWarehouse.name,
      type: newWarehouse.type,
      modified_by: userId,
      id: newWarehouse.id,
      code: newWarehouse.code,
    };

    const response = await axiosInstance.put(url, payload);
    setWarehouses((prevWarehouse) => ({
      ...prevWarehouse,
      items: prevWarehouse.items.map((warehouse) =>
        warehouse.id === response.data.id ? response.data : warehouse,
      ),
    }));

    toast.success("Save successful!");
  };

  const handleCreateWarehouse = async (
    newWarehouse: Warehouse,
  ): Promise<void> => {
    const payload = {
      id: newWarehouse.id,
      name: newWarehouse.name,
      type: newWarehouse.type,
      created_by: userId,
      code: newWarehouse.code,
    };

    const response = await axiosInstance.post("/api/warehouses/", payload);

    setWarehouses((prevWarehouse) => ({
      ...prevWarehouse,
      items: [response.data, ...prevWarehouse.items],
      total: prevWarehouse.total + 1,
    }));

    toast.success("Save successful!");
  };

  const handleDeleteWarehouse = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/warehouses/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
        setWarehouses((prevWarehouse) => ({
          ...prevWarehouse,
          items: prevWarehouse.items.filter(
            (warehouse) => warehouse.id !== selectedRow.id,
          ),
          total: prevWarehouse.total - 1,
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
          <h2>Warehouses</h2>
          <Button
            className="mt-2 mb-4 bg-button-primary"
            color="primary"
            onClick={() => {
              setOpenAdd(true);
            }}
          >
            Add Warehouse
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
            onClick={() => getAllWarehouse(1, searchTerm)}
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
            "--Table-lastColumnWidth": "230px",
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
                <th style={{ width: 100 }}>Type</th>
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
              {warehouses.items.map((warehouse) => (
                <tr
                  key={warehouse.id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(warehouse);
                  }}
                >
                  <td>{warehouse.code}</td>
                  <td>{warehouse.name}</td>
                  <td>{warehouse.type}</td>
                  <td>{warehouse?.creator?.username}</td>
                  <td>{warehouse.date_created}</td>
                  <td>{warehouse?.modifier?.username}</td>
                  <td>{warehouse.date_modified}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="sm"
                        variant="plain"
                        color="primary"
                        className="bg-primary"
                        onClick={() => {
                          setOpenWH(true);
                          setSelectedRow(warehouse);
                        }}
                      >
                        Stocks
                      </Button>
                      <Button
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(warehouse);
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
                          setSelectedRow(warehouse);
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
          count={Math.floor(warehouses.total / PAGE_LIMIT) + 1}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>
      <WarehousesModal
        open={openAdd}
        setOpen={setOpenAdd}
        title="Add Warehouses"
        onSave={handleCreateWarehouse}
      />
      <WarehousesModal
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Warehouse"
        row={selectedRow}
        onSave={handleSaveWarehouse}
      />
      <DeleteWarehousesModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Warehouse"
        onDelete={handleDeleteWarehouse}
      />
      <ViewWHModal
        open={openWH}
        setOpen={setOpenWH}
        row={selectedRow}
        type="warehouse"
      />
    </>
  );
};

export default WarehouseForm;
