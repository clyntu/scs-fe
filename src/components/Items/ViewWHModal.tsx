import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import { Card, Box, Table, IconButton, Tooltip } from "@mui/joy";
import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosConfig";
import EditIcon from "@mui/icons-material/Edit";

import type {
  ViewWHModalProps,
  AggregatedWarehouseItem,
  PaginatedAggregatedWarehouseItems,
} from "../../interface";
import { withTooltip } from "../shared/withTooltip";
import StockAdjustmentModal from "./StockAdjustmentModal";

interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string;
  is_admin?: boolean;
}

const ViewWHModal = ({
  open,
  setOpen,
  row,
  type,
}: ViewWHModalProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseItems, setWarehouseItems] = useState<
    AggregatedWarehouseItem[]
  >([]);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<AggregatedWarehouseItem | null>(null);

  const isAdmin = currentUser?.is_admin === true;

  const handleOpenAdjustment = (item: AggregatedWarehouseItem): void => {
    setSelectedItem(item);
    setAdjustmentModalOpen(true);
  };

  const handleAdjustmentSuccess = (): void => {
    // Reload warehouse items after successful adjustment
    loadWarehouseItems();
  };

  const loadWarehouseItems = (): void => {
    if (row === undefined) return;

    setIsLoading(true);
    if (type === "warehouse") {
      axiosInstance
        .get<PaginatedAggregatedWarehouseItems>(
          `/api/warehouse_items/aggregated?warehouse_id=${row?.id}`,
        )
        .then((response) => {
          setWarehouseItems(response.data.items);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          setIsLoading(false);
        });
    } else if (type === "item") {
      axiosInstance
        .get<PaginatedAggregatedWarehouseItems>(
          `/api/warehouse_items/aggregated?stock_code=${row?.stock_code}`,
        )
        .then((response) => {
          setWarehouseItems(response.data.items);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          setIsLoading(false);
        });
    }
  };

  useEffect(() => {
    if (row === undefined) return;

    // Fetch current user to check admin status
    axiosInstance
      .get<UserResponse>("/api/users/me/")
      .then((response) => {
        setCurrentUser(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
      });

    // Load warehouse items
    loadWarehouseItems();
  }, [row]);

  return (
    <>
      <Modal
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          setOpen(false);
        }}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 1000,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <Box>
            <h3 className="mb-6">Stock Location</h3>
            <Card className="w-[100%] mr-7">
              <Sheet
                sx={{
                  "--TableCell-height": "40px",
                  // the number is the amount of the header rows.
                  "--TableHeader-height": "calc(1 * var(--TableCell-height))",
                  "--Table-firstColumnWidth": "250px",
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
            ),`,
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
                    "& tr > *:first-of-type": {
                      position: "sticky",
                      left: 0,
                      boxShadow: "1px 0 var(--TableCell-borderColor)",
                      bgcolor: "background.surface",
                    },
                  }}
                  borderAxis="both"
                >
                  {isLoading ? (
                    <tbody>
                      <tr>
                        <td
                          colSpan={isAdmin ? 6 : 5}
                          style={{ textAlign: "center" }}
                        >
                          <h5>Loading...</h5>
                        </td>
                      </tr>
                    </tbody>
                  ) : warehouseItems.filter(
                      (warehouseItem: AggregatedWarehouseItem) =>
                        warehouseItem.total_on_stock > 0,
                    ).length > 0 ? (
                    <>
                      <thead>
                        <tr>
                          <th
                            style={{ width: "var(--Table-firstColumnWidth)" }}
                          >
                            {type === "warehouse"
                              ? "Stock Name"
                              : "Warehouse Name"}
                          </th>
                          <th style={{ width: 100 }}>On Stock</th>
                          <th style={{ width: 100 }}>Available</th>
                          <th style={{ width: 100 }}>Allocated</th>
                          <th style={{ width: 100 }}>Sold</th>
                          {isAdmin && (
                            <th style={{ width: 80, textAlign: "center" }}>
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {warehouseItems
                          .filter(
                            (warehouseItem: AggregatedWarehouseItem) =>
                              warehouseItem.total_on_stock > 0 ||
                              warehouseItem.total_allocated > 0,
                          )
                          .map((warehouseItem: AggregatedWarehouseItem) => (
                            <tr
                              key={`${warehouseItem.warehouse_id}-${warehouseItem.stock_code}`}
                            >
                              <td>
                                {type === "warehouse"
                                  ? withTooltip(
                                      warehouseItem.item_name,
                                      "200px",
                                    )
                                  : withTooltip(
                                      warehouseItem.warehouse_name,
                                      "200px",
                                    )}
                              </td>
                              <td>
                                {warehouseItem.total_on_stock +
                                  warehouseItem.total_allocated}
                              </td>
                              <td>{warehouseItem.total_on_stock}</td>
                              <td>{warehouseItem.total_allocated}</td>
                              <td>{warehouseItem.total_sold}</td>
                              {isAdmin && (
                                <td style={{ textAlign: "center" }}>
                                  <Tooltip title="Adjust Stock">
                                    <IconButton
                                      size="sm"
                                      variant="outlined"
                                      color="primary"
                                      onClick={() =>
                                        handleOpenAdjustment(warehouseItem)
                                      }
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </>
                  ) : (
                    <tbody>
                      <tr>
                        <td
                          colSpan={isAdmin ? 6 : 5}
                          style={{ textAlign: "center" }}
                        >
                          No Stock Location Available
                        </td>
                      </tr>
                    </tbody>
                  )}
                </Table>
              </Sheet>
            </Card>
          </Box>
        </Sheet>
      </Modal>

      {/* Stock Adjustment Modal - Render outside parent modal */}
      {selectedItem && (
        <StockAdjustmentModal
          open={adjustmentModalOpen}
          setOpen={setAdjustmentModalOpen}
          warehouseId={selectedItem.warehouse_id}
          warehouseName={selectedItem.warehouse_name}
          itemId={selectedItem.item_id}
          itemName={selectedItem.item_name}
          stockCode={selectedItem.stock_code}
          currentStock={selectedItem.total_on_stock}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </>
  );
};

export default ViewWHModal;
