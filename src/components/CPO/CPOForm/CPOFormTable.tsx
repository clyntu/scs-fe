import { Input, Button, Sheet, Select, Option } from "@mui/joy";
import Table from "@mui/joy/Table";

import type { Item } from "../../../interface";
import type { CPOFormTableProps } from "../interface";
import { addCommaToNumberWithTwoPlaces } from "../../../helper";
import TooltipAutocomplete from "../../shared/TooltipAutocomplete";

const formatWithCommas = (value: string | number): string => {
  if (value === "" || value === undefined || value === null) return "";
  const str = String(value);
  const [whole, decimal] = str.split(".");
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
};

const stripCommas = (value: string): string => {
  return value.replace(/,/g, "");
};

const CPOFormTable = ({
  items,
  selectedRow,
  selectedItems,
  setSelectedItems,
  setIndexOfModal,
  setIsConfirmOpen,
  selectedCustomer,
}: CPOFormTableProps): JSX.Element => {
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";
  const handleRemoveItem = (index: number): void => {
    if (selectedItems[index].id !== null) {
      setSelectedItems(
        selectedItems.filter((_: Item, i: number) => i !== index),
      );
    }
  };

  const fetchSelectedItem = (
    event: any,
    value: number,
    index: number,
  ): void => {
    if (value !== undefined) {
      const foundItem = items.find((item) => item.id === value);
      if (foundItem === undefined) return;

      // Spread the found item and ensure all required properties are defined
      const item: Item = {
        ...foundItem,
        price: foundItem?.srp ?? 0,
        volume: 1,
      };

      // We need to add the new item before the null item
      const newSelectedItems = selectedItems.filter(
        (selectedItem: Item) => selectedItem.id !== null,
      );
      newSelectedItems[index] = item;

      // @ts-expect-error (Used null instead of undefined.)
      newSelectedItems.push({ id: null });

      setSelectedItems(newSelectedItems);
    }
  };

  const addItemVolume = (value: string, index: number): void => {
    const newSelectedItems = selectedItems.map((item: Item, i: number) => {
      if (i === index) {
        return { ...item, volume: value };
      }

      return item;
    });

    setSelectedItems(newSelectedItems);
  };

  const changePrice = (value: string, index: number): void => {
    const newSelectedItems = selectedItems.map((item: Item, i: number) => {
      if (i === index) {
        return { ...item, price: value };
      }

      return item;
    });

    setSelectedItems(newSelectedItems);
  };

  return (
    <Sheet
      sx={{
        "--TableCell-height": "40px",
        // the number is the amount of the header rows.
        "--TableHeader-height": "calc(1 * var(--TableCell-height))",
        "--Table-firstColumnWidth": "150px",
        "--Table-lastColumnWidth": "80px",
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
          "& tr > *:not(:first-child):not(:last-child)": {
            position: "relative",
            zIndex: 0,
          },
          "& tbody tr > *:first-child": {
            position: "sticky",
            zIndex: 2,
            left: 0,
            boxShadow: "1px 0 var(--TableCell-borderColor)",
            bgcolor: "background.surface",
          },
          "& tbody tr > *:last-child": {
            position: "sticky",
            zIndex: 2,
            right: 0,
            bgcolor: "background.surface",
          },
          "& thead tr > *:first-child": {
            position: "sticky",
            left: 0,
            top: 0,
            zIndex: 3,
            boxShadow: "1px 0 var(--TableCell-borderColor)",
            bgcolor: "background.level1",
          },
          "& thead tr > *:last-child": {
            position: "sticky",
            right: 0,
            top: 0,
            zIndex: 3,
            bgcolor: "background.level1",
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
              Stock Code
            </th>
            <th style={{ width: 300 }}>Name</th>
            <th style={{ width: 100, textAlign: "right" }}>Order Qty</th>
            <th style={{ width: 100, textAlign: "right" }}>Price</th>
            <th style={{ width: 100, textAlign: "right" }}>Gross</th>
            {/* <th style={{ width: 150 }}>On Stock</th> */}
            <th
              aria-label="last"
              style={{ width: "var(--Table-lastColumnWidth)" }}
            />
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((selectedItem: Item, index: number) => {
            return (
              <tr key={`${selectedItem.id}-${index}`}>
                <td>
                  <TooltipAutocomplete
                    placeholder="Select Stock"
                    options={items}
                    getOptionLabel={(item) => item.stock_code ?? ""}
                    onChange={(event, value) => {
                      if (value !== null) {
                        fetchSelectedItem(event, value.id, index);
                      }
                    }}
                    value={selectedItem}
                    disabled={isEditDisabled}
                    size="sm"
                    sx={{ fontSize: "xs" }}
                    slotProps={{
                      listbox: {
                        sx: {
                          width: 300, // Increase the width
                          fontSize: "13px",
                        },
                      },
                    }}
                  />
                </td>
                <td>
                  <TooltipAutocomplete
                    placeholder="Select Stock"
                    options={items}
                    getOptionLabel={(item) => item.name ?? ""}
                    onChange={(event, value) => {
                      if (value !== null) {
                        fetchSelectedItem(event, value.id, index);
                      }
                    }}
                    value={selectedItem}
                    disabled={isEditDisabled}
                    size="sm"
                    sx={{ fontSize: "xs" }}
                    slotProps={{
                      listbox: {
                        sx: {
                          width: 300, // Increase the width
                          fontSize: "13px",
                        },
                      },
                    }}
                  />
                </td>

                <td>
                  {selectedItem?.id !== null && (
                    <Input
                      type="number"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || /^\d+$/.test(raw)) {
                          addItemVolume(raw, index);
                        }
                      }}
                      slotProps={{
                        input: {
                          min: 0,
                          step: 1,
                        },
                      }}
                      value={selectedItem.volume}
                      disabled={isEditDisabled}
                      required
                      sx={{
                        fontSize: "xs",
                        width: "100%",
                        minWidth: 0,
                        input: { minWidth: 0 },
                      }}
                    />
                  )}
                </td>
                <td>
                  {selectedItem?.id !== null && (
                    <Input
                      sx={{
                        fontSize: "xs",
                        width: "100%",
                        minWidth: 0,
                        input: { textAlign: "right", minWidth: 0 },
                      }}
                      onChange={(e) => {
                        const raw = stripCommas(e.target.value);
                        if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                          changePrice(raw, index);
                        }
                      }}
                      value={formatWithCommas(selectedItem.price)}
                      disabled={isEditDisabled}
                      required
                    />
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  {selectedItem?.id !== null &&
                    addCommaToNumberWithTwoPlaces(
                      Number(selectedItem.price) * Number(selectedItem?.volume),
                    )}
                </td>
                {/* <td>{selectedItem.total_on_stock}</td> */}
                <td style={{ textAlign: "center" }}>
                  {selectedItem?.id !== null && (
                    <Button
                      size="sm"
                      variant="soft"
                      color="danger"
                      className="bg-delete-red"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isEditDisabled}
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Sheet>
  );
};

export default CPOFormTable;
