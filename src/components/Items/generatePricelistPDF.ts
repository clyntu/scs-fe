import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const addCustomHeader = (doc: jsPDF, companyId: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  const title = companyId === "company-a" ? "P.P.T." : "MA";
  doc.text(title, 40, 40);

  // Address and contact info (normal)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // "Total Cost Detail" aligned to the right
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Total Cost Detail", pageWidth - 150, 40); // Adjust position as needed

  // Bottom border line - just below the title
  doc.setLineWidth(0.5);
  doc.line(40, 50, pageWidth - 40, 50); // Draw horizontal line
};

export const generatePricelistPDF = (data: any[], companyId: string): void => {
  // 1. Initialize jsPDF
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "A4",
  });

  addCustomHeader(doc, companyId);

  // 2. Define columns and rows
  const tableColumnHeaders = [
    "Avail. Qty",
    "Stock Code",
    "Stock",
    "Net Cost Total",
  ];
  const tableRows = data.map((item) => [
    item.availableQty,
    item.stockCode,
    item.stock,
    item.netCostTotal,
  ]);

  // 3. Table setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = 460; // sum of your column widths
  const marginX = (pageWidth - tableWidth) / 2; // center horizontally

  autoTable(doc, {
    startY: 60,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 50, left: marginX },
    theme: "plain",
    columnStyles: {
      0: { cellWidth: 70, halign: "right" },
      1: { cellWidth: 100 },
      2: { cellWidth: 200 },
      3: { cellWidth: 90, halign: "right" },
    },
    styles: {
      fontSize: 9,
      cellPadding: { top: 2, right: 8, bottom: 2, left: 8 },
    },
    didParseCell: (hookData) => {
      if (
        hookData.section === "head" &&
        (hookData.column.index === 0 || hookData.column.index === 3)
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
  doc.save("total_cost_detail.pdf");
};
