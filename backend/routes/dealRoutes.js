"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authenticateUser = require("../authMiddleware");
const Deal = require("../models/Deal");
const Client = require("../models/Client");
const Contact = require("../models/Contact");
const Employee = require("../models/Employee");
const AppCounter = require("../models/AppCounter");

/* =========================================================
   HELPER: ATOMIC SEQUENCE GENERATOR FOR DEALS
========================================================= */
async function getNextDealCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `deal_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `DEAL-${year}-${String(counter.seq).padStart(4, "0")}`;
}

const STAGE_PROBABILITIES = {
  Discovery: 10,
  "Demo / Presentation": 30,
  "Proposal / Quotation": 60,
  "Negotiation / Review": 80,
  "Closed Won": 100,
  "Closed Lost": 0,
};

router.use(authenticateUser);

/* =========================================================
   GET PIPELINE / KANBAN SUMMARY
   GET /api/deals/pipeline
========================================================= */
router.get("/pipeline", async (req, res, next) => {
  try {
    const { assignedTo, priority } = req.query;
    const query = { isDeleted: false };
    if (assignedTo && assignedTo !== "All") query.assignedTo = assignedTo;
    if (priority && priority !== "All") query.priority = priority;

    const deals = await Deal.find(query)
      .populate("assignedTo", "name employeeCode role")
      .populate("primaryContactId", "firstName lastName email phone designation")
      .sort({ expectedCloseDate: 1 })
      .lean();

    const stages = [
      "Discovery",
      "Demo / Presentation",
      "Proposal / Quotation",
      "Negotiation / Review",
      "Closed Won",
      "Closed Lost",
    ];

    const pipeline = {};
    stages.forEach((stg) => {
      pipeline[stg] = {
        stage: stg,
        count: 0,
        totalValue: 0,
        deals: [],
      };
    });

    let totalPipelineValue = 0;
    let weightedForecastValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    let closedCount = 0;

    deals.forEach((deal) => {
      const stageName = deal.stage || "Discovery";
      if (!pipeline[stageName]) {
        pipeline[stageName] = {
          stage: stageName,
          count: 0,
          totalValue: 0,
          deals: [],
        };
      }

      pipeline[stageName].count += 1;
      pipeline[stageName].totalValue += Number(deal.amount || 0);
      pipeline[stageName].deals.push(deal);

      if (stageName !== "Closed Lost") {
        totalPipelineValue += Number(deal.amount || 0);
        weightedForecastValue += Math.round(
          (Number(deal.amount || 0) * Number(deal.probability || 0)) / 100
        );
      }

      if (stageName === "Closed Won") {
        wonValue += Number(deal.amount || 0);
        wonCount += 1;
        closedCount += 1;
      } else if (stageName === "Closed Lost") {
        closedCount += 1;
      }
    });

    const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDeals: deals.length,
          totalPipelineValue,
          weightedForecastValue,
          wonValue,
          wonCount,
          winRate,
        },
        columns: Object.values(pipeline),
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET ALL DEALS (List View)
   GET /api/deals
========================================================= */
router.get("/", async (req, res, next) => {
  try {
    const {
      stage = "All",
      priority = "All",
      clientId,
      assignedTo,
      search = "",
      page = 1,
      limit = 25,
      sortBy = "expectedCloseDate",
      sortOrder = "asc",
    } = req.query;

    const query = { isDeleted: false };
    if (stage && stage !== "All") query.stage = stage;
    if (priority && priority !== "All") query.priority = priority;
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) query.clientId = clientId;
    if (assignedTo && assignedTo !== "All") query.assignedTo = assignedTo;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { dealCode: regex },
        { title: regex },
        { clientName: regex },
        { primaryContactName: regex },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [deals, total] = await Promise.all([
      Deal.find(query)
        .populate("assignedTo", "name employeeCode role")
        .populate("primaryContactId", "firstName lastName email phone")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Deal.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: deals.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: deals,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET SINGLE DEAL
   GET /api/deals/:id
========================================================= */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid deal ID." });
    }

    const deal = await Deal.findOne({ _id: id, isDeleted: false })
      .populate("clientId", "clientCode companyName email mobile city state gstNo")
      .populate("primaryContactId", "firstName lastName email phone designation role")
      .populate("assignedTo", "name employeeCode role email mobile")
      .populate("products.productId", "name productCode category pricing")
      .lean();

    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }

    return res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CREATE DEAL
   POST /api/deals
========================================================= */
router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      clientId,
      primaryContactId = null,
      amount,
      stage = "Discovery",
      expectedCloseDate,
      dealType = "New Business",
      priority = "Medium",
      assignedTo = null,
      products = [],
      notes = "",
    } = req.body;

    if (!title || !clientId || amount === undefined || !expectedCloseDate) {
      return res.status(400).json({
        success: false,
        message: "Title, client, amount, and expected close date are required.",
      });
    }

    const client = await Client.findById(clientId).lean();
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    let primaryContactName = "";
    if (primaryContactId && mongoose.Types.ObjectId.isValid(primaryContactId)) {
      const contact = await Contact.findById(primaryContactId).lean();
      if (contact) {
        primaryContactName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
      }
    } else {
      primaryContactName = client.contactPerson || "";
    }

    let assignedToName = "Unassigned";
    let assignedToCode = "";
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      const emp = await Employee.findById(assignedTo).lean();
      if (emp) {
        assignedToName = emp.name;
        assignedToCode = emp.employeeCode || "";
      }
    }

    const dealCode = await getNextDealCode();
    const probability = STAGE_PROBABILITIES[stage] !== undefined ? STAGE_PROBABILITIES[stage] : 10;

    const newDeal = new Deal({
      dealCode,
      title: title.trim(),
      clientId: client._id,
      clientCode: client.clientCode,
      clientName: client.companyName,
      primaryContactId: primaryContactId && mongoose.Types.ObjectId.isValid(primaryContactId) ? primaryContactId : null,
      primaryContactName,
      amount: Number(amount) || 0,
      stage,
      probability,
      expectedCloseDate: new Date(expectedCloseDate),
      dealType,
      priority,
      assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
      assignedToName,
      assignedToCode,
      products: Array.isArray(products) ? products : [],
      notes: notes.trim(),
      timeline: [
        {
          action: "Deal Created",
          stage,
          notes: `Created by ${req.user.name || "Admin"}.`,
          performedBy: req.user._id,
          performedByName: req.user.name || "Admin",
          createdAt: new Date(),
        },
      ],
    });

    await newDeal.save();

    return res.status(201).json({
      success: true,
      message: "Deal created successfully.",
      data: newDeal,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   UPDATE DEAL
   PATCH /api/deals/:id
========================================================= */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid deal ID." });
    }

    const deal = await Deal.findOne({ _id: id, isDeleted: false });
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }

    const fields = [
      "title",
      "amount",
      "expectedCloseDate",
      "dealType",
      "priority",
      "products",
      "notes",
      "primaryContactId",
      "primaryContactName",
    ];

    let changes = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        changes.push(f);
        deal[f] = req.body[f];
      }
    });

    if (req.body.assignedTo !== undefined) {
      if (String(deal.assignedTo || "") !== String(req.body.assignedTo || "")) {
        if (req.body.assignedTo && mongoose.Types.ObjectId.isValid(req.body.assignedTo)) {
          const emp = await Employee.findById(req.body.assignedTo).lean();
          deal.assignedTo = emp ? emp._id : null;
          deal.assignedToName = emp ? emp.name : "Unassigned";
          deal.assignedToCode = emp ? emp.employeeCode || "" : "";
        } else {
          deal.assignedTo = null;
          deal.assignedToName = "Unassigned";
          deal.assignedToCode = "";
        }
        changes.push("assignedTo");
      }
    }

    if (changes.length > 0) {
      deal.timeline.push({
        action: "Deal Details Updated",
        stage: deal.stage,
        notes: `Updated: ${changes.join(", ")} by ${req.user.name || "Admin"}`,
        performedBy: req.user._id,
        performedByName: req.user.name || "Admin",
        createdAt: new Date(),
      });
      await deal.save();
    }

    return res.status(200).json({
      success: true,
      message: "Deal updated successfully.",
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   UPDATE DEAL STAGE (Kanban Movement)
   PATCH /api/deals/:id/stage
========================================================= */
router.patch("/:id/stage", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, lostReason = "", lostReasonNotes = "", wonNotes = "" } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, message: "Stage is required." });
    }

    const deal = await Deal.findOne({ _id: id, isDeleted: false });
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }

    const oldStage = deal.stage;
    deal.stage = stage;
    deal.probability = STAGE_PROBABILITIES[stage] !== undefined ? STAGE_PROBABILITIES[stage] : deal.probability;

    if (stage === "Closed Won") {
      deal.actualCloseDate = new Date();
      if (wonNotes) deal.wonNotes = wonNotes;
    } else if (stage === "Closed Lost") {
      deal.actualCloseDate = new Date();
      if (lostReason) deal.lostReason = lostReason;
      if (lostReasonNotes) deal.lostReasonNotes = lostReasonNotes;
    }

    deal.timeline.push({
      action: "Pipeline Stage Changed",
      stage,
      notes: `Transitioned from "${oldStage}" to "${stage}". ${stage === "Closed Lost" && lostReason ? `Reason: ${lostReason}` : ""}`,
      performedBy: req.user._id,
      performedByName: req.user.name || "Admin",
      createdAt: new Date(),
    });

    await deal.save();

    return res.status(200).json({
      success: true,
      message: `Deal moved to stage "${stage}".`,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   DELETE DEAL (Soft Delete)
   DELETE /api/deals/:id
========================================================= */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deal = await Deal.findOne({ _id: id, isDeleted: false });
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }

    deal.isDeleted = true;
    deal.timeline.push({
      action: "Deal Deleted",
      stage: deal.stage,
      notes: `Deleted by ${req.user.name || "Admin"}.`,
      performedBy: req.user._id,
      performedByName: req.user.name || "Admin",
      createdAt: new Date(),
    });
    await deal.save();

    return res.status(200).json({ success: true, message: "Deal deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
