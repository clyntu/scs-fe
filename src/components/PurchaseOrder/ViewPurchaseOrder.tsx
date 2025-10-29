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
import axiosInstance from "../../utils/axiosConfig";
import DeletePurchaseOrderModal from "./DeletePurchaseOrderModal";
import CancelTransactionModal from "../shared/CancelTransactionModal";
import { withTooltip } from "../shared/withTooltip";
import { toast } from "react-toastify";
import type {
  ViewPurchaseOrderProps,
  PaginatedPO,
  PaginationQueryParams,
} from "../../interface";

import { Pagination } from "@mui/material";

import {
  convertToQueryParams,
  addCommaToNumberWithTwoPlaces,
  formatToDate,
} from "../../helper";
import { StatusChip, canCancelTransaction } from "../../utils/statusUtils";

const PAGE_LIMIT = 10;

const ViewPurchaseOrder = ({
  setOpenCreate,
  setOpenEdit,
  selectedRow,
  setSelectedRow,
}: ViewPurchaseOrderProps): JSX.Element => {
  const [purchaseOrders, setPurchaseOrders] = useState<PaginatedPO>({
    total: 0,
    items: [],
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const getAllPO = (): void => {
    const payload: PaginationQueryParams = {
      page: 1,
      limit: PAGE_LIMIT,
      sort_by: "transaction_date",
      sort_order: "asc",
      search_term: searchTerm,
    };

    if (status !== "all") {
      payload.status = status;
    }

    axiosInstance
      .get<PaginatedPO>(
        `/api/purchase_orders/?${convertToQueryParams(payload)}`,
      )
      .then((response) => {
        setPurchaseOrders(response.data);
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
      sort_by: "transaction_date",
      sort_order: "asc",
      search_term: searchTerm,
    };

    if (status !== "all") {
      payload.status = status;
    }

    axiosInstance
      .get<PaginatedPO>(
        `/api/purchase_orders/?${convertToQueryParams(payload)}`,
      )
      .then((response) => {
        setPurchaseOrders(response.data);
      })
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      getAllPO();
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // 💨 cancel if any dep changes
  }, [searchTerm, status]);

  const handleDeletePurchaseOrder = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/purchase_orders/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Archive successful!");
        setPurchaseOrders((prevPO) => ({
          ...prevPO,
          items: prevPO.items.map((PO) =>
            PO.id === selectedRow.id ? { ...PO, status: "archived" } : PO,
          ),
          total: prevPO.total,
        }));
      } catch (error: any) {
        toast.error(`Error message: ${error.response.data.detail}`);
      }
    }
  };

  const handleCancelPurchaseOrder = async (reason: string): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/purchase_orders/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url, {
          data: { cancellation_reason: reason },
        });
        toast.success("Purchase Order cancelled successfully!");
        setPurchaseOrders((prevPO) => ({
          ...prevPO,
          items: prevPO.items.map((PO) =>
            PO.id === selectedRow.id ? { ...PO, status: "cancelled" } : PO,
          ),
          total: prevPO.total,
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
          <h2>Purchase Order</h2>
          <Button
            className="mt-2 bg-button-primary"
            color="primary"
            onClick={() => {
              setOpenCreate(true);
            }}
          >
            Add Purchase Order
          </Button>
        </Box>
        <Box className="flex items-center mb-6">
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              placeholder="Ref No. or Remarks"
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
              <Option value="cancelled">Cancelled</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </FormControl>
          {/* <Button
            onClick={getAllPO}
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
                  PO No.
                </th>
                <th style={{ width: 120 }}>Tx. Date</th>
                <th style={{ width: 300 }}>Supplier</th>
                <th style={{ width: 180 }}>Ref No.</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 130 }}>Net Amount</th>
                <th style={{ width: 130 }}>FOB Total</th>
                <th style={{ width: 130 }}>Landed Total</th>
                <th style={{ width: 150 }}>Currency Used</th>
                <th style={{ width: 150 }}>Peso Rate</th>
                <th style={{ width: 200 }}>Remarks</th>
                <th style={{ width: 150 }}>Created By</th>
                <th style={{ width: 150 }}>Modified By</th>
                <th style={{ width: 120 }}>Date Created</th>
                <th style={{ width: 120 }}>Date Modified</th>
                <th
                  aria-label="last"
                  style={{ width: "var(--Table-lastColumnWidth)" }}
                />
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.items.map((purchaseOrder) => (
                <tr
                  key={purchaseOrder.id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(purchaseOrder);
                  }}
                >
                  <td>{purchaseOrder.id}</td>
                  <td>{purchaseOrder.transaction_date}</td>
                  <td>{withTooltip(purchaseOrder?.supplier?.name, "280px")}</td>
                  <td>
                    {withTooltip(purchaseOrder.reference_number, "160px")}
                  </td>
                  <td>
                    <StatusChip status={purchaseOrder.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {addCommaToNumberWithTwoPlaces(purchaseOrder.net_amount)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {addCommaToNumberWithTwoPlaces(purchaseOrder.fob_total)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {addCommaToNumberWithTwoPlaces(purchaseOrder.landed_total)}
                  </td>
                  <td>{purchaseOrder.currency_used}</td>
                  <td style={{ textAlign: "right" }}>
                    {purchaseOrder.peso_rate}
                  </td>
                  <td>{withTooltip(purchaseOrder.remarks, "180px")}</td>
                  <td>
                    {withTooltip(purchaseOrder?.creator?.username, "130px")}
                  </td>
                  <td>
                    {withTooltip(purchaseOrder?.modifier?.username, "130px")}
                  </td>
                  <td>{formatToDate(purchaseOrder.date_created)}</td>
                  <td>{formatToDate(purchaseOrder.date_modified)}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        sx={{ minWidth: 60 }}
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(purchaseOrder);
                        }}
                      >
                        {purchaseOrder.status !== "unposted" ? "View" : "Edit"}
                      </Button>

                      {canCancelTransaction(purchaseOrder.status) && (
                        <Button
                          size="sm"
                          variant="soft"
                          color="warning"
                          onClick={() => {
                            setOpenCancel(true);
                            setSelectedRow(purchaseOrder);
                          }}
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(purchaseOrder);
                        }}
                        disabled={purchaseOrder.status !== "unposted"}
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
          count={Math.ceil(purchaseOrders.total / PAGE_LIMIT)}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>
      <DeletePurchaseOrderModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Archive Purchase Order"
        onDelete={handleDeletePurchaseOrder}
      />
      <CancelTransactionModal
        open={openCancel}
        setOpen={setOpenCancel}
        title="Cancel Purchase Order"
        transactionType="Purchase Order"
        transactionId={selectedRow?.id ?? ""}
        onCancel={handleCancelPurchaseOrder}
      />
    </>
  );
};

export default ViewPurchaseOrder;
