import { Sheet, Autocomplete, Input } from "@mui/joy";
import Table from "@mui/joy/Table";
import { type WarehouseItemsFE, type STFormTableProps } from "../interface";
import CircularProgress from "@mui/joy/CircularProgress";
import { withTooltip } from "../../shared/withTooltip";
import TooltipAutocomplete from "../../shared/TooltipAutocomplete";

const STFormTable = ({
  selectedRow,
  warehouses,
  warehouseItems,
  setWarehouseItems,
  isLoadingItems,
}: STFormTableProps): JSX.Element => {
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

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
            "--Table-firstColumnWidth": "300px",
            "--Table-lastColumnWidth": "86px",
            // background needs to have transparency to show the scrolling shadows
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.04)",
            overflow: "auto",
            borderRadius: "sm",
            marginTop: 3,
            width: "fit-content",
            maxWidth: "100%",
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
            size="sm"
            stickyHeader
            hoverRow
            sx={{
              tableLayout: "fixed",
              "& tbody tr > *:first-child": {
                position: "sticky",
                zIndex: 2,
                left: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.surface",
              },
              "& thead tr > *:first-child": {
                position: "sticky",
                zIndex: 3,
                left: 0,
                top: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.level1",
              },
              "& tr > *:not(:first-child)": {
                position: "relative",
                zIndex: 0,
              },
              "& thead th": {
                backgroundColor: "background.level1",
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
                  Product Name
                </th>
                <th style={{ width: 150 }}>Stock Code</th>
                {!isEditDisabled && (
                  <th style={{ width: 100, textAlign: "right" }}>Available</th>
                )}
                <th style={{ width: 100, textAlign: "right" }}>
                  Total Quantity
                </th>
                <th style={{ width: 200 }}>To Whse 1</th>
                <th style={{ width: 100 }}>Whse 1 Qty.</th>
                <th style={{ width: 200 }}>To Whse 2</th>
                <th style={{ width: 100 }}>Whse 2 Qty.</th>
                <th style={{ width: 200 }}>To Whse 3</th>
                <th style={{ width: 100 }}>Whse 3 Qty.</th>
              </tr>
            </thead>
            <tbody>
              {warehouseItems.map((item: WarehouseItemsFE, index: number) => {
                return (
                  <tr key={item.id}>
                    <td>
                      {withTooltip(item.name, "180px")}
                    </td>
                    <td>{withTooltip(item.stock_code, "120px")}</td>
                    {!isEditDisabled && (
                      <td style={{ textAlign: "right" }}>
                        {item.on_stock - item.allocated}
                      </td>
                    )}
                    <td style={{ textAlign: "right" }}>
                      {Number(item.warehouse_1_qty ?? 0) +
                        Number(item.warehouse_2_qty ?? 0) +
                        Number(item.warehouse_3_qty ?? 0)}
                    </td>
                    <td>
                      <TooltipAutocomplete
                        options={warehouses.items.filter(
                          (warehouse) => warehouse.id,
                        )}
                        getOptionLabel={(option) => option.code}
                        value={item.warehouse_1}
                        onChange={(event, newValue) => {
                          const updatedWarehouseItems = warehouseItems.map(
                            (warehouseItem) =>
                              warehouseItem.id === item.id
                                ? { ...warehouseItem, warehouse_1: newValue } // Update the matching item
                                : warehouseItem,
                          );
                          setWarehouseItems(updatedWarehouseItems);
                        }}
                        size="sm"
                        className="w-[100%]"
                        placeholder="Select Warehouse"
                        disabled={isEditDisabled}
                        sx={{ fontSize: "xs" }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        sx={{ fontSize: "xs", width: "100%", minWidth: 0 }}
                        value={item.warehouse_1_qty}
                        onChange={(e) => {
                          const updatedWarehouseItems = warehouseItems.map(
                            (warehouseItem) =>
                              warehouseItem.id === item.id
                                ? {
                                    ...warehouseItem,
                                    warehouse_1_qty: e.target.value,
                                  } // Update the matching item
                                : warehouseItem,
                          );
                          setWarehouseItems(updatedWarehouseItems);
                        }}
                        slotProps={{
                          input: {
                            min: 0,
                          },
                        }}
                        placeholder="0"
                        disabled={isEditDisabled}
                      />
                    </td>
                    <td>
                      <TooltipAutocomplete
                        options={warehouses.items.filter(
                          (warehouse) => warehouse.id,
                        )}
                        getOptionLabel={(option) => option.code}
                        value={item.warehouse_2}
                        onChange={(event, newValue) => {
                          const updatedWarehouseItems = warehouseItems.map(
                            (warehouseItem) =>
                              warehouseItem.id === item.id
                                ? { ...warehouseItem, warehouse_2: newValue } // Update the matching item
                                : warehouseItem,
                          );
                          setWarehouseItems(updatedWarehouseItems);
                        }}
                        size="sm"
                        className="w-[100%]"
                        placeholder="Select Warehouse"
                        disabled={isEditDisabled}
                        sx={{ fontSize: "xs" }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        sx={{ fontSize: "xs", width: "100%", minWidth: 0 }}
                        value={item.warehouse_2_qty}
                        onChange={(e) => {
                          const updatedWarehouseItems = warehouseItems.map(
                            (warehouseItem) =>
                              warehouseItem.id === item.id
                                ? {
                                    ...warehouseItem,
                                    warehouse_2_qty: e.target.value,
                                  } // Update the matching item
                                : warehouseItem,
                          );
                          setWarehouseItems(updatedWarehouseItems);
                        }}
                        slotProps={{
                          input: {
                            min: 0,
                          },
                        }}
                        placeholder="0"
                        disabled={isEditDisabled}
                      />
                    </td>
                    <td>
                      <TooltipAutocomplete
                        options={warehouses.items.filter(
                          (warehouse) => warehouse.id,
                        )}
                        getOptionLabel={(option) => option.code}
                        value={item.warehouse_3}
                        onChange={(event, newValue) => {
                          const updatedWarehouseItems = warehouseItems.map(
                            (warehouseItem) =>
                              warehouseItem.id === item.id
                                ? { ...warehouseItem, warehouse_3: newValue } // Update the matching item
                                : warehouseItem,
                          );
                          setWarehouseItems(updatedWarehouseItems);
                        }}
                        size="sm"
                        className="w-[100%]"
                        placeholder="Select Warehouse"
                        disabled={isEditDisabled}
                        sx={{ fontSize: "xs" }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        sx={{ fontSize: "xs", width: "100%", minWidth: 0 }}
                        value={item.warehouse_3_qty}
                        onChange={(e) => {
                          const updatedWarehouseItems = warehouseItems.map(
                            (warehouseItem) =>
                              warehouseItem.id === item.id
                                ? {
                                    ...warehouseItem,
                                    warehouse_3_qty: e.target.value,
                                  } // Update the matching item
                                : warehouseItem,
                          );
                          setWarehouseItems(updatedWarehouseItems);
                        }}
                        slotProps={{
                          input: {
                            min: 0,
                          },
                        }}
                        placeholder="0"
                        disabled={isEditDisabled}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Sheet>
      )}
    </>
  );
};

export default STFormTable;
