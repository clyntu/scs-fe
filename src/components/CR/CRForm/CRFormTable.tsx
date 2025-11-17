import { Sheet, Input, Autocomplete } from "@mui/joy";
import Table from "@mui/joy/Table";

import type { DRItemsFE, CRFormTableProps } from "../interface";
import { addCommaToNumberWithTwoPlaces } from "../../../helper";
import { withTooltip } from "../../shared/withTooltip";
import TooltipAutocomplete from "../../shared/TooltipAutocomplete";

const CRFormTable = ({
  selectedRow,
  warehouses,
  formattedDRs,
  setFormattedDRs,
  isEditDisabled,
}: CRFormTableProps): JSX.Element => {
  const calculateNetForRow = (
    newValue: number,
    price: number,
    DRItem: DRItemsFE,
  ): number => {
    let result = newValue * price;

    if (DRItem.customer_discount_1.includes("%")) {
      const cd1 = DRItem.customer_discount_1.slice(0, -1);
      result = result - result * (parseFloat(cd1) / 100);
    }

    if (DRItem.customer_discount_2.includes("%")) {
      const cd2 = DRItem.customer_discount_2.slice(0, -1);
      result = result - result * (parseFloat(cd2) / 100);
    }

    if (DRItem.customer_discount_3.includes("%")) {
      const cd3 = DRItem.customer_discount_3.slice(0, -1);
      result = result - result * (parseFloat(cd3) / 100);
    }

    if (DRItem.transaction_discount_1.includes("%")) {
      const td1 = DRItem.transaction_discount_1.slice(0, -1);
      result = result - result * (parseFloat(td1) / 100);
    }

    if (DRItem.transaction_discount_2.includes("%")) {
      const td2 = DRItem.transaction_discount_2.slice(0, -1);
      result = result - result * (parseFloat(td2) / 100);
    }

    if (DRItem.transaction_discount_3.includes("%")) {
      const td3 = DRItem.transaction_discount_3.slice(0, -1);
      result = result - result * (parseFloat(td3) / 100);
    }

    if (isNaN(result)) return 0;

    return result;
  };

  return (
    <Sheet
      sx={{
        "--TableCell-height": "40px",
        // the number is the amount of the header rows.
        "--TableHeader-height": "calc(1 * var(--TableCell-height))",
        "--Table-firstColumnWidth": "150px",
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
              CDR No.
            </th>
            <th style={{ width: 150 }}>Alloc No.</th>
            <th style={{ width: 200 }}>Stock Code</th>
            <th style={{ width: 300 }}>Name</th>
            <th style={{ width: 200 }}>Whse</th>
            <th style={{ width: 150 }}>Return Qty.</th>
            <th style={{ width: 150 }}>Price</th>
            <th style={{ width: 150 }}>Gross Amount</th>
            <th style={{ width: 150 }}>Supp. Disc. 1 (%)</th>
            <th style={{ width: 150 }}>Supp. Disc. 2 (%)</th>
            {/* <th style={{ width: 150 }}>Supp. Disc. 3 (%)</th> */}
            <th style={{ width: 150 }}>Tran. Disc. 1 (%)</th>
            <th style={{ width: 150 }}>Tran. Disc. 2 (%)</th>
            {/* <th style={{ width: 150 }}>Tran. Disc. 3 (%)</th> */}
          </tr>
        </thead>
        <tbody>
          {formattedDRs.map((item, index) => {
            const key = `${item.id}-${item.cpo_id}-${item.stock_code}`;

            return (
              <tr key={key}>
                <td style={{ zIndex: 1 }}>{item.id}</td>
                <td>{item?.alloc_no}</td>
                <td>{withTooltip(item?.stock_code, "120px")}</td>
                <td>{withTooltip(item?.name, "180px")}</td>

                <td>
                  <TooltipAutocomplete
                    options={warehouses.items.filter(
                      (warehouse) => warehouse.id,
                    )}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    value={item.return_warehouse}
                    onChange={(e, newValue) => {
                      setFormattedDRs((prevDRItems) =>
                        prevDRItems.map((DRItem) =>
                          DRItem.id === item.id &&
                          DRItem.stock_code === item.stock_code &&
                          DRItem.cpo_id === item.cpo_id &&
                          DRItem.alloc_no === item.alloc_no
                            ? {
                                ...DRItem,
                                return_warehouse: newValue,
                              } // Update the matching item
                            : DRItem,
                        ),
                      );
                    }}
                    size="sm"
                    className="w-[100%]"
                    placeholder="Select Warehouse"
                    disabled={isEditDisabled}
                  />
                </td>
                <td>
                  <Input
                    type="number"
                    sx={{ input: { textAlign: "right" } }}
                    value={item.return_qty}
                    onChange={(e) => {
                      setFormattedDRs((prevDRItems) =>
                        prevDRItems.map((DRItem) =>
                          DRItem.id === item.id &&
                          DRItem.stock_code === item.stock_code &&
                          DRItem.cpo_id === item.cpo_id &&
                          DRItem.alloc_no === item.alloc_no
                            ? {
                                ...DRItem,
                                return_qty: e.target.value,
                                gross_amount: calculateNetForRow(
                                  Number(e.target.value),
                                  Number(item.price),
                                  DRItem,
                                ),
                              } // Update the matching item
                            : DRItem,
                        ),
                      );
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
                  <Input
                    type="number"
                    sx={{ input: { textAlign: "right" } }}
                    value={item.price}
                    onChange={(e) => {
                      setFormattedDRs((prevDRItems) =>
                        prevDRItems.map((DRItem) =>
                          DRItem.id === item.id &&
                          DRItem.stock_code === item.stock_code &&
                          DRItem.cpo_id === item.cpo_id &&
                          DRItem.alloc_no === item.alloc_no
                            ? {
                                ...DRItem,
                                price: String(e.target.value),
                                gross_amount: calculateNetForRow(
                                  Number(item.return_qty),
                                  Number(e.target.value),
                                  DRItem,
                                ),
                              } // Update the matching item
                            : DRItem,
                        ),
                      );
                    }}
                    slotProps={{
                      input: {
                        min: 0,
                        step: ".0001",
                      },
                    }}
                    placeholder="0"
                    disabled={isEditDisabled}
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  {addCommaToNumberWithTwoPlaces(item.gross_amount)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {item.customer_discount_1.includes("%")
                    ? item.customer_discount_1
                    : 0}
                </td>
                <td style={{ textAlign: "right" }}>
                  {item.customer_discount_2.includes("%")
                    ? item.customer_discount_2
                    : 0}
                </td>
                {/* <td style={{ textAlign: "right" }}>
                  {item.customer_discount_3.includes("%")
                    ? item.customer_discount_3
                    : 0}
                </td> */}
                <td style={{ textAlign: "right" }}>
                  {item.transaction_discount_1.includes("%")
                    ? item.transaction_discount_1
                    : 0}
                </td>
                <td style={{ textAlign: "right" }}>
                  {item.transaction_discount_2.includes("%")
                    ? item.transaction_discount_2
                    : 0}
                </td>
                {/* <td style={{ textAlign: "right" }}>
                  {item.transaction_discount_3.includes("%")
                    ? item.transaction_discount_3
                    : 0}
                </td> */}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Sheet>
  );
};

export default CRFormTable;
