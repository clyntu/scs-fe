import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define the interface for payment history item based on the API endpoint
interface PaymentHistoryItem {
  id: number;
  reference_number: string | null;
  status: "unposted" | "posted";
  transaction_date: string;
  payment_method: "cash" | "check";
  payment_amount: string;
  check_amount: string | null;
  check_date: string | null;
  payment_date: string; // Computed field - use this for display
  payment_status: "pending" | "cleared" | "cancelled" | "reversed";
  clearing_date: string | null;
  total_applied: string;
  less_amount: string;
  add_amount: string;
  remarks: string | null;
  reversal_date: string | null;
  reversal_reason: string | null;
  customer: {
    customer_id: number;
    name: string;
  } | null;
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

  // Customer Payment History title aligned to the right
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Payment History", pageWidth - 200, 40);

  // Customer name below the title
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${customerName}`, 40, 55);

  // Bottom border line - just below the customer name
  doc.setLineWidth(0.5);
  doc.line(40, 65, pageWidth - 40, 65); // Draw horizontal line
};

export const generateCustomerPaymentHistoryPDF = (
  data: PaymentHistoryItem[],
  companyId: string,
  customerName: string,
  filters?: {
    fromDate?: string;
    toDate?: string;
    paymentMethod?: string;
    paymentStatus?: string;
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
    if (filters.paymentMethod && filters.paymentMethod !== "all") {
      filterTexts.push(
        `Payment Method: ${filters.paymentMethod.toUpperCase()}`,
      );
    }
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      filterTexts.push(`Status: ${filters.paymentStatus.toUpperCase()}`);
    }

    if (filterTexts.length > 0) {
      doc.text(`Filters: ${filterTexts.join(" | ")}`, 40, yPosition);
      yPosition += 15;
    }
  }

  // 2. Define columns and rows
  const tableColumnHeaders = [
    "AR ID",
    "Payment Date",
    "Ref. Number",
    "Payment Method",
    "Payment Amount",
    "Applied Amount",
    "Status",
    "Clearing Date",
    "Remarks",
  ];

  const tableRows = data.map((item) => [
    item.id.toString(),
    formatDisplayDate(item.payment_date),
    item.reference_number || "N/A",
    item.payment_method.toUpperCase(),
    formatCurrency(item.payment_amount),
    formatCurrency(item.total_applied),
    item.payment_status.toUpperCase(),
    item.clearing_date ? formatDisplayDate(item.clearing_date) : "N/A",
    item.remarks || "N/A",
  ]);

  // 3. Calculate total amounts
  const totalPaymentAmount = data.reduce(
    (sum, item) => sum + parseFloat(item.payment_amount),
    0,
  );
  const totalAppliedAmount = data.reduce(
    (sum, item) => sum + parseFloat(item.total_applied),
    0,
  );

  // 4. Table setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = 780; // Adjust for landscape orientation with new AR ID column
  const marginX = (pageWidth - tableWidth) / 2; // center horizontally

  autoTable(doc, {
    startY: yPosition + 5,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 50, left: marginX },
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 60, halign: "center" }, // AR ID
      1: { cellWidth: 80, halign: "center" }, // Payment Date
      2: { cellWidth: 80, halign: "center" }, // Ref Number
      3: { cellWidth: 70, halign: "center" }, // Payment Method
      4: { cellWidth: 90, halign: "right" }, // Payment Amount
      5: { cellWidth: 90, halign: "right" }, // Applied Amount
      6: { cellWidth: 70, halign: "center" }, // Status
      7: { cellWidth: 80, halign: "center" }, // Clearing Date
      8: { cellWidth: 160, halign: "left" }, // Remarks
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
      // Style header cells
      if (hookData.section === "head") {
        if (hookData.column.index === 4 || hookData.column.index === 5) {
          hookData.cell.styles.halign = "right";
        }
      }
    },

    // 5. Add footer and totals using didDrawPage
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

      // Add totals on the last page
      if (currentPage === totalPages && data.pageNumber === totalPages) {
        const finalY = (data as any).cursor?.y || data.settings.startY;

        // Add some space before totals
        const totalsY = finalY + 20;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        // Total rows
        const totalRowsText = `Total Records: ${tableRows.length}`;
        doc.text(totalRowsText, marginX, totalsY);

        // Total payment amount
        const totalPaymentText = `Total Payment Amount: ${formatCurrency(totalPaymentAmount.toString())}`;
        doc.text(totalPaymentText, marginX, totalsY + 15);

        // Total applied amount
        const totalAppliedText = `Total Applied Amount: ${formatCurrency(totalAppliedAmount.toString())}`;
        doc.text(totalAppliedText, marginX, totalsY + 30);
      }
    },
  });

  // 6. Open PDF in new tab for preview
  const today = new Date();
  const dateString = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;
  const customerNameForFilename = customerName.replace(/[^a-zA-Z0-9]/g, "_");

  doc.output("dataurlnewwindow", {
    filename: `customer_payment_history_${customerNameForFilename}_${dateString}.pdf`,
  });
};
