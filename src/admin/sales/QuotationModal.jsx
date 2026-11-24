import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Calendar,
  Building2,
  DollarSign,
  Percent,
} from "lucide-react";
import API_URL from "../../config/api";

const GST_RATES = [0, 5, 12, 18, 28];

export default function QuotationModal({
  isOpen,
  onClose,
  deal = null,
  client = null,
  onQuotationCreated,
}) {
  const [dealId, setDealId] = useState("");
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState([
    {
      description: "Enterprise Software License & Implementation",
      quantity: 1,
      unitPrice: 100000,
      discountPercent: 0,
      taxPercent: 18,
    },
  ]);
  const [taxType, setTaxType] = useState("INTRA_STATE"); // INTRA_STATE (CGST+SGST) | INTER_STATE (IGST)
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("50% advance, 50% on delivery");
  const [notes, setNotes] = useState("Standard enterprise warranty & support terms apply.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess(false);
      if (deal) {
        setDealId(deal._id || deal.id || "");
        setClientId(deal.clientId?._id || deal.clientId || "");
        setTitle(`Quotation for ${deal.title || "Proposal"}`);
      } else if (client) {
        setClientId(client._id || client.id || "");
        setTitle(`Proposal for ${client.companyName || "Client"}`);
      } else {
        setDealId("");
        setClientId("");
        setTitle("Commercial Quotation");
      }

      // Default validity 30 days ahead
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setValidUntil(d.toISOString().split("T")[0]);
    }
  }, [isOpen, deal, client]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 18,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === "description" ? value : Number(value) || 0,
      };
      return copy;
    });
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const rawTotal = (item.quantity || 1) * (item.unitPrice || 0);
    const discountAmount = rawTotal * ((item.discountPercent || 0) / 100);
    const taxableAmount = Math.max(0, rawTotal - discountAmount);
    const taxAmount = taxableAmount * ((item.taxPercent || 0) / 100);
    return {
      ...item,
      discountAmount,
      taxableAmount,
      taxAmount,
      finalAmount: taxableAmount + taxAmount,
    };
  });

  const subTotal = calculatedItems.reduce((acc, i) => acc + i.taxableAmount, 0);
  const totalTax = calculatedItems.reduce((acc, i) => acc + i.taxAmount, 0);
  const totalAmount = subTotal + totalTax;

  const cgst = taxType === "INTRA_STATE" ? totalTax / 2 : 0;
  const sgst = taxType === "INTRA_STATE" ? totalTax / 2 : 0;
  const igst = taxType === "INTER_STATE" ? totalTax : 0;

  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!clientId) {
      setError("Client ID is required for a quotation.");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      setError("Every line item must have a description.");
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();

      const payload = {
        dealId: dealId || null,
        clientId,
        title,
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          taxPercent: i.taxPercent,
        })),
        taxType,
        validUntil,
        paymentTerms,
        notes,
      };

      const res = await fetch(`${API_URL}/api/quotations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create quotation.");
      }

      setSuccess(true);
      if (typeof onQuotationCreated === "function") {
        onQuotationCreated(data.data);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Create quotation error:", err);
      setError(err.message || "Unable to generate quotation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Generate Formal Quotation (CPQ)
              </h3>
              <p className="text-xs text-slate-500">
                Itemized commercial proposal with statutory GST calculation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-medium">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>Quotation created successfully! Syncing deal...</span>
            </div>
          )}

          {/* Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proposal Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ERP Implementation Proposal"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tax Geography
              </label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="INTRA_STATE">Intra-State (CGST 9% + SGST 9%)</option>
                <option value="INTER_STATE">Inter-State (IGST 18%)</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Line Items ({items.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5 w-20">Qty</th>
                    <th className="px-3 py-2.5 w-28">Unit Price (₹)</th>
                    <th className="px-3 py-2.5 w-20">Disc %</th>
                    <th className="px-3 py-2.5 w-24">GST %</th>
                    <th className="px-3 py-2.5 text-right w-28">Total (₹)</th>
                    <th className="px-2 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Item or service description"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(idx, "discountPercent", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.taxPercent}
                          onChange={(e) => handleItemChange(idx, "taxPercent", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        >
                          {GST_RATES.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        ₹{item.finalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary Card */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal</span>
                <span className="font-mono font-semibold">₹{subTotal.toLocaleString("en-IN")}</span>
              </div>
              {taxType === "INTRA_STATE" ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (Central Tax)</span>
                    <span className="font-mono font-semibold">₹{cgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (State Tax)</span>
                    <span className="font-mono font-semibold">₹{sgst.toLocaleString("en-IN")}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>IGST (Integrated Tax)</span>
                  <span className="font-mono font-semibold">₹{igst.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total (Incl. GST)</span>
                <span className="font-mono text-blue-600">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Terms & Validity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 50% advance, balance on Go-Live"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Terms & Conditions / Special Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || success}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
          >
            <FileText size={15} />
            <span>{loading ? "Generating..." : "Generate Official Quotation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
