import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCommaToNumberWithTwoPlaces } from "../../helper";

// Helper function to format the date
const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours; // if hours is 0, set it to 12
  const formattedHours = hours.toString().padStart(2, "0");

  return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
};

const addCustomHeader = (doc: jsPDF, companyId: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  const title = companyId === "company-a" ? "P.P.T." : "MA Inc.";
  doc.text(title, 40, 40);

  // "NET COST" aligned to the right (same Y position as company title)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const headerText = "NET COST";
  const headerTextWidth = doc.getTextWidth(headerText);
  const rightMargin = pageWidth - 40;
  const headerXPos = rightMargin - headerTextWidth;
  doc.text(headerText, headerXPos, 40);

  // Bottom border line - just below the title
  doc.setLineWidth(0.5);
  doc.line(40, 50, pageWidth - 40, 50); // Draw horizontal line
};

interface TotalCostData {
  withNetCost: {
    totalCost: number;
    productCount: number;
  };
  withoutNetCost: {
    totalCost: number;
    productCount: number;
  };
}

export const generateTotalCostPDF = (
  data: TotalCostData,
  companyId: string,
): void => {
  // 1. Initialize jsPDF
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "A4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  addCustomHeader(doc, companyId);

  // 2. Create the summary table
  const tableData = [
    [
      "with Net Cost",
      addCommaToNumberWithTwoPlaces(data.withNetCost.totalCost),
      data.withNetCost.productCount.toString(),
    ],
    [
      "without Net Cost",
      addCommaToNumberWithTwoPlaces(data.withoutNetCost.totalCost),
      data.withoutNetCost.productCount.toString(),
    ],
  ];

  const tableHeaders = ["", "Total Cost", "Number of Product(s)"];

  // 3. Position the table in the center
  const tableWidth = 350; // Approximate width
  const marginX = (pageWidth - tableWidth) / 2;

  autoTable(doc, {
    startY: 80,
    head: [tableHeaders],
    body: tableData,
    margin: { left: marginX },
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 120, halign: "right" }, // Category column - right aligned
      1: { cellWidth: 130, halign: "right" }, // Total Cost column
      2: { cellWidth: 100, halign: "center" }, // Number of Products column
    },
    styles: {
      fontSize: 11,
      cellPadding: { top: 8, right: 8, bottom: 8, left: 8 },
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    didParseCell: (hookData) => {
      // Center align the header cells
      if (hookData.section === "head") {
        hookData.cell.styles.halign = "center";
      }
      // Right align the Total Cost column in body
      if (hookData.section === "body" && hookData.column.index === 1) {
        hookData.cell.styles.halign = "right";
      }
      // Center align the Number of Products column in body
      if (hookData.section === "body" && hookData.column.index === 2) {
        hookData.cell.styles.halign = "center";
      }
    },
    didDrawPage: (data) => {
      const footerFontSize = 9;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Current page and total pages
      const currentPage = data.pageNumber;
      const totalPages = doc.getNumberOfPages();

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

  // 4. Save or download the PDF
  const today = new Date();
  const dateString = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;
  doc.save(`total_cost_${dateString}.pdf`);
};
