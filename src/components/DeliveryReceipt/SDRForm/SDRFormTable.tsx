import { Sheet, Input } from "@mui/joy";
import Table from "@mui/joy/Table";

import type { SDRFormTableProps } from "../interface";
import { useEffect, useState } from "react";
import type { POItems, PurchaseOrder } from "../../../interface";
import { addCommaToNumberWithTwoPlaces } from "../../../helper";

const SDRFormTable = ({
  selectedRow,
  selectedPOs,
  setSelectedPOs,
  totalNet,
  servedAmt,
  setServedAmt,
  setTotalNet,
  setTotalGross,
  openEdit,
  isEditDisabled,
}: SDRFormTableProps): JSX.Element => {
  const [netPerRow, setNetPerRow] = useState<Record<string, number>>({});
  const [grossPerRow, setGrossPerRow] = useState<Record<string, number>>({});
  const status = selectedRow?.status;

  useEffect(() => {
    // Instantiate state per row
    if (!openEdit) {
      provideDefaultCreateTableValues();
    } else {
      provideDefaultEditTableValues();
    }
  }, [selectedPOs]);

  useEffect(() => {
    const total = Object.values(netPerRow).reduce((acc, curr) => acc + curr, 0);
    setTotalNet(total);
  }, [netPerRow]);

  useEffect(() => {
    const total = Object.values(grossPerRow).reduce(
      (acc, curr) => acc + curr,
      0,
    );
    setTotalGross(total);
  }, [grossPerRow]);

  const provideDefaultCreateTableValues = (): void => {
    const defaultPerRow: Record<string, number> = {};
    const servedPerRow: Record<string, number> = {};

    selectedPOs.forEach((PO, index1) => {
      PO.items.forEach((POItem, index2) => {
        const key = `${PO.id}-${POItem.id}-${index1}-${index2}`;
        const ToServe = 0;
        defaultPerRow[key] = 0;
        servedPerRow[key] = ToServe;
      });
    });

    setNetPerRow(defaultPerRow);
    setGrossPerRow(defaultPerRow);
    setServedAmt(servedPerRow);
  };

  const provideDefaultEditTableValues = (): void => {
    const servedPerRow: Record<string, number> = {};
    const netPerRow: Record<string, number> = {};
    const grossPerRow: Record<string, number> = {};

    selectedPOs.forEach((PO, index1) => {
      PO.items.forEach((POItem, index2) => {
        const key = `${PO.id}-${POItem.id}-${index1}-${index2}`;
        const inTransit = POItem.in_transit;

        servedPerRow[key] = inTransit;

        const newNet = calculateNetForRow(inTransit, POItem, PO);
        netPerRow[key] = newNet;

        const newGross = calculateGrossPerRow(inTransit, POItem);
        grossPerRow[key] = newGross;
      });
    });

    setServedAmt(servedPerRow);
    setNetPerRow(netPerRow);
    setGrossPerRow(grossPerRow);
  };

  const calculateNetForRow = (
    newValue: number,
    POItem: POItems,
    PO: PurchaseOrder,
  ): number => {
    let result = newValue * POItem.price;

    if (PO.supplier_discount_1.includes("%")) {
      const sd1 = PO.supplier_discount_1.slice(0, -1);
      result = result - result * (parseFloat(sd1) / 100);
    }

    if (PO.supplier_discount_2.includes("%")) {
      const sd2 = PO.supplier_discount_2.slice(0, -1);
      result = result - result * (parseFloat(sd2) / 100);
    }

    if (PO.supplier_discount_3.includes("%")) {
      const sd3 = PO.supplier_discount_3.slice(0, -1);
      result = result - result * (parseFloat(sd3) / 100);
    }

    if (PO.transaction_discount_1.includes("%")) {
      const td1 = PO.transaction_discount_1.slice(0, -1);
      result = result - result * (parseFloat(td1) / 100);
    }

    if (PO.transaction_discount_2.includes("%")) {
      const td2 = PO.transaction_discount_2.slice(0, -1);
      result = result - result * (parseFloat(td2) / 100);
    }

    if (PO.transaction_discount_3.includes("%")) {
      const td3 = PO.transaction_discount_3.slice(0, -1);
      result = result - result * (parseFloat(td3) / 100);
    }

    if (isNaN(result)) return 0;

    return result;
  };

  const calculateGrossPerRow = (newValue: number, POItem: POItems): number => {
    const result = newValue * POItem.price;
    if (isNaN(result)) return 0;
    return result;
  };

  const handleServedInputChange = (
    event: any,
    key: string,
    PO: PurchaseOrder,
    POItem: POItems,
  ): void => {
    const newValue = event.target.value;

    // Set served amount to get gross
    setServedAmt({
      ...servedAmt,
      [key]: newValue,
    });

    // Calculate net for that row
    const newNet = calculateNetForRow(newValue, POItem, PO);
    setNetPerRow({ ...netPerRow, [key]: newNet });

    const newGross = calculateGrossPerRow(newValue, POItem);
    setGrossPerRow({ ...grossPerRow, [key]: newGross });
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
              PO No.
            </th>
            <th style={{ width: 200 }}>Stock Code</th>
            <th style={{ width: 200 }}>Name</th>
            <th style={{ width: 150 }}>Serving Now</th>
            <th style={{ width: 200 }}>Unserved Qty.</th>
            {status === "posted" ? null : (
              <th style={{ width: 200 }}>Served Qty.</th>
            )}
            <th style={{ width: 150 }}>PO Qty.</th>
            <th style={{ width: 150 }}>Price</th>
            <th style={{ width: 150 }}>Gross Amount</th>
            <th style={{ width: 150 }}>Supp. Disc. 1 (%)</th>
            <th style={{ width: 150 }}>Supp. Disc. 2 (%)</th>
            {/* <th style={{ width: 150 }}>Supp. Disc. 3 (%)</th> */}
            <th style={{ width: 150 }}>Tran. Disc. 1 (%)</th>
            <th style={{ width: 150 }}>Tran. Disc. 2 (%)</th>
            {/* <th style={{ width: 150 }}>Tran. Disc. 3 (%)</th> */}
            <th style={{ width: 150 }}>NET Amount</th>
            <th style={{ width: 150 }}>Currency</th>
            <th style={{ width: 150 }}>Peso Rate</th>
          </tr>
        </thead>
        <tbody>
          {selectedPOs.map((PO, index1) => {
            return PO.items.map((POItem, index2) => {
              const key = `${PO.id}-${POItem.id}-${index1}-${index2}`;

              // Don't show if unserved is 0
              if (
                POItem.unserved_spo + servedAmt[key] === 0 &&
                status !== "posted"
              )
                return null;

              return (
                <tr key={key}>
                  <td style={{ zIndex: 1 }}>{PO.id}</td>
                  <td>{POItem?.item.stock_code}</td>
                  <td>{POItem?.item.name}</td>
                  {status === "posted" ? (
                    <td style={{ textAlign: "right" }}>{servedAmt[key]}</td>
                  ) : (
                    <td>
                      <Input
                        type="number"
                        onChange={(event) =>
                          handleServedInputChange(event, key, PO, POItem)
                        }
                        slotProps={{
                          input: {
                            min: 0,
                            max:
                              status === "posted"
                                ? POItem.volume - servedAmt[key]
                                : openEdit
                                  ? POItem.unserved_spo + POItem.in_transit
                                  : POItem.unserved_spo,
                          },
                        }}
                        value={servedAmt[key]}
                        disabled={isEditDisabled}
                        required
                      />
                    </td>
                  )}
                  <td style={{ textAlign: "right" }}>
                    {status === "posted"
                      ? POItem.unserved_spo
                      : openEdit
                        ? POItem.unserved_spo + POItem.in_transit
                        : POItem.unserved_spo}
                  </td>
                  {status === "posted" ? null : (
                    <td style={{ textAlign: "right" }}>{POItem.in_transit}</td>
                  )}
                  <td style={{ textAlign: "right" }}>{POItem.volume}</td>
                  <td style={{ textAlign: "right" }}>{POItem?.price}</td>

                  <td style={{ textAlign: "right" }}>
                    {addCommaToNumberWithTwoPlaces(grossPerRow[key])}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {PO.supplier_discount_1.includes("%")
                      ? PO.supplier_discount_1
                      : 0}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {PO.supplier_discount_2.includes("%")
                      ? PO.supplier_discount_2
                      : 0}
                  </td>
                  {/* <td style={{ textAlign: "right" }}>
                    {PO.supplier_discount_3.includes("%")
                      ? PO.supplier_discount_3
                      : 0}
                  </td> */}
                  <td style={{ textAlign: "right" }}>
                    {PO.transaction_discount_1.includes("%")
                      ? PO.transaction_discount_1
                      : 0}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {PO.transaction_discount_2.includes("%")
                      ? PO.transaction_discount_2
                      : 0}
                  </td>
                  {/* <td style={{ textAlign: "right" }}>
                    {PO.transaction_discount_3.includes("%")
                      ? PO.transaction_discount_3
                      : 0}
                  </td> */}
                  <td style={{ textAlign: "right" }}>
                    {addCommaToNumberWithTwoPlaces(netPerRow[key])}
                  </td>
                  <td>{PO.currency_used}</td>
                  <td style={{ textAlign: "right" }}>{PO.peso_rate}</td>
                </tr>
              );
            });
          })}
        </tbody>
      </Table>
    </Sheet>
  );
};

export default SDRFormTable;
