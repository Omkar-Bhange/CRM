import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  FileText,
  CreditCard,
  ShieldCheck,
  Clock,
  Sparkles,
  Receipt,
  Info,
} from "lucide-react";
import API_URL from "../../config/api";

const getAuthToken = () =>
  localStorage.getItem("client-connect-token") ||
  sessionStorage.getItem("client-connect-token") ||
  localStorage.getItem("token") ||
  "";

function roundAmount(val) {
  return Number(Number(val || 0).toFixed(2));
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addDurationToDate(startDateStr, durationMonths) {
  if (!startDateStr) return "";
  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) return "";

  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + durationMonths);
  expiry.setDate(expiry.getDate() - 1);
  return expiry.toISOString().slice(0, 10);
}

export default function RenewAmcModal({
  isOpen,
  contract,
  client,
  onClose,
  onSuccess,
  onViewInvoice,
  onRecordPayment,
}) {
  const [duration, setDuration] = useState("1year"); // "6months" | "1year" | "2years" | "custom"
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [plan, setPlan] = useState("Standard");
  const [licensedUsers, setLicensedUsers] = useState(1);
  const [basicAmount, setBasicAmount] = useState(0);
  const [gstApplicable, setGstApplicable] = useState("YES");
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successResult, setSuccessResult] = useState(null);

  // Initialize form when modal opens with contract
  useEffect(() => {
    if (isOpen && contract) {
      setErrorMessage("");
      setSuccessResult(null);

      // Determine next start date (day after current expiry, or today if expired)
      const baseExpiry = contract.expiryDate ? new Date(contract.expiryDate) : new Date();
      const nextStart = new Date(baseExpiry);
      nextStart.setDate(nextStart.getDate() + 1);
      const formattedStartDate = nextStart.toISOString().slice(0, 10);

      const formattedExpiryDate = addDurationToDate(formattedStartDate, 12);
      const formattedDueDate = formattedStartDate;

      setStartDate(formattedStartDate);
      setExpiryDate(formattedExpiryDate);
      setDueDate(formattedDueDate);
      setDuration("1year");

      setPlan(contract.plan || "Standard");
      setLicensedUsers(contract.licensedUsers || 1);
      setBasicAmount(contract.taxableAmount || contract.totalAmount || 0);

      // Inherit previous GST applicability
      const prevGst = String(contract.gstApplicable || "YES").toUpperCase() === "NO" ? "NO" : "YES";
      setGstApplicable(prevGst);
      setGstRate(18);
      setNotes("");

      // Generate unique idempotency key for this session
      const idempKey = `amc_renew_${contract._id || contract.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      setIdempotencyKey(idempKey);
    }
  }, [isOpen, contract]);

  // Handle duration preset clicks
  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    if (!startDate) return;

    if (newDuration === "6months") {
      setExpiryDate(addDurationToDate(startDate, 6));
    } else if (newDuration === "1year") {
      setExpiryDate(addDurationToDate(startDate, 12));
    } else if (newDuration === "2years") {
      setExpiryDate(addDurationToDate(startDate, 24));
    }
  };

  // When start date changes manually, recalculate expiry date based on current duration
  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (!dueDate || dueDate === startDate) {
      setDueDate(newStart);
    }
    if (duration === "6months") {
      setExpiryDate(addDurationToDate(newStart, 6));
    } else if (duration === "1year") {
      setExpiryDate(addDurationToDate(newStart, 12));
    } else if (duration === "2years") {
      setExpiryDate(addDurationToDate(newStart, 24));
    }
  };

  // Determine Place of Supply (POS)
  const clientState = String(
    client?.billingAddress?.state || client?.state || contract?.clientState || ""
  ).trim();
  const isMaharashtra =
    !clientState ||
    clientState.toLowerCase() === "maharashtra" ||
    clientState.toLowerCase() === "mh" ||
    clientState === "27";

  const taxType = isMaharashtra ? "intra" : "inter";

  // Calculate live financial summary matching backend authoritative formulas
  const financialPreview = useMemo(() => {
    const taxable = roundAmount(basicAmount);
    if (gstApplicable === "NO" || taxable <= 0) {
      return {
        taxableAmount: taxable,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        totalTaxAmount: 0,
        totalAmount: taxable,
        taxType,
        taxClassification: "Non-GST Supply",
      };
    }

    const rate = Number(gstRate || 18);
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;

    if (taxType === "intra") {
      cgstRate = rate / 2;
      sgstRate = rate / 2;
    } else {
      igstRate = rate;
    }

    const cgstAmount = roundAmount((taxable * cgstRate) / 100);
    const sgstAmount = roundAmount((taxable * sgstRate) / 100);
    const igstAmount = roundAmount((taxable * igstRate) / 100);
    const totalTaxAmount = roundAmount(cgstAmount + sgstAmount + igstAmount);
    const totalAmount = roundAmount(taxable + totalTaxAmount);

    return {
      taxableAmount: taxable,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTaxAmount,
      totalAmount,
      taxType,
      taxClassification: `Standard Rate (${rate}%)`,
    };
  }, [basicAmount, gstApplicable, gstRate, taxType]);

  // Handle Form Submission
  const handleSubmitRenewal = async (e) => {
    e?.preventDefault();
    const targetContractId = contract?._id || contract?.id;
    if (!targetContractId) return;

    if (!startDate || !expiryDate) {
      setErrorMessage("Please select valid start and expiry dates.");
      return;
    }

    if (new Date(expiryDate) <= new Date(startDate)) {
      setErrorMessage("Expiry date must be strictly after the start date.");
      return;
    }

    if (!basicAmount || Number(basicAmount) <= 0) {
      setErrorMessage("Please enter a valid AMC basic amount.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/admin/amc/contract/${targetContractId}/renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate,
          expiryDate,
          dueDate: dueDate || startDate,
          plan,
          licensedUsers: Number(licensedUsers || 1),
          taxableAmount: Number(basicAmount),
          gstApplicable,
          taxType,
          gstRate: Number(gstRate || 18),
          taxClassification: financialPreview.taxClassification,
          idempotencyKey,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to process AMC renewal.");
      }

      const returnedData = result.data || result;
      setSuccessResult(returnedData);
      if (onSuccess) {
        onSuccess(returnedData);
      }
    } catch (err) {
      console.error("Renewal submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during AMC renewal.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-[4px] overflow-y-auto">
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fafc] shadow-[0_32px_100px_rgba(15,23,42,0.30)] my-auto max-h-[92vh]">
        {/* Header - Nexora Signature Gradient */}
        <div className="relative flex min-h-[84px] shrink-0 items-center justify-between overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 px-6 sm:px-7 text-white">
          <div className="flex items-center space-x-3.5">
            <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-inner backdrop-blur-md">
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  AMC Lifecycle
                </span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white/90">
                  {contract.contractCode || contract.code || "AMC"}
                </span>
              </div>
              <h2 className="mt-0.5 text-base sm:text-lg font-extrabold tracking-tight text-white">
                Renew AMC Contract
              </h2>
              <p className="text-[11px] font-medium text-blue-100/90 truncate max-w-[320px] sm:max-w-md">
                {contract.clientName || contract.client} · {contract.productName || contract.product}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-5 sm:p-6">
          {successResult ? (
            /* Post-Renewal Success View */
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 to-white p-6 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight text-slate-900">
                  AMC Contract Successfully Renewed!
                </h3>
                <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
                  {successResult.isEarlyRenewal
                    ? "Future renewal scheduled and invoice issued. Current ongoing coverage remains active until its scheduled expiry."
                    : "Renewal invoice generated and contract active cycle updated seamlessly."}
                </p>
              </div>

              {/* Invoice Summary Box */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Generated Renewal Invoice
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
                    {successResult.invoice?.invoiceCode || "Generated"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Start Date
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatDate(successResult.invoice?.contractStartDate || startDate)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Expiry Date
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatDate(successResult.invoice?.contractExpiryDate || expiryDate)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Basic / Taxable
                    </span>
                    <span className="font-bold text-slate-800">
                      ₹{(successResult.invoice?.taxableAmount || basicAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Payment Status
                    </span>
                    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/10">
                      Pending
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4 text-white">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Invoice Amount Due
                    </span>
                    <span className="text-xs text-slate-300">
                      Includes authoritative GST calculations
                    </span>
                  </div>
                  <span className="font-mono text-xl font-black text-emerald-400">
                    ₹{(successResult.invoice?.totalAmount || financialPreview.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onViewInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewInvoice(successResult.invoice);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>View / Print Invoice</span>
                  </button>
                )}

                {onRecordPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordPayment(contract, successResult.invoice);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Record Payment</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Configuration & Renewal Form */
            <form onSubmit={handleSubmitRenewal} className="space-y-5">
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 shadow-sm animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Section 1: Previous AMC Reference (Read-Only) */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Previous AMC Contract Overview
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                    Existing Reference
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Existing Expiry
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatDate(contract.expiryDate)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Previous Plan
                    </span>
                    <span className="font-bold text-slate-800">
                      {contract.plan || "Standard"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Previous Basic
                    </span>
                    <span className="font-bold text-slate-800">
                      ₹{(contract.taxableAmount || contract.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Previous GST
                    </span>
                    <span className="font-bold text-slate-800">
                      {String(contract.gstApplicable || "YES").toUpperCase() === "NO" ? "NO (0%)" : "YES (18%)"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Section 2: Renewal Period & Duration Presets */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Renewal Duration & Coverage Dates
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1.5 rounded-xl bg-slate-100 p-1">
                    {[
                      { id: "6months", label: "6 Months" },
                      { id: "1year", label: "1 Year" },
                      { id: "2years", label: "2 Years" },
                      { id: "custom", label: "Custom" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleDurationChange(opt.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                          duration === opt.id
                            ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => {
                        setExpiryDate(e.target.value);
                        setDuration("custom");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Invoice Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      AMC Plan
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <option value="Basic">Basic Plan</option>
                      <option value="Standard">Standard Plan</option>
                      <option value="Premium">Premium Plan</option>
                      <option value="Custom">Custom Plan</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Basic AMC Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={basicAmount}
                        onChange={(e) => setBasicAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: GST Applicability & Place of Supply */}
              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5 shadow-[0_4px_16px_rgba(99,102,241,0.04)] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-indigo-950">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      <span>GST Applicability Setting</span>
                    </span>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Defaulted to previous AMC contract setting ({contract.gstApplicable || "YES"})
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 rounded-xl border border-indigo-200/80 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setGstApplicable("YES")}
                      className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                        gstApplicable === "YES"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstApplicable("NO")}
                      className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                        gstApplicable === "NO"
                          ? "bg-slate-800 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      NO (0%)
                    </button>
                  </div>
                </div>

                {gstApplicable === "YES" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="rounded-xl border border-indigo-100/80 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Place of Supply / Tax Type
                      </span>
                      <span className="font-bold text-slate-800">
                        {taxType === "intra"
                          ? "Intra-State: MH (27) ➔ MH (CGST + SGST)"
                          : `Inter-State: MH (27) ➔ ${clientState || "Other"} (IGST)`}
                      </span>
                    </div>
                    <div className="rounded-xl border border-indigo-100/80 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Applicable Tax Rate
                      </span>
                      <span className="font-bold text-slate-800">
                        {taxType === "intra"
                          ? `18% (CGST ${financialPreview.cgstRate}% + SGST ${financialPreview.sgstRate}%)`
                          : `18% (IGST ${financialPreview.igstRate}%)`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xs">
                    <Info className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>GST is turned OFF for this renewal. No tax will be added; Total Invoice Amount equals Basic Amount.</span>
                  </div>
                )}
              </section>

              {/* Section 4: Live Invoice Calculation Breakdown Card */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-950/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Live Invoice Preview
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
                    Authoritative Tax Formula
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Basic / Taxable Amount:</span>
                    <span className="font-mono font-bold">
                      ₹{financialPreview.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {gstApplicable === "YES" && taxType === "intra" && (
                    <>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>CGST ({financialPreview.cgstRate}%):</span>
                        <span className="font-mono">+₹{financialPreview.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>SGST ({financialPreview.sgstRate}%):</span>
                        <span className="font-mono">+₹{financialPreview.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}

                  {gstApplicable === "YES" && taxType === "inter" && (
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>IGST ({financialPreview.igstRate}%):</span>
                      <span className="font-mono">+₹{financialPreview.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-white block">
                        Total Invoice Amount
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Classification: {financialPreview.taxClassification}
                      </span>
                    </div>
                    <span className="font-mono text-xl font-black text-emerald-400">
                      ₹{financialPreview.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Remarks / Notes */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Renewal Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any specific renewal notes, billing remarks, or purchase order reference..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Generating Invoice...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Renewal Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
