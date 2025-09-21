import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Use the interface from AR component for consistency
interface OutstandingTrans {
  id: number;
  source_type: string;
  transaction_number: string;
  transaction_date: string; // ISO date format (YYYY-MM-DD)
  original_amount: string;
  transaction_amount: string;
  reference: string;
  reference_number?: string;
  days_outstanding?: number;
  balance: string;
  aging_bucket?: string;
  payment?: string;
}

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

// Helper function to format date for display (from ISO string)
const formatDisplayDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Helper function to format currency
const formatCurrency = (amount: string): string => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Helper function to format source type for display
const formatSourceType = (sourceType: string): string => {
  switch (sourceType.toLowerCase()) {
    case "customer_dr":
      return "Customer DR";
    case "cr":
    case "customer_return":
      return "Sales Return";
    default:
      return sourceType.toUpperCase();
  }
};

const addCustomHeader = (
  doc: jsPDF,
  companyId: string,
  customerName: string,
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  const title = companyId === "company-a" ? "P.P.T." : "MA Inc.";
  doc.text(title, 40, 40);

  // Customer Receivables title aligned to the right
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Receivables", pageWidth - 180, 40);

  // Customer name below the title
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${customerName}`, 40, 55);

  // Bottom border line - just below the customer name
  doc.setLineWidth(0.5);
  doc.line(40, 65, pageWidth - 40, 65); // Draw horizontal line
};

export const generateCustomerReceivablesPDF = (
  data: OutstandingTrans[],
  companyId: string,
  customerName: string,
  filters?: {
    fromDate?: string;
    toDate?: string;
    sourceType?: string;
    agingBucket?: string;
  },
): void => {
  // 1. Initialize jsPDF
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: "landscape", // Use landscape for more columns
    unit: "pt",
    format: "A4",
  });

  addCustomHeader(doc, companyId, customerName);

  // Add filter information if any filters are applied
  let yPosition = 80;
  if (filters) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const filterTexts: string[] = [];
    if (filters.fromDate)
      filterTexts.push(`From: ${formatDisplayDate(filters.fromDate)}`);
    if (filters.toDate)
      filterTexts.push(`To: ${formatDisplayDate(filters.toDate)}`);
    if (filters.sourceType && filters.sourceType !== "all") {
      filterTexts.push(`Source: ${filters.sourceType.toUpperCase()}`);
    }
    if (filters.agingBucket && filters.agingBucket !== "all") {
      filterTexts.push(`Aging: ${filters.agingBucket}`);
    }

    if (filterTexts.length > 0) {
      doc.text(`Filters: ${filterTexts.join(" | ")}`, 40, yPosition);
      yPosition += 15;
    }
  }

  // 2. Define columns and rows
  const tableColumnHeaders = [
    "Transaction #",
    "Source",
    "Transaction Date",
    "Reference",
    "Original Amount",
    "Paid",
    "Balance",
    "Days Outstanding",
    "Aging",
  ];

  const tableRows = data.map((item) => {
    const originalAmount = parseFloat(item.original_amount);
    const balance = parseFloat(item.balance);
    const paidAmount = originalAmount - balance;

    return [
      item.transaction_number,
      formatSourceType(item.source_type),
      formatDisplayDate(item.transaction_date),
      item.reference_number || "N/A",
      formatCurrency(item.original_amount),
      formatCurrency(paidAmount.toString()),
      formatCurrency(item.balance),
      item.days_outstanding ? item.days_outstanding.toString() : "N/A",
      item.aging_bucket || "N/A",
    ];
  });

  // 3. Calculate total amounts
  const totalOriginalAmount = data.reduce(
    (sum, item) => sum + parseFloat(item.original_amount),
    0,
  );
  const totalBalanceAmount = data.reduce(
    (sum, item) => sum + parseFloat(item.balance),
    0,
  );

  // 4. Table setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = 700; // Reduced width to prevent cutoff (landscape A4 safe zone)
  const marginX = 40; // Fixed left margin for consistent positioning

  autoTable(doc, {
    startY: yPosition + 5,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 50, left: marginX, right: marginX, bottom: 60 },
    theme: "grid",
    tableWidth: "wrap",
    columnStyles: {
      0: { cellWidth: 85, halign: "center" }, // Transaction #
      1: { cellWidth: 75, halign: "center" }, // Source
      2: { cellWidth: 80, halign: "center" }, // Transaction Date
      3: { cellWidth: 100, halign: "left" }, // Reference
      4: { cellWidth: 85, halign: "right" }, // Original Amount
      5: { cellWidth: 85, halign: "right" }, // Paid
      6: { cellWidth: 85, halign: "right" }, // Balance
      7: { cellWidth: 85, halign: "center" }, // Days Outstanding
      8: { cellWidth: 80, halign: "center" }, // Aging
    },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    didParseCell: (hookData) => {
      // Style header cells - right align amount columns
      if (hookData.section === "head") {
        if (
          hookData.column.index === 4 ||
          hookData.column.index === 5 ||
          hookData.column.index === 6
        ) {
          hookData.cell.styles.halign = "right";
        }
      }
    },

    // 5. Add footer and totals using didDrawPage
    didDrawPage: (data) => {
      const footerFontSize = 9;
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerMargin = 50; // Increased margin for footer
      const footerY = pageHeight - footerMargin;

      // Current page and total pages
      const currentPage = data.pageNumber;
      const totalPages = doc.getNumberOfPages();

      doc.setFontSize(footerFontSize);
      doc.setFont("helvetica", "normal");

      // Left footer: "Page X of Y"
      const leftText = `Page ${currentPage} of ${totalPages}`;
      doc.text(leftText, data.settings.margin.left, footerY);

      // Right footer: formatted current date and time
      const rightText = `Report run on: ${formatDate(new Date())}`;
      const textWidth = doc.getTextWidth(rightText);
      doc.text(
        rightText,
        pageWidth - data.settings.margin.right - textWidth,
        footerY,
      );

      // Add totals on the last page with proper spacing check
      if (currentPage === totalPages && data.pageNumber === totalPages) {
        const finalY = (data as any).cursor?.y || data.settings.startY;
        const totalsStartY = finalY + 30; // More space after table
        const totalsSectionHeight = 60; // Approximate height for 3 total lines
        const minimumSpaceNeeded = totalsSectionHeight + 20; // Buffer space

        // Check if there's enough space for totals above footer
        if (totalsStartY + minimumSpaceNeeded <= footerY - 10) {
          // Enough space - add totals normally
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");

          // Total rows
          const totalRowsText = `Total Records: ${tableRows.length}`;
          doc.text(totalRowsText, marginX, totalsStartY);

          // Total original amount
          const totalOriginalText = `Total Original Amount: ${formatCurrency(totalOriginalAmount.toString())}`;
          doc.text(totalOriginalText, marginX, totalsStartY + 15);

          // Total balance amount
          const totalBalanceText = `Total Outstanding Balance: ${formatCurrency(totalBalanceAmount.toString())}`;
          doc.text(totalBalanceText, marginX, totalsStartY + 30);
        } else {
          // Not enough space - add totals on new page
          doc.addPage();
          const newPageY = 80; // Start position on new page

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");

          // Total rows
          const totalRowsText = `Total Records: ${tableRows.length}`;
          doc.text(totalRowsText, marginX, newPageY);

          // Total original amount
          const totalOriginalText = `Total Original Amount: ${formatCurrency(totalOriginalAmount.toString())}`;
          doc.text(totalOriginalText, marginX, newPageY + 15);

          // Total balance amount
          const totalBalanceText = `Total Outstanding Balance: ${formatCurrency(totalBalanceAmount.toString())}`;
          doc.text(totalBalanceText, marginX, newPageY + 30);
        }
      }
    },
  });

  // 6. Open PDF in new tab for preview
  const today = new Date();
  const dateString = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;
  const customerNameForFilename = customerName.replace(/[^a-zA-Z0-9]/g, "_");

  doc.output("dataurlnewwindow", {
    filename: `customer_receivables_${customerNameForFilename}_${dateString}.pdf`,
  });
};
