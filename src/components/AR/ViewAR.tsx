import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Table,
  Sheet,
  Input,
  Select,
  Option,
  FormControl,
  FormLabel,
} from "@mui/joy";
import axiosInstance, { getCompanyId } from "../../utils/axiosConfig";
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
import { StatusChip } from "../../utils/statusUtils";

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
  const [isPrinting, setIsPrinting] = useState(false);
  const companyId = getCompanyId();

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

    const payload: PaginationQueryParams = {
      page: value,
      limit: PAGE_LIMIT,
      sort_by: "id",
      sort_order: "desc",
      search_term: searchTerm,
    };

    if (status !== "all") {
      payload.status = status;
    }

    axiosInstance
      .get<PaginatedAR>(`/api/ar-receipts/?${convertToQueryParams(payload)}`)
      .then((response) => setARs(response.data))
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      getAllAR();
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // 💨 cancel if any dep changes
  }, [searchTerm, status, paymentStatus]);

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
    setIsPrinting(true);
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
        setIsPrinting(false);
        generatePDF(data, total, companyId);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsPrinting(false);
      });
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
          <h2>AR Receipts</h2>
          <div>
            <Button
              variant="soft"
              className="mt-2 bg-button-soft-primary"
              sx={{ width: 140 }}
              onClick={handleGeneratePDF}
              loading={isPrinting}
            >
              Print Summary
            </Button>
            <Button
              className="mt-2 bg-button-primary"
              sx={{
                ml: 2,
                width: 140,
              }}
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
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              placeholder="Rec No. / Check No. / Remarks"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>
          <FormControl sx={{ ml: 2 }}>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Status</FormLabel>
            <Select
              sx={{ width: 130 }}
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
          </FormControl>
          <FormControl sx={{ ml: 2 }}>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>
              Payment Status
            </FormLabel>
            <Select
              sx={{ width: 130 }}
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
          </FormControl>
          {/* <Button
            onClick={getAllAR}
            sx={{
              ml: 2,
              width: "80px",
            }}
            className="bg-button-primary"
            size="sm"
          >
            Search
          </Button> */}
        </Box>

        <Sheet
          sx={{
            "--TableCell-height": "40px",
            // the number is the amount of the header rows.
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "100px",
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
                zIndex: 10,
              },
              "& tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "var(--TableCell-headBackground)",
                zIndex: 10,
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
                <th style={{ width: 120 }}>Tx. Date</th>
                <th style={{ width: 250 }}>Customer</th>
                <th style={{ width: 150 }}>Check No.</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 150 }}>Payment Status</th>
                <th style={{ width: 100 }}>Method</th>
                <th style={{ width: 200 }}>Remarks</th>
                <th style={{ width: 150 }}>Created By</th>
                <th style={{ width: 150 }}>Modified By</th>
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
                  <td>{AR.transaction_date}</td>
                  <td>{AR.customer.name}</td>
                  <td>{AR.reference_number}</td>
                  <td>
                    <StatusChip status={AR.status} />
                  </td>
                  <td className="capitalize">{AR.payment_status}</td>
                  <td className="capitalize">{AR.payment_method}</td>
                  <td>{AR.remarks}</td>
                  <td>{AR?.creator?.username}</td>
                  <td>{AR?.modifier?.username}</td>
                  <td>{AR.date_created}</td>
                  <td>{AR.date_modified}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        sx={{ minWidth: 60 }}
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
