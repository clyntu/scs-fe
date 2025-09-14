import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCommaToNumberWithTwoPlaces } from "../../helper";

// Helper function to format the date
const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

const addCustomHeader = (doc: jsPDF, companyId: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  const companyTitle = companyId === "company-a" ? "P.P.T." : "MA Inc.";
  doc.text(companyTitle, 40, 40);

  // "Summary of Receivables" aligned to the right (same Y position as company title)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Summary of Receivables", pageWidth - 193.5, 40);
  
  // Bottom border line - just below the title
  doc.setLineWidth(0.5);
  doc.line(40, 50, pageWidth - 40, 50); // Draw horizontal line
  
  // Date info below the line
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`as of ${formatDate(new Date())}`, pageWidth - 140, 70);
};

export const generatePDF = (
  data: any[],
  total: {
    total_receivable: string;
    total_uncleared: string;
    total_bounced: string;
  },
  companyId: string,
): void => {
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
    "Customer",
    "Amount Receivable",
    "Uncleared Payment",
    "Bounced Payment",
  ];
  const tableRows = data.map((customer) => [
    customer.customer_name,
    addCommaToNumberWithTwoPlaces(Number(customer.amount_receivable)),
    addCommaToNumberWithTwoPlaces(Number(customer.uncleared_payment)),
    addCommaToNumberWithTwoPlaces(Number(customer.bounced_payment)),
  ]);

  // 3. Table setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = 420; // sum of your column widths
  const marginX = (pageWidth - tableWidth) / 2; // center horizontally

  autoTable(doc, {
    startY: 85,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 50, left: marginX },
    theme: "plain",
    columnStyles: {
      0: { cellWidth: 180, halign: "left" },
      1: { cellWidth: 80, halign: "right" },
      2: { cellWidth: 80, halign: "right" },
      3: { cellWidth: 80, halign: "right" },
    },
    styles: {
      fontSize: 10,
      cellPadding: { top: 2, right: 8, bottom: 2, left: 8 },
    },
    didParseCell: (hookData) => {
      if (
        hookData.section === "head" &&
        (hookData.column.index === 1 ||
          hookData.column.index === 2 ||
          hookData.column.index === 3)
      ) {
        hookData.cell.styles.halign = "right";
      }
    },
    // 5. Add a foot row for the totals
    foot: [
      [
        // first column blank or "TOTAL"
        { content: "TOTAL:", styles: { halign: "right", fontStyle: "bold" } },
        // second & third columns show totals
        {
          content: addCommaToNumberWithTwoPlaces(
            Number(total.total_receivable),
          ),
          styles: { halign: "right", fontStyle: "bold" },
        },
        {
          content: addCommaToNumberWithTwoPlaces(Number(total.total_uncleared)),
          styles: { halign: "right", fontStyle: "bold" },
        },
        {
          content: addCommaToNumberWithTwoPlaces(Number(total.total_bounced)),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
    ],
    // 6. Hook to draw a line just above the totals row
    didDrawCell: (hookData) => {
      // If we are about to draw the foot row, draw a line above it
      if (hookData.row.section === "foot" && hookData.row.index === 0) {
        const { table } = hookData;
        // Y coordinate of the row
        const footStartY = hookData.cell.y;
        doc.setLineWidth(0.5);
        doc.line(marginX, footStartY, marginX + tableWidth, footStartY);
      }
    },
  });

  // 5. Save or download the PDF
  doc.save("summary_of_receivables.pdf");
};
