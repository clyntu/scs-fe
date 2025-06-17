/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type CR } from "../../interface";
import { addCommaToNumberWithTwoPlaces } from "../../helper";

const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours || 12; // if hours is 0, set it to 12
  const formattedHours = hours.toString().padStart(2, "0");

  return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
};

const calculateNetForRow = (
  newValue: number,
  price: number,
  DRItem: any,
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

export const generateCRPDF = (selectedRow: CR, companyId: string): void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "A4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const title =
    companyId === "company-a" ? "Peterson Parts Trading" : "Company B";
  doc.text(title, 40, 40);

  // Address and contact info (normal)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  if (companyId === "company-a") {
    doc.text("174 G. ARANETA AVE., QUEZON CITY,", 40, 50);
    doc.text("TEL#: 725-4481, 725-4489, 726-1315", 40, 60);
    doc.text("FAX#: 724-8680", 40, 70);
    doc.text("E-MAIL: peterson_174@yahoo.com", 40, 80);
  } else {
    doc.text("COMPANY B ADDRESS", 40, 50);
    doc.text("TEL#: 725-4481, 725-4489, 726-1315", 40, 60);
    doc.text("FAX#: 724-8680", 40, 70);
    doc.text("E-MAIL: companyb@yahoo.com", 40, 80);
  }

  // "PRICELIST" aligned to the right
  const text = `Customer Return No.: ${selectedRow.id}`;
  const rightMargin = pageWidth - 40;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  // Get text width
  const textWidth = doc.getTextWidth(text);

  // Calculate aligned X position
  const xPos = rightMargin - textWidth;

  // Add text at the right-aligned position
  doc.text(text, xPos, 80);

  // Bottom border line
  doc.setLineWidth(0.5);
  doc.line(40, 90, pageWidth - 40, 90); // Draw horizontal line

  // 3. Customer and Date
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${selectedRow.customer.name}`, 40, 110);
  doc.text(`Ref No.: ${selectedRow.reference_number}`, 40, 130);
  doc.text(`Address: ${selectedRow.customer?.building_address ?? ""}`, 40, 150);
  doc.text(
    `Date: ${new Date(selectedRow.transaction_date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    )}`,
    pageWidth - 125,
    110,
  ); // top-right area

  // 4. Draw a horizontal line below header if you like (optional)
  doc.setLineWidth(0.5);
  doc.line(40, 160, pageWidth - 40, 160);

  // 5. Table columns and data
  const columns = ["QTY", "Stock", "Description", "Unit Cost", "Amount"];
  const bodyData = selectedRow.items.map((item) => {
    const costPerUnit =
      item.delivery_receipt_item.delivery_plan_item.allocation_item.customer_purchase_order.items.find(
        (cpoItem) => cpoItem.item_id === item.item_id,
      )?.price;
    return [
      item.return_qty,
      item.item.stock_code,
      item.item.name,
      addCommaToNumberWithTwoPlaces(Number(costPerUnit)),
      addCommaToNumberWithTwoPlaces(
        calculateNetForRow(
          Number(item.return_qty),
          Number(item.price),
          item.delivery_receipt_item.delivery_plan_item.allocation_item
            .customer_purchase_order,
        ),
      ),
    ];
  });

  // 6. Render the table
  autoTable(doc, {
    startY: 170,
    head: [columns],
    body: bodyData,
    theme: "plain",
    columnStyles: {
      0: { halign: "right", cellWidth: 40 }, // QTY
      1: { halign: "left", cellWidth: 100 }, // Stock
      2: { halign: "left", cellWidth: 250 }, // Description
      3: { halign: "right", cellWidth: 60 }, // Unit Cost
      4: { halign: "right", cellWidth: 60 }, // Amount
    },
    styles: {
      fontSize: 10,
      cellPadding: { top: 2, right: 8, bottom: 2, left: 8 },
    },
    didParseCell: (hookData) => {
      if (
        hookData.section === "head" &&
        (hookData.column.index === 0 || hookData.column.index === 4)
      ) {
        hookData.cell.styles.halign = "right";
      }
    },
    didDrawPage: (data) => {
      const footerFontSize = 9;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Current page and total pages
      const currentPage = data.pageNumber; // provided by jspdf-autotable
      const totalPages = doc.getNumberOfPages(); // provided by jsPDF

      doc.setFontSize(footerFontSize);
      doc.setFont("helvetica", "normal");

      // Left footer: "Page X of Y"
      const leftText = `Page ${currentPage} of ${totalPages}`;
      doc.text(leftText, data.settings.margin.left, pageHeight - 20);

      // Right footer: formatted current date and time
      const rightText = `Report run on: ${formatDate(new Date())}`;
      const textWidth = doc.getTextWidth(rightText);
      doc.text(
        rightText,
        pageWidth - data.settings.margin.right - textWidth,
        pageHeight - 20,
      );
    },
  });

  // 7. Grand Total below the table
  const finalY = (doc as any).lastAutoTable.finalY as number; // last Y position of the table

  //   doc.setLineWidth(0.5);
  //   doc.line(40, finalY + 10, pageWidth - 40, finalY + 10);

  // Draw QTY label and value
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("QTY:", pageWidth - 190, finalY + 30);
  doc.setFont("helvetica", "normal");
  doc.text(String(selectedRow.total_qty), pageWidth - 55, finalY + 30, {
    align: "right",
  });

  // Draw NET Total label and value
  doc.setFont("helvetica", "bold");
  doc.text("AMOUNT:", pageWidth - 190, finalY + 50);
  doc.setFont("helvetica", "normal");
  doc.text(
    String(addCommaToNumberWithTwoPlaces(Number(selectedRow.total_gross))),
    pageWidth - 55,
    finalY + 50,
    {
      align: "right",
    },
  );

  // 9. Save or download
  doc.save("customer-return.pdf");
};
