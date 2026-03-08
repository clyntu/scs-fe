import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MaturityTransaction {
  transaction_id: number;
  transaction_number: string;
  reference_number: string;
  transaction_date: string;
  due_date: string;
  gross_amount: string;
  discount_amount: string;
  customer_discount: string;
  transaction_discount: string;
  net_amount: string;
  net_balance: string;
}

interface MaturityCustomer {
  customer_name: string;
  transactions: MaturityTransaction[];
}

interface MaturityReport {
  report_date: string;
  customers: MaturityCustomer[];
  total_gross: string;
  total_discount_amount: string;
  total_net_amount: string;
  total_net_balance: string;
}

// Helper function to format the date with time
const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours || 12;
  const formattedHours = hours.toString().padStart(2, "0");

  return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
};

// Helper function to format date for display (from ISO string)
const formatDisplayDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

// Helper function to format currency
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const addCustomHeader = (
  doc: jsPDF,
  companyId: string,
  reportDate: string,
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  const title = companyId === "company-a" ? "P.P.T." : "MA Inc.";
  doc.text(title, 40, 40);

  // Report title aligned to the right
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Maturity of Receivables", pageWidth - 220, 40);

  // Report date below the title
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`as of ${formatDisplayDate(reportDate)}`, pageWidth - 220, 55);

  // Bottom border line
  doc.setLineWidth(0.5);
  doc.line(40, 65, pageWidth - 40, 65);
};

export const generateMaturityPDF = (
  data: MaturityReport,
  companyId: string,
): void => {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "A4",
  });

  addCustomHeader(doc, companyId, data.report_date);

  const tableColumnHeaders = [
    "Customer Name",
    "Tran.\nNo.",
    "Reference No.",
    "Trans.\nDate",
    "Due\nDate",
    "Gross",
    "Tran-Disc",
    "Cust-Disc",
    "Net\nAmount",
    "Net\nBalance",
  ];

  // Flatten customers → transactions into rows, sorted by transaction_date
  const tableRows: string[][] = [];
  for (const customer of data.customers) {
    // Sort transactions by transaction_date
    const sortedTransactions = [...customer.transactions].sort(
      (a, b) =>
        new Date(a.transaction_date).getTime() -
        new Date(b.transaction_date).getTime(),
    );

    for (const tx of sortedTransactions) {
      tableRows.push([
        customer.customer_name,
        tx.transaction_number,
        tx.reference_number || "",
        formatDisplayDate(tx.transaction_date),
        formatDisplayDate(tx.due_date),
        formatCurrency(tx.gross_amount),
        tx.transaction_discount || "0.00",
        tx.customer_discount || "0.00",
        formatCurrency(tx.net_amount),
        formatCurrency(tx.net_balance),
      ]);
    }
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  autoTable(doc, {
    startY: 80,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 50, left: marginX, right: marginX, bottom: 60 },
    theme: "grid",
    tableWidth: "wrap",
    columnStyles: {
      0: { cellWidth: 130, halign: "left" }, // Customer Name
      1: { cellWidth: 70, halign: "left" }, // Tran. No.
      2: { cellWidth: 110, halign: "left" }, // Reference No.
      3: { cellWidth: 75, halign: "center" }, // Trans. Date
      4: { cellWidth: 75, halign: "center" }, // Due Date
      5: { cellWidth: 75, halign: "right" }, // Gross
      6: { cellWidth: 55, halign: "right" }, // Tran-Disc
      7: { cellWidth: 55, halign: "right" }, // Cust-Disc
      8: { cellWidth: 75, halign: "right" }, // Net Amount
      9: { cellWidth: 75, halign: "right" }, // Net Balance
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
      // Right-align amount column headers
      if (hookData.section === "head") {
        if ([5, 6, 7, 8, 9].includes(hookData.column.index)) {
          hookData.cell.styles.halign = "right";
        }
      }
    },

    didDrawPage: (pageData) => {
      const footerFontSize = 9;
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 50;

      const currentPage = pageData.pageNumber;
      const totalPages = doc.getNumberOfPages();

      doc.setFontSize(footerFontSize);
      doc.setFont("helvetica", "normal");

      // Left footer: "Page X of Y"
      doc.text(
        `Page ${currentPage} of ${totalPages}`,
        pageData.settings.margin.left,
        footerY,
      );

      // Right footer: report run date
      const rightText = `Report run on: ${formatDate(new Date())}`;
      const textWidth = doc.getTextWidth(rightText);
      doc.text(
        rightText,
        pageWidth - pageData.settings.margin.right - textWidth,
        footerY,
      );

      // Add totals on the last page
      if (currentPage === totalPages && pageData.pageNumber === totalPages) {
        const finalY =
          (pageData as any).cursor?.y || pageData.settings.startY;
        const totalsStartY = finalY + 25;
        const totalsSectionHeight = 50;

        if (totalsStartY + totalsSectionHeight <= footerY - 10) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");

          doc.text(
            `Total Records: ${tableRows.length}`,
            marginX,
            totalsStartY,
          );
          doc.text(
            `Total Gross: ${formatCurrency(data.total_gross)}`,
            marginX,
            totalsStartY + 15,
          );
          doc.text(
            `Total Net Amount: ${formatCurrency(data.total_net_amount)}`,
            marginX,
            totalsStartY + 30,
          );
          doc.text(
            `Total Net Balance: ${formatCurrency(data.total_net_balance)}`,
            marginX,
            totalsStartY + 45,
          );
        } else {
          doc.addPage();
          const newPageY = 80;

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");

          doc.text(`Total Records: ${tableRows.length}`, marginX, newPageY);
          doc.text(
            `Total Gross: ${formatCurrency(data.total_gross)}`,
            marginX,
            newPageY + 15,
          );
          doc.text(
            `Total Net Amount: ${formatCurrency(data.total_net_amount)}`,
            marginX,
            newPageY + 30,
          );
          doc.text(
            `Total Net Balance: ${formatCurrency(data.total_net_balance)}`,
            marginX,
            newPageY + 45,
          );
        }
      }
    },
  });

  // Open PDF in new tab
  const today = new Date();
  const dateString = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;

  doc.output("dataurlnewwindow", {
    filename: `maturity_of_receivables_${dateString}.pdf`,
  });
};
