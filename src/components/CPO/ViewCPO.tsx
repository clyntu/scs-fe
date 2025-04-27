import { useEffect, useState } from "react";
import { Box, Button, Table, Sheet, Input, Select, Option } from "@mui/joy";
import axiosInstance from "../../utils/axiosConfig";
import DeleteCPOModal from "./DeleteCPOModal";
import { toast } from "react-toastify";
import type {
  ViewCPOProps,
  PaginatedCPO,
  PaginationQueryParams,
} from "../../interface";

import { Pagination } from "@mui/material";

import {
  convertToQueryParams,
  addCommaToNumberWithFourPlaces,
} from "../../helper";

const PAGE_LIMIT = 10;

const ViewCPO = ({
  setOpenCreate,
  setOpenEdit,
  selectedRow,
  setSelectedRow,
}: ViewCPOProps): JSX.Element => {
  const [CPOs, setCPOs] = useState<PaginatedCPO>({
    total: 0,
    items: [],
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const getAllPO = (): void => {
    const payload: PaginationQueryParams = {
      page: 1,
      limit: PAGE_LIMIT,
      sort_by: "id",
      sort_order: "desc",
      search_term: searchTerm,
    };

    if (status !== "all") {
      payload.status = status;
    }

    axiosInstance
      .get<PaginatedCPO>(
        `/api/customer_purchase_orders/?${convertToQueryParams(payload)}`,
      )
      .then((response) => {
        setCPOs(response.data);
        setPage(1);
      })
      .catch((error) => console.error("Error:", error));
  };

  const changePage = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ): void => {
    setPage(value);
    axiosInstance
      .get<PaginatedCPO>(
        `/api/customer_purchase_orders/?${convertToQueryParams({
          page: value,
          limit: PAGE_LIMIT,
          sort_by: "id",
          sort_order: "desc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => setCPOs(response.data))
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    // Fetch purchase orders
    getAllPO();
  }, []);

  const handleDeleteCPO = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/customer_purchase_orders/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Archive successful!");
        setCPOs((prevCPO) => ({
          ...prevCPO,
          items: prevCPO.items.map((CPO) =>
            CPO.id === selectedRow.id ? { ...CPO, status: "archived" } : CPO,
          ),
          total: prevCPO.total,
        }));
      } catch (error: any) {
        toast.error(`Error message: ${error.response.data.detail}`);
      }
    }
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            mb: 4,
          }}
          className="flex justify-between"
        >
          <h2>Customer Purchase Order</h2>
          <Button
            className="mt-2 mb-4 bg-button-primary"
            color="primary"
            onClick={() => {
              setOpenCreate(true);
            }}
          >
            Add Customer Purchase Order
          </Button>
        </Box>
        <Box className="flex items-center mb-6">
          <Input
            size="sm"
            placeholder="Ref No."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            className="ml-4 w-[130px]"
            onChange={(event, value) => {
              if (value !== null) setStatus(value);
            }}
            size="sm"
            value={status}
          >
            <Option value="all">All</Option>
            <Option value="posted">Posted</Option>
            <Option value="unposted">Unposted</Option>
            <Option value="archived">Archived</Option>
          </Select>
          <Button
            onClick={getAllPO}
            sx={{
              ml: 2,
              width: "80px",
            }}
            className="bg-button-primary"
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
            "--Table-lastColumnWidth": "160px",
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
                <th style={{ width: "var(--Table-firstColumnWidth)" }}>
                  PO No.
                </th>
                <th style={{ width: 200 }}>Ref No.</th>
                <th style={{ width: 150 }}>Status</th>
                <th style={{ width: 300 }}>Customer</th>
                <th style={{ width: 250 }}>Transaction Date</th>
                <th style={{ width: 150 }}>Price Level</th>
                <th style={{ width: 150 }}>Gross Total</th>
                <th style={{ width: 150 }}>Net Total</th>
                <th style={{ width: 300 }}>Remarks</th>
                <th style={{ width: 200 }}>Created By</th>
                <th style={{ width: 200 }}>Modified By</th>
                <th style={{ width: 250 }}>Date Created</th>
                <th style={{ width: 250 }}>Date Modified</th>
                <th
                  aria-label="last"
                  style={{ width: "var(--Table-lastColumnWidth)" }}
                />
              </tr>
            </thead>
            <tbody>
              {CPOs.items.map((CPO) => (
                <tr
                  key={CPO.id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(CPO);
                  }}
                >
                  <td>{CPO.id}</td>
                  <td>{CPO.reference_number}</td>
                  <td className="capitalize">{CPO.status}</td>
                  <td>{CPO?.customer?.name}</td>
                  <td>{CPO.transaction_date}</td>
                  <td>{CPO.price_level}</td>
                  <td>{addCommaToNumberWithFourPlaces(CPO.gross_total)}</td>
                  <td>{addCommaToNumberWithFourPlaces(CPO.net_total)}</td>
                  <td>{CPO.remarks}</td>
                  <td>{CPO?.creator?.username}</td>
                  <td>{CPO?.modifier?.username}</td>
                  <td>{CPO.date_created}</td>
                  <td>{CPO.date_modified}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        className="w-[80px]"
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(CPO);
                        }}
                      >
                        {CPO.status !== "unposted" ? "View" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(CPO);
                        }}
                        disabled={CPO.status !== "unposted"}
                      >
                        Archive
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
          count={Math.ceil(CPOs.total / PAGE_LIMIT)}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>
      <DeleteCPOModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Archive Customer Purchase Order"
        onDelete={handleDeleteCPO}
      />
    </>
  );
};

export default ViewCPO;
