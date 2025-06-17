import { Input, Button, Sheet, Autocomplete, Select, Option } from "@mui/joy";
import Table from "@mui/joy/Table";

import type { Item } from "../../../interface";
import type { CPOFormTableProps } from "../interface";
import { addCommaToNumberWithTwoPlaces } from "../../../helper";

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
        p_type: "regular",
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

  const addPType = (value: string, index: number): void => {
    const newSelectedItems = selectedItems.map((item: Item, i: number) => {
      if (i === index) {
        return { ...item, p_type: value };
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
          "& tr > *:last-child": {
            position: "sticky",
            right: 0,
            bgcolor: "var(--TableCell-headBackground)",
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
              Name
            </th>
            <th style={{ width: 200 }}>Stock Code</th>
            <th style={{ width: 200 }}>P-Type</th>
            <th style={{ width: 150 }}>Order Qty</th>
            <th style={{ width: 150 }}>Price</th>
            <th style={{ width: 150 }}>Gross</th>
            {/* <th style={{ width: 150 }}>On Stock</th> */}
            <th
              aria-label="last"
              style={{ width: "var(--Table-lastColumnWidth)" }}
            />
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((selectedItem: Item, index: number) => {
            const price = isEditDisabled
              ? selectedItem.price
              : selectedItem.acquisition_cost;
            return (
              <tr key={`${selectedItem.id}-${index}`}>
                <td style={{ zIndex: 1 }}>
                  <Autocomplete
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
                  <Autocomplete
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
                  {selectedItem.id && (
                    <Select
                      onChange={(event, value) => {
                        if (value !== null) addPType(value, index);
                      }}
                      size="sm"
                      value={selectedItem.p_type}
                      disabled={isEditDisabled}
                      placeholder="Select P-Type"
                    >
                      <Option value="regular">Regular</Option>
                    </Select>
                  )}
                </td>
                <td style={{ zIndex: 2 }}>
                  {selectedItem?.id !== null && (
                    <Input
                      type="number"
                      onChange={(e) => addItemVolume(e.target.value, index)}
                      slotProps={{
                        input: {
                          min: 0,
                        },
                      }}
                      value={selectedItem.volume}
                      disabled={isEditDisabled}
                      required
                    />
                  )}
                </td>
                <td>
                  {selectedItem?.id !== null && (
                    <Input
                      type="number"
                      onChange={(e) => changePrice(e.target.value, index)}
                      slotProps={{
                        input: {
                          min: 0,
                          step: ".01",
                        },
                      }}
                      value={selectedItem.price}
                      disabled={isEditDisabled}
                      required
                    />
                  )}
                </td>
                <td>
                  {selectedItem?.id !== null &&
                    addCommaToNumberWithTwoPlaces(
                      Number(selectedItem.price) * Number(selectedItem?.volume),
                    )}
                </td>
                {/* <td>{selectedItem.total_on_stock}</td> */}
                <td>
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
