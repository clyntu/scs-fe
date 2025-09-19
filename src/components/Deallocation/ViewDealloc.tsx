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
import { toast } from "react-toastify";
import type {
  PaginatedDealloc,
  PaginationQueryParams,
  ViewDeallocProps,
} from "../../interface";

import { Pagination } from "@mui/material";

import { convertToQueryParams, formatToDate } from "../../helper";
import DeleteDeallocModal from "./DeleteDeallocModal";
import { StatusChip } from "../../utils/statusUtils";
import { withTooltip } from "../shared/withTooltip";

const PAGE_LIMIT = 10;

const ViewDealloc = ({
  setOpenCreate,
  setOpenEdit,
  selectedRow,
  setSelectedRow,
}: ViewDeallocProps): JSX.Element => {
  const [deallocs, setDeallocs] = useState<PaginatedDealloc>({
    total: 0,
    items: [],
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const getAllDealloc = (): void => {
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
      .get<PaginatedDealloc>(
        `/api/deallocations/?${convertToQueryParams(payload)}`,
      )
      .then((response) => {
        setDeallocs(response.data);
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
      .get<PaginatedDealloc>(
        `/api/deallocations/?${convertToQueryParams(payload)}`,
      )
      .then((response) => setDeallocs(response.data))
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      getAllDealloc();
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout); // 💨 cancel if any dep changes
  }, [searchTerm, status]);

  const handleDeleteDealloc = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/deallocations/${selectedRow.id}`;
      try {
        setDeallocs({
          items: deallocs.items.filter(
            (dealloc) => dealloc.id !== selectedRow.id,
          ),
          total: deallocs.total - 1,
        });
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
      } catch (error) {
        console.error("Error:", error);
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
          <h2>Deallocation</h2>
          <Button
            className="mt-2 bg-button-primary"
            color="primary"
            onClick={() => {
              setOpenCreate(true);
            }}
          >
            Add Deallocation
          </Button>
        </Box>
        <Box className="flex items-center mb-6">
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              placeholder="Dealloc No. or Remarks"
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
              <Option value="unposted">Unposted</Option>
              <Option value="posted">Posted</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </FormControl>
          {/* <Button
            onClick={getAllDealloc}
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
                  Dealloc No.
                </th>
                <th style={{ width: 120 }}>Tx. Date</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 80 }}>Alloc No.</th>
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
              {deallocs.items.map((dealloc) => (
                <tr
                  key={dealloc.id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(dealloc);
                  }}
                >
                  <td>{dealloc?.id}</td>
                  <td>{dealloc?.transaction_date}</td>
                  <td>
                    <StatusChip status={dealloc.status} />
                  </td>
                  <td>{dealloc?.allocation_id}</td>
                  <td>{withTooltip(dealloc?.remarks, "180px")}</td>
                  <td>{withTooltip(dealloc?.creator?.username, "130px")}</td>
                  <td>{withTooltip(dealloc?.modifier?.username, "130px")}</td>
                  <td>{formatToDate(dealloc.date_created)}</td>
                  <td>{formatToDate(dealloc.date_modified)}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        sx={{ width: "100px" }}
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(dealloc);
                        }}
                      >
                        {dealloc.status !== "unposted" ? "View" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(dealloc);
                        }}
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
          count={Math.ceil(deallocs.total / PAGE_LIMIT)}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>
      <DeleteDeallocModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Archive Deallocation"
        onDelete={handleDeleteDealloc}
      />
    </>
  );
};

export default ViewDealloc;
