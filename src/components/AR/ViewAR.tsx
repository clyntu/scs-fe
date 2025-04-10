import { useEffect, useState } from "react";
import { Box, Button, Table, Sheet, Input, Select, Option } from "@mui/joy";
import axiosInstance from "../../utils/axiosConfig";
import DeleteARModal from "./DeleteARModal";
import { toast } from "react-toastify";
import type {
  ViewARProps,
  PaginatedAR,
  PaginationQueryParams,
} from "../../interface";
import { generatePDF } from "./generatePDF";

import { Pagination } from "@mui/material";

import { convertToQueryParams } from "../../helper";
import { CustomerReceivableResponse } from "./interface";

const PAGE_LIMIT = 10;

const ViewAR = ({
  setOpenCreate,
  setOpenEdit,
  selectedRow,
  setSelectedRow,
}: ViewARProps): JSX.Element => {
  const [ARs, setARs] = useState<PaginatedAR>({
    total: 0,
    items: [],
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [page, setPage] = useState(1);

  const getAllAR = (): void => {
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

    if (paymentStatus !== "all") {
      payload.payment_status = paymentStatus;
    }

    axiosInstance
      .get<PaginatedAR>(`/api/ar-receipts/?${convertToQueryParams(payload)}`)
      .then((response) => {
        setARs(response.data);
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
      .get<PaginatedAR>(
        `/api/ar-receipts/?${convertToQueryParams({
          page: value,
          limit: PAGE_LIMIT,
          sort_by: "id",
          sort_order: "desc",
          search_term: searchTerm,
        })}`,
      )
      .then((response) => setARs(response.data))
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    // Process uncleared receipts that are beyond clear date
    // Fetch ARs after
    axiosInstance
      .post("/api/ar-receipts/process-check-clearing/")
      .then((response) => getAllAR())
      .catch((error) => console.error("Error:", error));
  }, []);

  const handleDeleteAR = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/ar-receipts/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Archive successful!");

        // Only allow delete for unposted, it should hard delete
        setARs((prevAR) => ({
          ...prevAR,
          items: prevAR.items.filter((AR) => AR.id !== selectedRow.id),
          total: prevAR.total - 1,
        }));
      } catch (error: any) {
        toast.error(
          `Error message: ${error?.response?.data?.detail?.[0]?.msg || error?.response?.data?.detail}`,
        );
        return;
      }
    }
  };

  const handleGeneratePDF = () => {
    // Fetch data
    axiosInstance
      .get<CustomerReceivableResponse>(
        `/customer-financial/receivables?${convertToQueryParams({
          sort_by: "customer_name",
          sort_order: "asc",
        })}`,
      )
      .then((response) => {
        const res = response.data;
        const total = {
          total_receivable: res.total_receivable,
          total_uncleared: res.total_uncleared,
          total_bounced: res.total_bounced,
        };
        const customers = res.items;
        const data = customers.map((customer) => {
          return {
            customer_name: customer.customer_name,
            amount_receivable: customer.amount_receivable,
            uncleared_payment: customer.uncleared_payment,
            bounced_payment: customer.bounced_payment,
          };
        });
        generatePDF(data, total, "Peterson Parts Trading Inc.");
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box className="flex justify-between mb-6">
          <h2>AR Receipts</h2>
          <div>
            <Button
              variant="soft"
              className="mt-2 mb-4 w-[140px] bg-button-soft-primary"
              onClick={handleGeneratePDF}
            >
              Print Summary
            </Button>
            <Button
              className="ml-3 mt-2 mb-4 bg-button-primary"
              color="primary"
              onClick={() => {
                setOpenCreate(true);
              }}
            >
              Add AR Receipt
            </Button>
          </div>
        </Box>
        <Box className="flex items-center mb-6">
          <Input
            size="sm"
            placeholder="Receipt No. / Ref No."
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
          </Select>
          <Select
            className="ml-4 w-[130px]"
            onChange={(event, value) => {
              if (value !== null) setPaymentStatus(value);
            }}
            size="sm"
            value={paymentStatus}
          >
            <Option value="all">All</Option>
            <Option value="pending">Pending</Option>
            <Option value="cleared">Cleared</Option>
            <Option value="reversed">Reversed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Button
            onClick={getAllAR}
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
                  Receipt No.
                </th>
                <th style={{ width: 150 }}>Ref No.</th>
                <th style={{ width: 150 }}>Status</th>
                <th style={{ width: 150 }}>Payment Status</th>
                <th style={{ width: 250 }}>Customer</th>
                <th style={{ width: 250 }}>Transaction Date</th>
                <th style={{ width: 250 }}>Payment Method</th>
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
              {ARs.items.map((AR) => (
                <tr
                  key={AR.id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(AR);
                  }}
                >
                  <td>{AR.id}</td>
                  <td>{AR.reference_number}</td>
                  <td className="capitalize">{AR.status}</td>
                  <td className="capitalize">{AR.payment_status}</td>
                  <td>{AR.customer.name}</td>
                  <td>{AR.transaction_date}</td>
                  <td className="capitalize">{AR.payment_method}</td>
                  <td>{AR.remarks}</td>
                  <td>{AR?.creator?.username}</td>
                  <td>{AR?.modifier?.username}</td>
                  <td>{AR.date_created}</td>
                  <td>{AR.date_modified}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        className="w-[80px]"
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(AR);
                        }}
                      >
                        {AR.status !== "unposted" ? "View" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(AR);
                        }}
                        disabled={AR.status !== "unposted"}
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
          count={Math.ceil(ARs.total / PAGE_LIMIT)}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>
      <DeleteARModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Archive Customer Return"
        onDelete={handleDeleteAR}
      />
    </>
  );
};

export default ViewAR;
