"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authenticateUser = require("../authMiddleware");
const Quotation = require("../models/Quotation");
const Client = require("../models/Client");
const Deal = require("../models/Deal");
const AppCounter = require("../models/AppCounter");

async function getNextQuotationNo() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `quotation_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `QT-${year}-${String(counter.seq).padStart(4, "0")}`;
}

router.use(authenticateUser);

/* =========================================================
   GET ALL QUOTATIONS
   GET /api/quotations
========================================================= */
router.get("/", async (req, res, next) => {
  try {
    const { status = "All", clientId, dealId, search = "", limit = 25, page = 1 } = req.query;
    const query = { isDeleted: false };

    if (status && status !== "All") query.status = status;
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) query.clientId = clientId;
    if (dealId && mongoose.Types.ObjectId.isValid(dealId)) query.dealId = dealId;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ quotationNo: regex }, { clientName: regex }, { contactPerson: regex }];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .populate("clientId", "clientCode companyName city email mobile")
        .populate("dealId", "dealCode title stage amount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Quotation.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: quotations.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: quotations,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET SINGLE QUOTATION
   GET /api/quotations/:id
========================================================= */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid quotation ID." });
    }

    const quotation = await Quotation.findOne({ _id: id, isDeleted: false })
      .populate("clientId", "clientCode companyName addressLine1 city state pinCode gstNo panNo")
      .populate("dealId", "dealCode title stage amount")
      .populate("items.productId", "name productCode category")
      .lean();

    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    return res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CREATE QUOTATION (Line Items + Tax Computation)
   POST /api/quotations
========================================================= */
router.post("/", async (req, res, next) => {
  try {
    const {
      clientId,
      dealId = null,
      contactPerson = "",
      contactEmail = "",
      contactPhone = "",
      billingAddress = {},
      items = [],
      isGstApplicable = true,
      gstType = "CGST_SGST",
      validUntil,
      paymentTerms,
      deliveryTimeline,
      termsAndConditions,
      notes = "",
    } = req.body;

    if (!clientId || !Array.isArray(items) || items.length === 0 || !validUntil) {
      return res.status(400).json({
        success: false,
        message: "Client, at least one line item, and validity date are required.",
      });
    }

    const client = await Client.findById(clientId).lean();
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    // Process line items and compute taxes
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalGst = 0;

    const processedItems = items.map((itm) => {
      const qty = Math.max(1, Number(itm.quantity || 1));
      const price = Math.max(0, Number(itm.unitPrice || 0));
      const gross = qty * price;
      const discPct = Math.min(100, Math.max(0, Number(itm.discountPercent || 0)));
      const discAmt = Math.round((gross * discPct) / 100);
      const netTaxable = gross - discAmt;
      const rate = isGstApplicable ? Number(itm.gstRate !== undefined ? itm.gstRate : 18) : 0;
      const gst = Math.round((netTaxable * rate) / 100);
      const total = netTaxable + gst;

      subtotal += gross;
      totalDiscount += discAmt;
      taxableAmount += netTaxable;
      totalGst += gst;

      return {
        productId: itm.productId && mongoose.Types.ObjectId.isValid(itm.productId) ? itm.productId : null,
        itemCode: itm.itemCode || "",
        description: itm.description || "Product / Service Deliverable",
        quantity: qty,
        unitPrice: price,
        discountPercent: discPct,
        discountAmount: discAmt,
        taxableAmount: netTaxable,
        gstRate: rate,
        gstAmount: gst,
        totalAmount: total,
      };
    });

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isGstApplicable) {
      if (gstType === "IGST") {
        igstAmount = totalGst;
      } else {
        cgstAmount = Math.round(totalGst / 2);
        sgstAmount = totalGst - cgstAmount;
      }
    }

    const grandTotal = taxableAmount + totalGst;
    const quotationNo = await getNextQuotationNo();

    const newQuotation = new Quotation({
      quotationNo,
      dealId: dealId && mongoose.Types.ObjectId.isValid(dealId) ? dealId : null,
      clientId: client._id,
      clientCode: client.clientCode,
      clientName: client.companyName,
      contactPerson: contactPerson || client.contactPerson || "",
      contactEmail: contactEmail || client.email || "",
      contactPhone: contactPhone || client.mobile || "",
      billingAddress: {
        line1: billingAddress.line1 || client.addressLine1 || "",
        line2: billingAddress.line2 || client.addressLine2 || "",
        city: billingAddress.city || client.city || "Mumbai",
        state: billingAddress.state || client.state || "Maharashtra",
        pinCode: billingAddress.pinCode || client.pinCode || "",
        country: billingAddress.country || client.country || "India",
      },
      items: processedItems,
      subtotal,
      totalDiscount,
      taxableAmount,
      isGstApplicable: Boolean(isGstApplicable),
      gstType,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGst,
      grandTotal,
      validUntil: new Date(validUntil),
      paymentTerms: paymentTerms || undefined,
      deliveryTimeline: deliveryTimeline || undefined,
      termsAndConditions: termsAndConditions || undefined,
      notes: notes.trim(),
      status: "Draft",
      assignedTo: req.user._id,
      assignedToName: req.user.name || "Admin",
    });

    await newQuotation.save();

    // If quotation is linked to a deal, update deal amount and stage
    if (dealId && mongoose.Types.ObjectId.isValid(dealId)) {
      await Deal.findByIdAndUpdate(dealId, {
        amount: grandTotal,
        stage: "Proposal / Quotation",
        probability: 60,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully.",
      data: newQuotation,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   UPDATE QUOTATION STATUS
   PATCH /api/quotations/:id/status
========================================================= */
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const quotation = await Quotation.findOne({ _id: id, isDeleted: false });
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    quotation.status = status;
    if (status === "Client Approved") {
      quotation.approvedByClientAt = new Date();
      if (quotation.dealId) {
        await Deal.findByIdAndUpdate(quotation.dealId, {
          stage: "Negotiation / Review",
          probability: 80,
        });
      }
    }

    await quotation.save();

    return res.status(200).json({
      success: true,
      message: `Quotation status updated to ${status}.`,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   DELETE QUOTATION (Soft Delete)
   DELETE /api/quotations/:id
========================================================= */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findOne({ _id: id, isDeleted: false });
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    quotation.isDeleted = true;
    await quotation.save();

    return res.status(200).json({ success: true, message: "Quotation deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
