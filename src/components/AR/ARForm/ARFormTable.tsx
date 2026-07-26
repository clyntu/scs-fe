import { Sheet, Input, Checkbox } from "@mui/joy";
import Table from "@mui/joy/Table";

import type { ARFormTableProps } from "../interface";
import { addCommaToNumberWithTwoPlaces, addTwoPlaces } from "../../../helper";
import CircularProgress from "@mui/joy/CircularProgress";
import TooltipTableCell from "../../shared/TooltipTableCell";

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

const ARFormTable = ({
  outstandingTrans,
  setOutstandingTrans,
  selectedRow,
  isEditDisabled,
  isLoadingItems,
  selectedCDR,
}: ARFormTableProps): JSX.Element => {
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
            "--Table-firstColumnWidth": "150px",
            "--Table-lastColumnWidth": "86px",
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
                  Ref No.
                </th>
                <th style={{ width: 130 }}>Tran No.</th>
                <th style={{ width: 50 }}>Pay?</th>
                <th style={{ width: 150 }}>Tran Date</th>
                <th style={{ width: 150, textAlign: "right" }}>
                  Original Amt
                </th>
                <th style={{ width: 150, textAlign: "right" }}>Tran Amt</th>
                <th style={{ width: 150, textAlign: "right" }}>Payment</th>
                <th style={{ width: 150, textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {outstandingTrans
                .filter(
                  (trans) =>
                    selectedCDR === null ||
                    [trans.transaction_number, trans.reference].includes(
                      String(selectedCDR),
                    ),
                )
                .sort((a, b) => {
                  // First sort by source type: Customer DR first, Sales Return last
                  if (a.source_type !== b.source_type) {
                    if (a.source_type === "customer_dr") return -1;
                    if (b.source_type === "customer_dr") return 1;
                  }
                  // Then sort by transaction date within each group
                  return (
                    new Date(a.transaction_date).getTime() -
                    new Date(b.transaction_date).getTime()
                  );
                })
                .map((trans) => {
                  const isChecked = Number(trans.payment ?? "0") !== 0;

                  return (
                    <tr key={trans.id}>
                      <td>
                        <TooltipTableCell maxWidth="150px">
                          {trans.reference}
                        </TooltipTableCell>
                      </td>

                      <td>{trans.transaction_number}</td>
                      <td style={{ textAlign: "center" }}>
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => {
                            const newPayment = e.target.checked
                              ? addTwoPlaces(Number(trans.transaction_amount))
                              : 0;

                            setOutstandingTrans(
                              outstandingTrans.map((trans2) =>
                                trans.id === trans2.id &&
                                trans.source_type === trans2.source_type
                                  ? {
                                      ...trans2,
                                      payment: newPayment,
                                    }
                                  : trans2,
                              ),
                            );
                          }}
                          disabled={isEditDisabled}
                        />
                      </td>
                      <td>{trans.transaction_date}</td>
                      <td style={{ textAlign: "right" }}>
                        {addCommaToNumberWithTwoPlaces(
                          Number(trans.original_amount),
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {addCommaToNumberWithTwoPlaces(
                          Number(trans.transaction_amount),
                        )}
                      </td>
                      <td>
                        <Input
                          sx={{
                            width: "100%",
                            minWidth: 0,
                            input: { textAlign: "right", minWidth: 0 },
                          }}
                          name="payment"
                          size="sm"
                          placeholder="0"
                          value={formatWithCommas(trans?.payment ?? "")}
                          onChange={(e) => {
                            const raw = stripCommas(e.target.value);
                            if (raw === "" || /^-?\d*\.?\d*$/.test(raw)) {
                              setOutstandingTrans(
                                outstandingTrans.map((trans2) =>
                                  trans.id === trans2.id &&
                                  trans.source_type === trans2.source_type
                                    ? {
                                        ...trans2,
                                        payment: raw,
                                      }
                                    : trans2,
                                ),
                              );
                            }
                          }}
                          disabled={isEditDisabled}
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {addCommaToNumberWithTwoPlaces(
                          Number(trans.transaction_amount) -
                            Number(trans.payment),
                        )}
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

export default ARFormTable;
