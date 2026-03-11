import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interface for customer sales analytics
interface CustomerSalesAnalytics {
  customer_id: number;
  customer_name: string;
  dr_count: number;
  dr_total: number;
  cr_count: number;
  cr_total: number;
  net_sales: number;
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
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format number with commas
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

const addCustomHeader = (doc: jsPDF, companyId: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  const title = companyId === "company-a" ? "P.P.T." : "MA Inc.";
  doc.text(title, 40, 40);

  // Report title aligned to the right
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Top Customers by Sales", pageWidth - 180, 40);

  // Bottom border line
  doc.setLineWidth(0.5);
  doc.line(40, 55, pageWidth - 40, 55); // Draw horizontal line
};

export const generateTopCustomersPDF = (
  data: CustomerSalesAnalytics[],
  companyId: string,
  filters?: {
    fromDate?: string;
    toDate?: string;
    limit?: number;
    total?: number;
  },
): void => {
  // 1. Initialize jsPDF
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: "landscape", // Use landscape for more columns
    unit: "pt",
    format: "A4",
  });

  addCustomHeader(doc, companyId);

  // Add filter information if any filters are applied
  let yPosition = 70;
  if (filters) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const filterTexts: string[] = [];
    if (filters.fromDate !== undefined && filters.fromDate !== "")
      filterTexts.push(`From: ${formatDisplayDate(filters.fromDate)}`);
    if (filters.toDate !== undefined && filters.toDate !== "")
      filterTexts.push(`To: ${formatDisplayDate(filters.toDate)}`);
    if (filters.limit !== undefined) {
      filterTexts.push(`Showing top ${filters.limit} customers`);
    }

    if (filterTexts.length > 0) {
      doc.text(`Filters: ${filterTexts.join(" | ")}`, 40, yPosition);
      yPosition += 15;
    }
  }

  // 2. Define columns and rows
  const tableColumnHeaders = [
    "Rank",
    "Customer Name",
    "DR Count",
    "DR Total",
    "CR Count",
    "CR Total",
    "Net Sales",
  ];

  const tableRows = data.map((item, index) => [
    (index + 1).toString(), // Rank
    item.customer_name,
    formatNumber(Number(item.dr_count) || 0),
    formatCurrency(Number(item.dr_total) || 0),
    formatNumber(Number(item.cr_count) || 0),
    formatCurrency(Number(item.cr_total) || 0),
    formatCurrency(Number(item.net_sales) || 0),
  ]);

  // 3. Calculate totals with proper number validation
  const totalDRCount = data.reduce((sum, item) => {
    const count = Number(item.dr_count) || 0;
    return sum + count;
  }, 0);

  const totalDRAmount = data.reduce((sum, item) => {
    const amount = Number(item.dr_total) || 0;
    return sum + amount;
  }, 0);

  const totalCRCount = data.reduce((sum, item) => {
    const count = Number(item.cr_count) || 0;
    return sum + count;
  }, 0);

  const totalCRAmount = data.reduce((sum, item) => {
    const amount = Number(item.cr_total) || 0;
    return sum + amount;
  }, 0);

  const totalNetSales = data.reduce((sum, item) => {
    const netSales = Number(item.net_sales) || 0;
    return sum + netSales;
  }, 0);

  // 4. Table setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40; // Fixed left margin for consistent positioning

  autoTable(doc, {
    startY: yPosition + 5,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 50, left: marginX, right: marginX, bottom: 60 },
    theme: "grid",
    tableWidth: "wrap",
    columnStyles: {
      0: { cellWidth: 50, halign: "center" }, // Rank
      1: { cellWidth: 200, halign: "left" }, // Customer Name
      2: { cellWidth: 80, halign: "center" }, // DR Count
      3: { cellWidth: 100, halign: "right" }, // DR Total
      4: { cellWidth: 80, halign: "center" }, // CR Count
      5: { cellWidth: 100, halign: "right" }, // CR Total
      6: { cellWidth: 100, halign: "right" }, // Net Sales
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
          hookData.column.index === 3 ||
          hookData.column.index === 5 ||
          hookData.column.index === 6
        ) {
          hookData.cell.styles.halign = "right";
        }
      }
      // Highlight negative net sales in red
      if (hookData.section === "body" && hookData.column.index === 6) {
        const netSales = Number(data[hookData.row.index].net_sales) || 0;
        if (netSales < 0) {
          hookData.cell.styles.textColor = [220, 53, 69]; // Red color for negative values
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
        const totalsSectionHeight = 90; // Approximate height for 5 total lines
        const minimumSpaceNeeded = totalsSectionHeight + 20; // Buffer space

        // Check if there's enough space for totals above footer
        if (totalsStartY + minimumSpaceNeeded <= footerY - 10) {
          // Enough space - add totals normally
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");

          // Total customers
          const totalCustomersText = `Total Customers: ${tableRows.length}`;
          doc.text(totalCustomersText, marginX, totalsStartY);

          // Total DR Count and Amount
          const totalDRText = `Total DRs: ${formatNumber(totalDRCount)} (${formatCurrency(totalDRAmount)})`;
          doc.text(totalDRText, marginX, totalsStartY + 15);

          // Total CR Count and Amount
          const totalCRText = `Total CRs: ${formatNumber(totalCRCount)} (${formatCurrency(totalCRAmount)})`;
          doc.text(totalCRText, marginX, totalsStartY + 30);

          // Total Net Sales
          const totalNetSalesText = `Total Net Sales: ${formatCurrency(totalNetSales)}`;
          doc.text(totalNetSalesText, marginX, totalsStartY + 45);

          // Show total available customers if filtered
          if (
            filters?.total !== undefined &&
            filters.total > tableRows.length
          ) {
            const availableText = `(Showing ${tableRows.length} of ${filters.total} total customers)`;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(availableText, marginX, totalsStartY + 60);
          }
        } else {
          // Not enough space - add totals on new page
          doc.addPage();
          const newPageY = 80; // Start position on new page

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");

          // Total customers
          const totalCustomersText = `Total Customers: ${tableRows.length}`;
          doc.text(totalCustomersText, marginX, newPageY);

          // Total DR Count and Amount
          const totalDRText = `Total DRs: ${formatNumber(totalDRCount)} (${formatCurrency(totalDRAmount)})`;
          doc.text(totalDRText, marginX, newPageY + 15);

          // Total CR Count and Amount
          const totalCRText = `Total CRs: ${formatNumber(totalCRCount)} (${formatCurrency(totalCRAmount)})`;
          doc.text(totalCRText, marginX, newPageY + 30);

          // Total Net Sales
          const totalNetSalesText = `Total Net Sales: ${formatCurrency(totalNetSales)}`;
          doc.text(totalNetSalesText, marginX, newPageY + 45);

          // Show total available customers if filtered
          if (
            filters?.total !== undefined &&
            filters.total > tableRows.length
          ) {
            const availableText = `(Showing ${tableRows.length} of ${filters.total} total customers)`;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(availableText, marginX, newPageY + 60);
          }
        }
      }
    },
  });

  // 6. Open PDF in new tab for preview
  const today = new Date();
  const dateString = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;

  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
};
