import { Sheet, Autocomplete, Input } from "@mui/joy";
import Table from "@mui/joy/Table";
import { type AllocFormTableProps } from "../interface";
import CircularProgress from "@mui/joy/CircularProgress";

const AllocFormTable = ({
  selectedRow,
  warehouses,
  CPOItems,
  setCPOItems,
  openCreate,
  isLoadingItems,
  warehouseStockAvailability,
}: AllocFormTableProps): JSX.Element => {
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  // Helper function to get available quantity for a warehouse and item
  const getAvailableQuantity = (
    itemId: number,
    warehouseId: number,
  ): number => {
    const stockInfo = warehouseStockAvailability[String(itemId)]?.find(
      (stock) => stock.warehouse_id === warehouseId,
    );
    return stockInfo?.allocatable_qty ?? 0;
  };

  return (
    <>
      {isLoadingItems ? (
        <div className="flex justify-center mt-[50px]">
          <CircularProgress size="md" variant="soft" />
        </div>
      ) : (
        <Sheet
          sx={{
            "--TableCell-height": "40px",
            // the number is the amount of the header rows.
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "200px",
            "--Table-lastColumnWidth": "86px",
            // background needs to have transparency to show the scrolling shadows
            "--TableRow-stripeBackground": "rgba(0 0 0 / 0.04)",
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.08)",
            overflow: "auto",
            borderRadius: 8,
            marginTop: 3,
            background: (
              theme,
            ) => `linear-gradient(to right, ${theme.vars.palette.background.surface} 30%, rgba(255, 255, 255, 0)),
                linear-gradient(to right, rgba(255, 255, 255, 0), ${theme.vars.palette.background.surface} 70%) 0 100%,
                radial-gradient(
                  farthest-side at 0 50%,
                  rgba(0, 0, 0, 0.12),
                  rgba(0, 0, 0, 0)
                ),
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
            }}
            borderAxis="both"
          >
            <thead>
              <tr>
                <th
                  style={{
                    width: "var(--Table-firstColumnWidth)",
                  }}
                >
                  CPO No.
                </th>
                <th style={{ width: 300 }}>Stock Description</th>
                <th style={{ width: 150 }}>Order Qty.</th>
                <th style={{ width: 200 }}>Alloc Qty.</th>
                <th style={{ width: 200 }}>Warehouse 1</th>
                <th style={{ width: 150 }}>Whse 1 Qty.</th>
                <th style={{ width: 200 }}>Warehouse 2</th>
                <th style={{ width: 150 }}>Whse 2 Qty.</th>
                <th style={{ width: 200 }}>Warehouse 3</th>
                <th style={{ width: 150 }}>Whse 3 Qty.</th>
              </tr>
            </thead>
            <tbody>
              {CPOItems.map((item) => {
                return (
                  ((openCreate && item.volume !== item.alloc_qty) ||
                    !openCreate) && (
                    <tr key={`${item.id}-${item.item_id}`}>
                      <td
                        style={{
                          width: "var(--Table-firstColumnWidth)",
                          zIndex: 10,
                        }}
                      >
                        {item.id}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.volume}</td>
                      <td>
                        {selectedRow !== undefined &&
                        selectedRow.status !== "unposted"
                          ? item.cpo_existing_allocated
                          : item.alloc_qty}
                      </td>
                      <td>
                        <Autocomplete
                          options={warehouses.items.filter((warehouse) => {
                            const stockInfo = warehouseStockAvailability[
                              String(item.item_id)
                            ]?.find(
                              (stock) => stock.warehouse_id === warehouse.id,
                            );
                            return (
                              stockInfo !== null &&
                              stockInfo !== undefined &&
                              stockInfo.allocatable_qty > 0
                            );
                          })}
                          getOptionLabel={(option) => option.name}
                          value={item.warehouse_1}
                          onChange={(event, newValue) => {
                            setCPOItems((prevCPOItems) =>
                              prevCPOItems.map(
                                (cpoItem) =>
                                  cpoItem.id === item.id &&
                                  cpoItem.item_id === item.item_id
                                    ? { ...cpoItem, warehouse_1: newValue } // Update the matching item
                                    : cpoItem, // Keep other items unchanged
                              ),
                            );
                          }}
                          renderOption={(props, option) => {
                            const stockInfo = warehouseStockAvailability[
                              String(item.item_id)
                            ]?.find(
                              (stock) => stock.warehouse_id === option.id,
                            );
                            return (
                              <li
                                {...props}
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  transition:
                                    "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                                className="hover:bg-blue-50 hover:shadow-sm"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#eff6ff";
                                  e.currentTarget.style.boxShadow =
                                    "0 2px 4px rgba(0,0,0,0.1)";
                                  // e.currentTarget.style.borderLeft =
                                  //   "3px solid #3b82f6";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "";
                                  e.currentTarget.style.boxShadow = "";
                                  e.currentTarget.style.borderLeft = "";
                                }}
                              >
                                <div className="w-full">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900 transition-colors duration-200">
                                        {option.name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Code: {option.code}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-semibold text-green-600 transition-all duration-200">
                                        {stockInfo?.allocatable_qty ?? 0}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        available
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          }}
                          size="sm"
                          className="w-[100%]"
                          placeholder="Select Warehouse"
                          disabled={isEditDisabled}
                          slotProps={{
                            input: {
                              sx: {
                                "& .MuiAutocomplete-input": {
                                  fontSize: "14px",
                                },
                              },
                            },
                          }}
                        />
                      </td>
                      <td style={{ width: 150 }}>
                        {item.warehouse_1 !== null && !isEditDisabled && (
                          <div className="text-xs text-gray-500 mb-1">
                            Available:{" "}
                            {getAvailableQuantity(
                              item.item_id,
                              item.warehouse_1.id,
                            )}
                          </div>
                        )}
                        <Input
                          type="number"
                          value={item.warehouse_1_qty}
                          onChange={(e) => {
                            setCPOItems((prevCPOItems) =>
                              prevCPOItems.map((cpoItem) =>
                                cpoItem.id === item.id &&
                                cpoItem.item_id === item.item_id
                                  ? {
                                      ...cpoItem,
                                      warehouse_1_qty: e.target.value,
                                    } // Update the matching item
                                  : cpoItem,
                              ),
                            );
                          }}
                          slotProps={{
                            input: {
                              min: 0,
                              max:
                                item.warehouse_1 !== null
                                  ? getAvailableQuantity(
                                      item.item_id,
                                      item.warehouse_1.id,
                                    )
                                  : undefined,
                            },
                          }}
                          placeholder="0"
                          disabled={isEditDisabled}
                        />
                      </td>
                      <td style={{ width: 200 }}>
                        <Autocomplete
                          options={warehouses.items.filter((warehouse) => {
                            const stockInfo = warehouseStockAvailability[
                              String(item.item_id)
                            ]?.find(
                              (stock) => stock.warehouse_id === warehouse.id,
                            );
                            return (
                              stockInfo !== null &&
                              stockInfo !== undefined &&
                              stockInfo.allocatable_qty > 0
                            );
                          })}
                          getOptionLabel={(option) => option.name}
                          value={item.warehouse_2}
                          onChange={(event, newValue) => {
                            setCPOItems((prevCPOItems) =>
                              prevCPOItems.map(
                                (cpoItem) =>
                                  cpoItem.id === item.id &&
                                  cpoItem.item_id === item.item_id
                                    ? { ...cpoItem, warehouse_2: newValue } // Update the matching item
                                    : cpoItem, // Keep other items unchanged
                              ),
                            );
                          }}
                          renderOption={(props, option) => {
                            const stockInfo = warehouseStockAvailability[
                              String(item.item_id)
                            ]?.find(
                              (stock) => stock.warehouse_id === option.id,
                            );
                            return (
                              <li
                                {...props}
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  transition:
                                    "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                                className="hover:bg-blue-50 hover:shadow-sm"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#eff6ff";
                                  e.currentTarget.style.boxShadow =
                                    "0 2px 4px rgba(0,0,0,0.1)";
                                  e.currentTarget.style.borderLeft =
                                    "3px solid #3b82f6";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "";
                                  e.currentTarget.style.boxShadow = "";
                                  e.currentTarget.style.borderLeft = "";
                                }}
                              >
                                <div className="w-full">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900 transition-colors duration-200">
                                        {option.name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Code: {option.code}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-semibold text-green-600 transition-all duration-200">
                                        {stockInfo?.allocatable_qty ?? 0}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        available
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          }}
                          size="sm"
                          className="w-[100%]"
                          placeholder="Select Warehouse"
                          disabled={isEditDisabled}
                          slotProps={{
                            input: {
                              sx: {
                                "& .MuiAutocomplete-input": {
                                  fontSize: "14px",
                                },
                              },
                            },
                          }}
                        />
                      </td>
                      <td style={{ width: 150 }}>
                        {item.warehouse_2 !== null && !isEditDisabled && (
                          <div className="text-xs text-gray-500 mb-1">
                            Available:{" "}
                            {getAvailableQuantity(
                              item.item_id,
                              item.warehouse_2.id,
                            )}
                          </div>
                        )}
                        <Input
                          type="number"
                          value={item.warehouse_2_qty}
                          onChange={(e) => {
                            setCPOItems((prevCPOItems) =>
                              prevCPOItems.map((cpoItem) =>
                                cpoItem.id === item.id &&
                                cpoItem.item_id === item.item_id
                                  ? {
                                      ...cpoItem,
                                      warehouse_2_qty: e.target.value,
                                    } // Update the matching item
                                  : cpoItem,
                              ),
                            );
                          }}
                          slotProps={{
                            input: {
                              min: 0,
                              max:
                                item.warehouse_2 !== null
                                  ? getAvailableQuantity(
                                      item.item_id,
                                      item.warehouse_2.id,
                                    )
                                  : undefined,
                            },
                          }}
                          placeholder="0"
                          disabled={isEditDisabled}
                        />
                      </td>
                      <td style={{ width: 200 }}>
                        <Autocomplete
                          options={warehouses.items.filter((warehouse) => {
                            const stockInfo = warehouseStockAvailability[
                              String(item.item_id)
                            ]?.find(
                              (stock) => stock.warehouse_id === warehouse.id,
                            );
                            return (
                              stockInfo !== null &&
                              stockInfo !== undefined &&
                              stockInfo.allocatable_qty > 0
                            );
                          })}
                          getOptionLabel={(option) => option.name}
                          value={item.warehouse_3}
                          onChange={(event, newValue) => {
                            setCPOItems((prevCPOItems) =>
                              prevCPOItems.map(
                                (cpoItem) =>
                                  cpoItem.id === item.id &&
                                  cpoItem.item_id === item.item_id
                                    ? { ...cpoItem, warehouse_3: newValue } // Update the matching item
                                    : cpoItem, // Keep other items unchanged
                              ),
                            );
                          }}
                          renderOption={(props, option) => {
                            const stockInfo = warehouseStockAvailability[
                              String(item.item_id)
                            ]?.find(
                              (stock) => stock.warehouse_id === option.id,
                            );
                            return (
                              <li
                                {...props}
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  transition:
                                    "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                                className="hover:bg-blue-50 hover:shadow-sm"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#eff6ff";
                                  e.currentTarget.style.boxShadow =
                                    "0 2px 4px rgba(0,0,0,0.1)";
                                  e.currentTarget.style.borderLeft =
                                    "3px solid #3b82f6";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "";
                                  e.currentTarget.style.boxShadow = "";
                                  e.currentTarget.style.borderLeft = "";
                                }}
                              >
                                <div className="w-full">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900 transition-colors duration-200">
                                        {option.name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Code: {option.code}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-semibold text-green-600 transition-all duration-200">
                                        {stockInfo?.allocatable_qty ?? 0}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        available
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          }}
                          size="sm"
                          className="w-[100%]"
                          placeholder="Select Warehouse"
                          disabled={isEditDisabled}
                          slotProps={{
                            input: {
                              sx: {
                                "& .MuiAutocomplete-input": {
                                  fontSize: "14px",
                                },
                              },
                            },
                          }}
                        />
                      </td>
                      <td style={{ width: 150 }}>
                        {item.warehouse_3 !== null && !isEditDisabled && (
                          <div className="text-xs text-gray-500 mb-1">
                            Available:{" "}
                            {getAvailableQuantity(
                              item.item_id,
                              item.warehouse_3.id,
                            )}
                          </div>
                        )}
                        <Input
                          type="number"
                          value={item.warehouse_3_qty}
                          onChange={(e) => {
                            setCPOItems((prevCPOItems) =>
                              prevCPOItems.map((cpoItem) =>
                                cpoItem.id === item.id &&
                                cpoItem.item_id === item.item_id
                                  ? {
                                      ...cpoItem,
                                      warehouse_3_qty: e.target.value,
                                    } // Update the matching item
                                  : cpoItem,
                              ),
                            );
                          }}
                          slotProps={{
                            input: {
                              min: 0,
                              max:
                                item.warehouse_3 !== null
                                  ? getAvailableQuantity(
                                      item.item_id,
                                      item.warehouse_3.id,
                                    )
                                  : undefined,
                            },
                          }}
                          placeholder="0"
                          disabled={isEditDisabled}
                        />
                      </td>
                      <td
                        aria-label="last"
                        style={{ width: "var(--Table-lastColumnWidth)" }}
                      />
                    </tr>
                  )
                );
              })}
            </tbody>
          </Table>
        </Sheet>
      )}
    </>
  );
};

export default AllocFormTable;
