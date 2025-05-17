import { Sheet, Input } from "@mui/joy";
import Table from "@mui/joy/Table";

import type { ARFormTableProps } from "../interface";
import { addCommaToNumberWithFourPlaces } from "../../../helper";
import CircularProgress from "@mui/joy/CircularProgress";

const ARFormTable = ({
  outstandingTrans,
  setOutstandingTrans,
  selectedRow,
  isEditDisabled,
  isLoadingItems,
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
                  Source
                </th>
                <th style={{ width: 150 }}>Tran No.</th>
                <th style={{ width: 150 }}>Tran Date</th>
                <th style={{ width: 150 }}>Original Amt</th>
                <th style={{ width: 150 }}>Tran Amt</th>
                <th style={{ width: 150 }}>Payment</th>
                <th style={{ width: 150 }}>Balance</th>
                <th style={{ width: 150 }}>Reference No.</th>
              </tr>
            </thead>
            <tbody>
              {outstandingTrans.map((trans) => {
                return (
                  <tr key={trans.id}>
                    <td>
                      {trans.source_type === "customer_dr"
                        ? "Customer DR"
                        : "Sales Return"}
                    </td>
                    <td>{trans.transaction_number}</td>
                    <td>{trans.transaction_date}</td>
                    <td>
                      {addCommaToNumberWithFourPlaces(
                        Number(trans.original_amount),
                      )}
                    </td>
                    <td>
                      {addCommaToNumberWithFourPlaces(
                        Number(trans.transaction_amount),
                      )}
                    </td>
                    <td>
                      <Input
                        type="number"
                        name="payment"
                        size="sm"
                        placeholder="0"
                        value={trans?.payment}
                        slotProps={{
                          input: {
                            min:
                              Number(trans.transaction_amount) > 0
                                ? 0
                                : trans.transaction_amount,
                            max:
                              Number(trans.transaction_amount) > 0
                                ? trans.transaction_amount
                                : 0,
                            step: 0.0001,
                          },
                        }}
                        onChange={(e) =>
                          setOutstandingTrans(
                            outstandingTrans.map((trans2) =>
                              trans.id === trans2.id &&
                              trans.source_type === trans2.source_type
                                ? { ...trans2, payment: String(e.target.value) }
                                : trans2,
                            ),
                          )
                        }
                        disabled={isEditDisabled}
                      />
                    </td>
                    <td>
                      {addCommaToNumberWithFourPlaces(
                        Number(trans.transaction_amount) -
                          Number(trans.payment),
                      )}
                    </td>
                    <td>{trans.reference}</td>
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
