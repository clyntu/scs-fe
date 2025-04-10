import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCommaToNumberWithFourPlaces } from "../../helper";

// Helper function to format the date
const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
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
  doc.text("Summary of Receivables", pageWidth - 193.5, 50); // Adjust 80 as needed
  doc.text(`as of ${formatDate(new Date())}`, pageWidth - 140, 70); // Adjust 80 as needed
  // Bottom border line
  doc.setLineWidth(0.5);
  doc.line(40, 90, pageWidth - 40, 90); // Draw horizontal line
};

export const generatePDF = (
  data: any[],
  total: {
    total_receivable: string;
    total_uncleared: string;
    total_bounced: string;
  },
  title: string,
): void => {
  // 1. Initialize jsPDF
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "A4",
  });

  addCustomHeader(doc, title);

  // 2. Define columns and rows
  const tableColumnHeaders = [
    "Customer",
    "Amount Receivable",
    "Uncleared Payment",
    "Bounced Payment",
  ];
  const tableRows = data.map((customer) => [
    customer.customer_name,
    addCommaToNumberWithFourPlaces(Number(customer.amount_receivable)),
    addCommaToNumberWithFourPlaces(Number(customer.uncleared_payment)),
    addCommaToNumberWithFourPlaces(Number(customer.bounced_payment)),
  ]);

  // 3. Table setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = 420; // sum of your column widths
  const marginX = (pageWidth - tableWidth) / 2; // center horizontally

  autoTable(doc, {
    startY: 100,
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
          content: addCommaToNumberWithFourPlaces(
            Number(total.total_receivable),
          ),
          styles: { halign: "right", fontStyle: "bold" },
        },
        {
          content: addCommaToNumberWithFourPlaces(
            Number(total.total_uncleared),
          ),
          styles: { halign: "right", fontStyle: "bold" },
        },
        {
          content: addCommaToNumberWithFourPlaces(Number(total.total_bounced)),
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
