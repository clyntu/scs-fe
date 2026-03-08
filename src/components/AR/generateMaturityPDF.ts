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
  const marginX = 40;

  // Company Name (bold)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  const title = companyId === "company-a" ? "P.P.T." : "MA Inc.";
  doc.text(title, marginX, 40);

  // Report title aligned to the right margin
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Maturity of Receivables", pageWidth - marginX, 40, {
    align: "right",
  });

  // Report date below the title, also right-aligned
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`as of ${formatDisplayDate(reportDate)}`, pageWidth - marginX, 55, {
    align: "right",
  });

  // Bottom border line
  doc.setLineWidth(0.5);
  doc.line(marginX, 65, pageWidth - marginX, 65);
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
    "Tran. No.",
    "Reference No.",
    "Trans. Date",
    "Due Date",
    "Gross",
    "Tran-Disc",
    "Cust-Disc",
    "Net Amount",
    "Net Balance",
  ];

  // Flatten customers → transactions into rows
  interface RawRow {
    customerName: string;
    transactionNumber: string;
    referenceNumber: string;
    transactionDate: string;
    dueDate: string;
    grossAmount: string;
    transactionDiscount: string;
    customerDiscount: string;
    netAmount: string;
    netBalance: string;
  }

  const rawRows: RawRow[] = [];
  for (const customer of data.customers) {
    for (const tx of customer.transactions) {
      rawRows.push({
        customerName: customer.customer_name,
        transactionNumber: tx.transaction_number.replace(/^DR /, "CDR "),
        referenceNumber: tx.reference_number || "",
        transactionDate: tx.transaction_date,
        dueDate: tx.due_date,
        grossAmount: tx.gross_amount,
        transactionDiscount: tx.transaction_discount || "0.00",
        customerDiscount: tx.customer_discount || "0.00",
        netAmount: tx.net_amount,
        netBalance: tx.net_balance,
      });
    }
  }

  // Sort all rows by transaction date ascending
  rawRows.sort(
    (a, b) =>
      new Date(a.transactionDate).getTime() -
      new Date(b.transactionDate).getTime(),
  );

  // Format rows for table
  const tableRows: string[][] = rawRows.map((row) => [
    row.customerName,
    row.transactionNumber,
    row.referenceNumber,
    formatDisplayDate(row.transactionDate),
    formatDisplayDate(row.dueDate),
    formatCurrency(row.grossAmount),
    row.transactionDiscount,
    row.customerDiscount,
    formatCurrency(row.netAmount),
    formatCurrency(row.netBalance),
  ]);

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  autoTable(doc, {
    startY: 80,
    head: [tableColumnHeaders],
    body: tableRows,
    margin: { top: 80, left: marginX, right: marginX, bottom: 60 },
    theme: "plain",
    tableWidth: "wrap",
    showHead: "everyPage",
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      lineWidth: 0,
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: 0.5,
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      0: { cellWidth: 120, halign: "left" }, // Customer Name
      1: { cellWidth: 55, halign: "left" }, // Tran. No.
      2: { cellWidth: 100, halign: "left" }, // Reference No.
      3: { cellWidth: 70, halign: "center" }, // Trans. Date
      4: { cellWidth: 70, halign: "center" }, // Due Date
      5: { cellWidth: 72, halign: "right" }, // Gross
      6: { cellWidth: 65, halign: "right" }, // Tran-Disc
      7: { cellWidth: 65, halign: "right" }, // Cust-Disc
      8: { cellWidth: 72, halign: "right" }, // Net Amount
      9: { cellWidth: 72, halign: "right" }, // Net Balance
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
      // Add custom header on pages after the first
      if (pageData.pageNumber > 1) {
        addCustomHeader(doc, companyId, data.report_date);
      }
    },
  });

  // Add totals after the table
  const finalY = (doc as any).lastAutoTable?.finalY || 80;
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 50;
  const totalsStartY = finalY + 25;
  const totalsSectionHeight = 50;

  if (totalsStartY + totalsSectionHeight <= footerY - 10) {
    // Enough space on current page
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Records: ${tableRows.length}`, marginX, totalsStartY);
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
    // Add totals on a new page
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

  // Second pass: add page numbers and report run date on every page
  const totalPages = doc.getNumberOfPages();
  const footerFontSize = 9;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(footerFontSize);
    doc.setFont("helvetica", "normal");

    // Left footer: "Page X of Y"
    doc.text(`Page ${i} of ${totalPages}`, marginX, footerY);

    // Right footer: report run date
    const rightText = `Report run on: ${formatDate(new Date())}`;
    const textWidth = doc.getTextWidth(rightText);
    doc.text(rightText, pageWidth - marginX - textWidth, footerY);
  }

  // Open PDF in new tab
  const today = new Date();
  const dateString = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;

  doc.output("dataurlnewwindow", {
    filename: `maturity_of_receivables_${dateString}.pdf`,
  });
};
