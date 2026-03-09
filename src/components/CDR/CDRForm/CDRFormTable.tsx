import { Sheet } from "@mui/joy";
import Table from "@mui/joy/Table";

import type { CDRFormTableProps } from "../interface";
import { addCommaToNumberWithTwoPlaces } from "../../../helper";
import { withTooltip } from "../../shared/withTooltip";

const CDRFormTable = ({
  selectedRow,
  formattedAllocs,
  setFormattedAllocs,
  isEditDisabled,
}: CDRFormTableProps): JSX.Element => {
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
            zIndex: 2,
            left: 0,
            boxShadow: "1px 0 var(--TableCell-borderColor)",
            bgcolor: "background.surface",
          },
          "& tr > *:not(:first-child)": {
            position: "relative",
            zIndex: 0,
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
              Alloc No.
            </th>
            <th style={{ width: 200 }}>Stock Code</th>
            <th style={{ width: 300 }}>Name</th>
            <th style={{ width: 150 }}>Price</th>
            <th style={{ width: 150 }}>DR Receipt Qty.</th>
            <th style={{ width: 150 }}>Gross Amount</th>
            <th style={{ width: 150 }}>Cust. Disc. 1 (%)</th>
            <th style={{ width: 150 }}>Cust. Disc. 2 (%)</th>
            {/* <th style={{ width: 150 }}>Cust. Disc. 3 (%)</th> */}
            <th style={{ width: 150 }}>Tran. Disc. 1 (%)</th>
            <th style={{ width: 150 }}>Tran. Disc. 2 (%)</th>
            {/* <th style={{ width: 150 }}>Tran. Disc. 3 (%)</th> */}
            <th style={{ width: 150 }}>NET Amount</th>
          </tr>
        </thead>
        <tbody>
          {formattedAllocs.map((item, index) => {
            const key = `${item.id}-${item.cpo_id}-${item.stock_code}-${index}`;
            const price = addCommaToNumberWithTwoPlaces(item?.price ?? 0);

            return (
              <tr key={key}>
                <td>{item.id}</td>
                <td>{withTooltip(item?.stock_code, "120px")}</td>
                <td>{withTooltip(item?.name, "180px")}</td>
                <td style={{ textAlign: "right" }}>{price}</td>
                <td style={{ textAlign: "right" }}>{item.dp_qty}</td>
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
                <td style={{ textAlign: "right" }}>
                  {addCommaToNumberWithTwoPlaces(item.net_amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Sheet>
  );
};

export default CDRFormTable;
