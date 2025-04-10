/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type CDR } from "../../interface";
import { addCommaToNumberWithFourPlaces } from "../../helper";

const calculateNetForRow = (
  newValue: number,
  allocItem: any,
  price: number,
): number => {
  let result = newValue * price;

  if (allocItem.customer_discount_1.includes("%")) {
    const cd1 = allocItem.customer_discount_1.slice(0, -1);
    result = result - result * (parseFloat(cd1) / 100);
  }

  if (allocItem.customer_discount_2.includes("%")) {
    const cd2 = allocItem.customer_discount_2.slice(0, -1);
    result = result - result * (parseFloat(cd2) / 100);
  }

  if (allocItem.customer_discount_3.includes("%")) {
    const cd3 = allocItem.customer_discount_3.slice(0, -1);
    result = result - result * (parseFloat(cd3) / 100);
  }

  if (allocItem.transaction_discount_1.includes("%")) {
    const td1 = allocItem.transaction_discount_1.slice(0, -1);
    result = result - result * (parseFloat(td1) / 100);
  }

  if (allocItem.transaction_discount_2.includes("%")) {
    const td2 = allocItem.transaction_discount_2.slice(0, -1);
    result = result - result * (parseFloat(td2) / 100);
  }

  if (allocItem.transaction_discount_3.includes("%")) {
    const td3 = allocItem.transaction_discount_3.slice(0, -1);
    result = result - result * (parseFloat(td3) / 100);
  }

  if (isNaN(result)) return 0;

  return result;
};

export const generateDeliveryReceiptPDF = (selectedRow: CDR): void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "A4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Peterson Parts Trading Inc.", 40, 40);

  // Address and contact info (normal)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("174 G. ARANETA AVE., QUEZON CITY,", 40, 50);
  doc.text("TEL#: 725-4481, 725-4489, 726-1315", 40, 60);
  doc.text("FAX#: 724-8680", 40, 70);
  doc.text("E-MAIL: peterson_174@yahoo.com", 40, 80);

  // "PRICELIST" aligned to the right
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`D.R. No.: ${selectedRow.id}`, pageWidth - 130, 80); // Adjust x-position as needed

  // Bottom border line
  doc.setLineWidth(0.5);
  doc.line(40, 90, pageWidth - 40, 90); // Draw horizontal line

  // 3. Customer and Date
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${selectedRow.customer.name}`, 40, 110);
  doc.text(`Address: ${selectedRow.customer?.building_address ?? ""}`, 40, 130);
  doc.text(
    `Date: ${new Date(selectedRow.transaction_date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    )}`,
    pageWidth - 140,
    110,
  ); // top-right area

  // 4. Draw a horizontal line below header if you like (optional)
  doc.setLineWidth(0.5);
  doc.line(40, 140, pageWidth - 40, 140);

  // 5. Table columns and data
  const columns = [
    "QTY",
    "Stock",
    "Description",
    "Unit Cost",
    "Discount (%)",
    "Amount",
  ];
  const bodyData = selectedRow.receipt_items.map((item) => {
    const allocItem = item.delivery_plan_item.allocation_item;
    const itemObj = allocItem.customer_purchase_order.items.find((item) => {
      return item.item_id === allocItem.item_id;
    });

    const discString = [
      allocItem.customer_purchase_order.customer_discount_1,
      allocItem.customer_purchase_order.customer_discount_2,
      allocItem.customer_purchase_order.customer_discount_3,
      allocItem.customer_purchase_order.transaction_discount_1,
      allocItem.customer_purchase_order.transaction_discount_2,
      allocItem.customer_purchase_order.transaction_discount_3,
    ]
      .filter((val) => val.includes("%"))
      .join(", ");

    return [
      item.delivery_plan_item.planned_qty,
      allocItem.item.stock_code,
      allocItem.item.name,
      addCommaToNumberWithFourPlaces(itemObj?.price) ?? 0.0,
      discString,
      addCommaToNumberWithFourPlaces(
        calculateNetForRow(
          Number(item.delivery_plan_item.planned_qty),
          allocItem.customer_purchase_order,
          itemObj?.price ?? 0,
        ) || 0,
      ),
    ];
  });

  // 6. Render the table
  autoTable(doc, {
    startY: 150,
    head: [columns],
    body: bodyData,
    theme: "plain",
    columnStyles: {
      0: { halign: "right", cellWidth: 40 }, // QTY
      1: { halign: "left", cellWidth: 100 }, // Stock
      2: { halign: "left", cellWidth: 180 }, // Description
      3: { halign: "right", cellWidth: 60 }, // Unit Cost
      4: { halign: "right", cellWidth: 80 }, // Discount
      5: { halign: "right", cellWidth: 60 }, // Amount
    },
    styles: {
      fontSize: 9,
      cellPadding: { top: 2, right: 8, bottom: 2, left: 8 },
    },
    didParseCell: (hookData) => {
      if (
        hookData.section === "head" &&
        (hookData.column.index === 0 ||
          hookData.column.index === 5 ||
          hookData.column.index === 4)
      ) {
        hookData.cell.styles.halign = "right";
      }
    },
  });

  // 7. Grand Total below the table
  const finalY = (doc as any).lastAutoTable.finalY as number; // last Y position of the table

  //   doc.setLineWidth(0.5);
  //   doc.line(40, finalY + 10, pageWidth - 40, finalY + 10);

  // Draw LESS label and value
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Fixed Discount:", pageWidth - 180, finalY + 30);
  doc.setFont("helvetica", "normal");
  doc.text(selectedRow.discount_amount, pageWidth - 45, finalY + 30, {
    align: "right",
  });

  // Draw NET Total label and value
  doc.setFont("helvetica", "bold");
  doc.text("NET Total:", pageWidth - 180, finalY + 60);
  doc.setFont("helvetica", "normal");
  doc.text(
    addCommaToNumberWithFourPlaces(Number(selectedRow.total_net)) ?? "",
    pageWidth - 45,
    finalY + 60,
    {
      align: "right",
    },
  );

  // 8. "Nothing Follows" line
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const text = "*** Nothing Follows ***";
  const textWidth = doc.getTextWidth(text);
  const centerX = (pageWidth - textWidth) / 2;
  doc.text(text, centerX, finalY + 90);

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(40, finalY + 100, pageWidth - 40, finalY + 100);

  // 10. Fixed Footer Section (at bottom of page)
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 70; // 70 pts above bottom

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(40, footerY, pageWidth - 40, footerY);

  // Text below the line
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Received merchandise herein in good order and condition:",
    40,
    footerY + 20,
  );

  // Received by label and line
  doc.text("Received by:", 40, footerY + 50);
  doc.line(110, footerY + 53, 250, footerY + 53); // line under name

  // Date Received label and line
  doc.text("Date Received:", pageWidth - 220, footerY + 50);
  doc.line(pageWidth - 130, footerY + 53, pageWidth - 40, footerY + 53); // line under date

  // 9. Save or download
  doc.save("delivery-receipt.pdf");
};
