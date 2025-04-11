import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type PrintInventoryItem } from "../../interface";
import { addCommaToNumberWithFourPlaces } from "../../helper";

// Helper function to format the date
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

const addCustomHeader = (doc: jsPDF, title: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 40, 40);

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
  doc.text("STOCKS", pageWidth - 100, 40); // Adjust 80 as needed

  // Bottom border line
  doc.setLineWidth(0.5);
  doc.line(40, 90, pageWidth - 40, 90); // Draw horizontal line
};

export const generateStocksPDF = (
  items: PrintInventoryItem[],
  title: string,
): void => {
  // 1. Initialize jsPDF
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "A4",
  });

  addCustomHeader(doc, title);

  // 2. Define columns and rows
  const tableColumnHeaders = [
    "Stock Code",
    "Stock Name",
    "Avail. Qty.",
    "Sell. Price",
    "Alloc. Qty.",
    "Location",
    "Category",
    "Brand",
  ];
  const tableRows = items.map((item) => [
    item.stock_code,
    item.name,
    item.avail_qty,
    addCommaToNumberWithFourPlaces(item.selling_price),
    item.alloc_qty,
    item.location,
    item.category,
    item.brand,
  ]);

  // 3. Table setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = 750; // sum of your column widths
  const marginX = (pageWidth - tableWidth) / 2; // center horizontally

  autoTable(doc, {
    startY: 100,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 50, left: marginX },
    theme: "plain",
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 170 },
      2: { cellWidth: 60, halign: "right" },
      3: { cellWidth: 60, halign: "right" },
      4: { cellWidth: 60, halign: "right" },
      5: { cellWidth: 100 },
      6: { cellWidth: 90 },
      7: { cellWidth: 90 },
    },
    styles: {
      fontSize: 9,
      cellPadding: { top: 2, right: 8, bottom: 2, left: 8 },
    },
    didParseCell: (hookData) => {
      if (
        hookData.section === "head" &&
        (hookData.column.index === 2 ||
          hookData.column.index === 3 ||
          hookData.column.index === 4)
      ) {
        hookData.cell.styles.halign = "right";
      }
    },

    // 4. Add footer using didDrawPage
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

  // 5. Save or download the PDF
  doc.save("stocks.pdf");
};
