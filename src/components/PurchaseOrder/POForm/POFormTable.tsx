import { Input, Button, Sheet, Autocomplete } from "@mui/joy";
import ConfirmationModal from "../ConfirmationModal";
import Table from "@mui/joy/Table";

import type { Item } from "../../../interface";
import type { POFormTableProps } from "../interface";

const POFormTable = ({
  items,
  status,
  selectedRow,
  selectedItems,
  setSelectedItems,
  indexOfModal,
  setIndexOfModal,
  newPrices,
  setNewPrices,
  isConfirmOpen,
  setIsConfirmOpen,
  selectedSupplier,
}: POFormTableProps): JSX.Element => {
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
        price: foundItem.acquisition_cost ?? 0,
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

  const addItemPrice = (value: string, index: number): void => {
    const newSelectedItems = selectedItems.map((item: Item, i: number) => {
      if (i === index) {
        return { ...item, price: value };
      }

      return item;
    });

    setSelectedItems(newSelectedItems);
  };

  const handlePriceChange = (selectedItem: Item, index: number): void => {
    // Add to new price list (This will be sent to BE on SAVE)
    if (selectedItem?.price !== undefined && selectedItem?.id !== undefined) {
      setNewPrices([
        ...newPrices,
        {
          id: selectedItem.id,
          newPrice: selectedItem.price,
        },
      ]);
    }
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
              Stock Code
            </th>
            <th style={{ width: 200 }}>Name</th>
            {!isEditDisabled && (
              <th style={{ width: 200 }}>Current Purchase Price</th>
            )}
            <th style={{ width: 150 }}>Volume</th>
            <th style={{ width: 150 }}>Price</th>
            <th style={{ width: 150 }}>Gross</th>
            <th
              aria-label="last"
              style={{ width: "var(--Table-lastColumnWidth)" }}
            />
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((selectedItem: Item, index: number) => (
            <tr key={`${selectedItem.id}-${index}`}>
              {/* Modal for confirming price change */}
              {indexOfModal === index && isConfirmOpen && (
                <ConfirmationModal
                  open={isConfirmOpen}
                  setOpen={setIsConfirmOpen}
                  // Add function here that will change the price of acquisition cost
                  onConfirm={() => handlePriceChange(selectedItem, index)}
                  // When cancelled, revert back original price
                  onCancel={() =>
                    addItemPrice(String(selectedItem.acquisition_cost), index)
                  }
                  itemName={selectedItem.name}
                />
              )}

              <td style={{ zIndex: 1 }}>
                <Autocomplete
                  placeholder="Select Stock Code"
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
                <Autocomplete
                  placeholder="Select Stock Name"
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
              {!isEditDisabled && <td>{selectedItem?.acquisition_cost}</td>}
              <td>
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
              <td style={{ zIndex: 2 }}>
                {selectedItem?.id !== null && (
                  <Input
                    type="number"
                    value={selectedItem.price}
                    slotProps={{
                      input: {
                        min: 0,
                        step: ".0001",
                      },
                    }}
                    onChange={(e) => addItemPrice(e.target.value, index)}
                    onBlur={(e) => {
                      if (
                        selectedItem.acquisition_cost !== selectedItem.price
                      ) {
                        setIndexOfModal(index);
                        setIsConfirmOpen(true);
                      }
                    }}
                    disabled={isEditDisabled}
                  />
                )}
              </td>
              <td>
                {selectedItem?.id !== null &&
                  (
                    Number(selectedItem?.price) * Number(selectedItem?.volume)
                  ).toFixed(4)}
              </td>
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
          ))}
        </tbody>
      </Table>
    </Sheet>
  );
};

export default POFormTable;
