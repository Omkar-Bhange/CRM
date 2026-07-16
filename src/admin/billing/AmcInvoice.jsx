import { useRef, useState } from "react";
import jsPDF from "jspdf";
import {
  Building2,
  CalendarDays,
  Download,
  FileText,
  IndianRupee,
  Printer,
  X,
} from "lucide-react";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function amountToWords(amount) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertBelowHundred = (number) => {
    if (number < 20) return ones[number];

    return `${tens[Math.floor(number / 10)]} ${
      ones[number % 10]
    }`.trim();
  };

  const convertBelowThousand = (number) => {
    if (number < 100) return convertBelowHundred(number);

    return `${ones[Math.floor(number / 100)]} Hundred ${
      convertBelowHundred(number % 100)
    }`.trim();
  };

  const numericAmount = Math.floor(Number(amount || 0));

  if (numericAmount === 0) {
    return "Zero Rupees Only";
  }

  let remaining = numericAmount;
  const words = [];

  const crore = Math.floor(remaining / 10000000);

  if (crore) {
    words.push(`${convertBelowThousand(crore)} Crore`);
    remaining %= 10000000;
  }

  const lakh = Math.floor(remaining / 100000);

  if (lakh) {
    words.push(`${convertBelowThousand(lakh)} Lakh`);
    remaining %= 100000;
  }

  const thousand = Math.floor(remaining / 1000);

  if (thousand) {
    words.push(`${convertBelowThousand(thousand)} Thousand`);
    remaining %= 1000;
  }

  if (remaining) {
    words.push(convertBelowThousand(remaining));
  }

  return `${words.join(" ")} Rupees Only`;
}

function safeFileName(value) {
  return String(value || "AMC-Invoice")
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AmcInvoice({
  record,
  onClose,
  company = {
    name: "Total Solution",
    subtitle: "Software Solutions & Support Services",
    address:
      "Office No. 101, Business Park, Pune, Maharashtra - 411001",
    phone: "+91 98765 43210",
    email: "support@totalsolution.com",
    gstNo: "27ABCDE1234F1Z5",
    panNo: "ABCDE1234F",
    bankName: "State Bank of India",
    accountName: "Total Solution",
    accountNo: "12345678901",
    ifsc: "SBIN0001234",
    branch: "Pune Main Branch",
  },
}) {
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!record) return null;

  const invoiceNo =
    record.invoiceNo || `AMC-${new Date().getFullYear()}-${record.id}`;

  const invoiceDate =
    record.invoiceDate ||
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const taxableAmount = Number(record.amount || 0);
  const cgstRate = 9;
  const sgstRate = 9;
  const cgstAmount = taxableAmount * (cgstRate / 100);
  const sgstAmount = taxableAmount * (sgstRate / 100);
  const totalTax = cgstAmount + sgstAmount;
  const grandTotal = taxableAmount + totalTax;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      pdf.setProperties({
        title: `AMC Invoice ${invoiceNo}`,
        subject: `Annual Maintenance Contract invoice for ${record.client}`,
        author: company.name,
      });

      // Header
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 34, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(company.name, margin, 14);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(company.subtitle, margin, 20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("AMC INVOICE", pageWidth - margin, 15, {
        align: "right",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(invoiceNo, pageWidth - margin, 21, {
        align: "right",
      });

      // Company information
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(8.5);

      const companyAddressLines = pdf.splitTextToSize(
        company.address,
        100
      );

      pdf.text(companyAddressLines, margin, 43);
      pdf.text(`Phone: ${company.phone}`, margin, 51);
      pdf.text(`Email: ${company.email}`, margin, 56);
      pdf.text(`GSTIN: ${company.gstNo}`, margin, 61);

      pdf.setFont("helvetica", "bold");
      pdf.text("Invoice Date", 145, 43);

      pdf.setFont("helvetica", "normal");
      pdf.text(invoiceDate, pageWidth - margin, 43, {
        align: "right",
      });

      pdf.setFont("helvetica", "bold");
      pdf.text("Due Date", 145, 50);

      pdf.setFont("helvetica", "normal");
      pdf.text(record.dueDate || "-", pageWidth - margin, 50, {
        align: "right",
      });

      pdf.setFont("helvetica", "bold");
      pdf.text("Contract No.", 145, 57);

      pdf.setFont("helvetica", "normal");
      pdf.text(
        record.contractNo || "-",
        pageWidth - margin,
        57,
        { align: "right" }
      );

      // Client box
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, 69, contentWidth, 35, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("BILL TO", margin + 5, 77);

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(11);
      pdf.text(record.client || "-", margin + 5, 85);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(
        `Contact: ${record.contactPerson || "-"}`,
        margin + 5,
        92
      );
      pdf.text(`Mobile: ${record.mobile || "-"}`, margin + 5, 98);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(100, 116, 139);
      pdf.text("SOFTWARE", 124, 77);

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.text(`${record.product || "-"}`, 124, 85);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(
        `${record.plan || "-"} Plan | ${record.users || 0} Users`,
        124,
        92
      );
      pdf.text(`Version: ${record.version || "-"}`, 124, 98);

      // Table header
      const tableTop = 114;
      const columns = [margin, 27, 116, 143, 166, pageWidth - margin];

      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, tableTop, contentWidth, 10, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);

      pdf.text("SR", columns[0] + 3, tableTop + 6.5);
      pdf.text("DESCRIPTION", columns[1] + 3, tableTop + 6.5);
      pdf.text("PERIOD", columns[2] + 3, tableTop + 6.5);
      pdf.text("QTY", columns[3] + 3, tableTop + 6.5);
      pdf.text("RATE", columns[4] + 3, tableTop + 6.5);
      pdf.text("AMOUNT", columns[5] - 3, tableTop + 6.5, {
        align: "right",
      });

      // Table body
      const rowTop = tableTop + 10;
      const rowHeight = 31;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin, rowTop, contentWidth, rowHeight, "FD");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);

      pdf.text("1", columns[0] + 3, rowTop + 8);

      pdf.setFont("helvetica", "bold");
      pdf.text(
        `Annual Maintenance Contract - ${record.product}`,
        columns[1] + 3,
        rowTop + 8
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);

      const descriptionLines = pdf.splitTextToSize(
        `${record.plan} support plan including software updates, remote support and maintenance services.`,
        80
      );

      pdf.text(descriptionLines, columns[1] + 3, rowTop + 14);

      pdf.setFontSize(8);
      pdf.text(
        `${record.startDate || "-"}\nto ${record.expiryDate || "-"}`,
        columns[2] + 3,
        rowTop + 8
      );

      pdf.text("1", columns[3] + 7, rowTop + 8);

      pdf.text(
        taxableAmount.toFixed(2),
        columns[5] - 28,
        rowTop + 8,
        { align: "right" }
      );

      pdf.setFont("helvetica", "bold");
      pdf.text(
        taxableAmount.toFixed(2),
        columns[5] - 3,
        rowTop + 8,
        { align: "right" }
      );

      // Totals
      const totalsTop = rowTop + rowHeight + 5;
      const labelX = 137;
      const valueX = pageWidth - margin;

      const totalLine = (label, value, y, bold = false) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(bold ? 10 : 8.5);
        pdf.setTextColor(51, 65, 85);
        pdf.text(label, labelX, y);
        pdf.text(value, valueX, y, { align: "right" });
      };

      totalLine(
        "Taxable Amount",
        taxableAmount.toFixed(2),
        totalsTop
      );

      totalLine(
        `CGST @ ${cgstRate}%`,
        cgstAmount.toFixed(2),
        totalsTop + 7
      );

      totalLine(
        `SGST @ ${sgstRate}%`,
        sgstAmount.toFixed(2),
        totalsTop + 14
      );

      pdf.setDrawColor(203, 213, 225);
      pdf.line(labelX, totalsTop + 18, valueX, totalsTop + 18);

      totalLine(
        "Grand Total",
        grandTotal.toFixed(2),
        totalsTop + 26,
        true
      );

      // Amount in words
      const wordsTop = totalsTop + 39;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, wordsTop, contentWidth, 18, 2, 2, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("AMOUNT IN WORDS", margin + 5, wordsTop + 6);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);

      const wordLines = pdf.splitTextToSize(
        amountToWords(grandTotal),
        contentWidth - 10
      );

      pdf.text(wordLines, margin + 5, wordsTop + 13);

      // Bank details
      const bankTop = wordsTop + 25;

      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, bankTop, 105, 45, 2, 2, "D");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Bank Details", margin + 5, bankTop + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Bank: ${company.bankName}`, margin + 5, bankTop + 16);
      pdf.text(
        `Account Name: ${company.accountName}`,
        margin + 5,
        bankTop + 22
      );
      pdf.text(
        `Account No: ${company.accountNo}`,
        margin + 5,
        bankTop + 28
      );
      pdf.text(`IFSC: ${company.ifsc}`, margin + 5, bankTop + 34);
      pdf.text(`Branch: ${company.branch}`, margin + 5, bankTop + 40);

      // Signature
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(124, bankTop, 72, 45, 2, 2, "D");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`For ${company.name}`, 160, bankTop + 8, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Authorized Signatory", 160, bankTop + 38, {
        align: "center",
      });

      // Footer
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);

      pdf.text(
        "This is a computer-generated invoice and does not require a physical signature.",
        pageWidth / 2,
        283,
        { align: "center" }
      );

      pdf.text(
        `PAN: ${company.panNo} | GSTIN: ${company.gstNo}`,
        pageWidth / 2,
        288,
        { align: "center" }
      );

      pdf.save(
        `${safeFileName(invoiceNo)}-${safeFileName(
          record.client
        )}.pdf`
      );
    } catch (error) {
      console.error("Unable to generate AMC invoice PDF:", error);
      alert("Unable to generate invoice PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-600">
              <FileText size={15} />
              Invoice Preview
            </div>

            <h2 className="mt-1 text-base font-semibold text-slate-950">
              {invoiceNo}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Review the AMC invoice before printing or downloading.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Printer size={15} />
              Print
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={15} />
              {downloading ? "Generating..." : "Download PDF"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <article
          ref={invoiceRef}
          className="min-h-[1120px] overflow-hidden bg-white shadow-2xl print:min-h-0 print:shadow-none"
        >
          <header className="flex items-start justify-between bg-violet-600 px-10 py-8 text-white">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <Building2 size={22} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-[-0.03em]">
                    {company.name}
                  </h1>

                  <p className="mt-1 text-xs text-violet-100">
                    {company.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold tracking-[0.08em]">
                AMC INVOICE
              </p>

              <p className="mt-2 text-sm text-violet-100">
                {invoiceNo}
              </p>
            </div>
          </header>

          <div className="px-10 py-8">
            <section className="grid gap-8 border-b border-slate-200 pb-7 md:grid-cols-2">
              <div className="text-xs leading-6 text-slate-600">
                <p>{company.address}</p>
                <p>Phone: {company.phone}</p>
                <p>Email: {company.email}</p>
                <p>GSTIN: {company.gstNo}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right text-xs">
                <div>
                  <p className="font-semibold text-slate-400">
                    Invoice Date
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {invoiceDate}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-400">
                    Due Date
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {record.dueDate || "-"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-400">
                    Contract No.
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {record.contractNo || "-"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-400">
                    Payment Status
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {record.status || "-"}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-7 grid gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Bill To
                </p>

                <h2 className="mt-2 text-base font-semibold text-slate-950">
                  {record.client}
                </h2>

                <p className="mt-2 text-xs text-slate-500">
                  Contact: {record.contactPerson || "-"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Mobile: {record.mobile || "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Software Information
                </p>

                <h2 className="mt-2 text-base font-semibold text-slate-950">
                  {record.product}
                </h2>

                <p className="mt-2 text-xs text-slate-500">
                  {record.plan} Plan · {record.users} Users
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Version: {record.version || "-"}
                </p>
              </div>
            </section>

            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="w-14 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Sr.
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Description
                    </th>

                    <th className="w-44 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      AMC Period
                    </th>

                    <th className="w-16 px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Qty
                    </th>

                    <th className="w-32 px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Rate
                    </th>

                    <th className="w-32 px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="align-top">
                    <td className="border-t border-slate-200 px-4 py-5 text-sm text-slate-600">
                      1
                    </td>

                    <td className="border-t border-slate-200 px-4 py-5">
                      <p className="text-sm font-semibold text-slate-900">
                        Annual Maintenance Contract - {record.product}
                      </p>

                      <p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">
                        {record.plan} support plan including software
                        updates, maintenance support and remote technical
                        assistance.
                      </p>
                    </td>

                    <td className="border-t border-slate-200 px-4 py-5 text-xs leading-5 text-slate-600">
                      <p>{record.startDate}</p>
                      <p>to {record.expiryDate}</p>
                    </td>

                    <td className="border-t border-slate-200 px-4 py-5 text-right text-sm text-slate-600">
                      1
                    </td>

                    <td className="border-t border-slate-200 px-4 py-5 text-right text-sm text-slate-600">
                      {formatCurrency(taxableAmount)}
                    </td>

                    <td className="border-t border-slate-200 px-4 py-5 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(taxableAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mt-7 grid gap-8 md:grid-cols-[1fr_340px]">
              <div>
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Amount in words
                  </p>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    {amountToWords(grandTotal)}
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold text-slate-900">
                    Terms & Conditions
                  </p>

                  <ol className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
                    <li>
                      1. AMC support is valid only for the stated contract
                      period.
                    </li>
                    <li>
                      2. New custom development is not included unless
                      separately approved.
                    </li>
                    <li>
                      3. Payment should be completed on or before the due
                      date.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Taxable Amount</span>
                  <span>{formatCurrency(taxableAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>CGST @ {cgstRate}%</span>
                  <span>{formatCurrency(cgstAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>SGST @ {sgstRate}%</span>
                  <span>{formatCurrency(sgstAmount)}</span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold text-slate-950">
                    <span>Grand Total</span>

                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-violet-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-700">
                    <IndianRupee size={15} />
                    Payment Summary
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-violet-700">
                    <span>Paid</span>
                    <span>{formatCurrency(record.paidAmount)}</span>
                  </div>

                  <div className="mt-2 flex justify-between text-xs font-semibold text-violet-900">
                    <span>Pending</span>
                    <span>{formatCurrency(record.pendingAmount)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10 grid gap-8 border-t border-slate-200 pt-8 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">
                  Bank Details
                </h3>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>Bank: {company.bankName}</p>
                  <p>Account Name: {company.accountName}</p>
                  <p>Account No: {company.accountNo}</p>
                  <p>IFSC: {company.ifsc}</p>
                  <p>Branch: {company.branch}</p>
                </div>
              </div>

              <div className="flex min-h-32 flex-col items-center justify-between rounded-xl border border-slate-200 p-5 text-center">
                <p className="text-xs font-semibold text-slate-900">
                  For {company.name}
                </p>

                <p className="text-xs text-slate-500">
                  Authorized Signatory
                </p>
              </div>
            </section>

            <footer className="mt-8 border-t border-slate-200 pt-5 text-center text-[10px] leading-5 text-slate-400">
              <p>
                This is a computer-generated invoice and does not require a
                physical signature.
              </p>

              <p>
                PAN: {company.panNo} · GSTIN: {company.gstNo}
              </p>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}