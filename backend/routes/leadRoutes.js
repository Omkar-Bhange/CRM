"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authenticateUser = require("../authMiddleware");
const Lead = require("../models/Lead");
const Client = require("../models/Client");
const Contact = require("../models/Contact");
const Deal = require("../models/Deal");
const AppCounter = require("../models/AppCounter");

/* =========================================================
   HELPER: ATOMIC SEQUENCE GENERATOR FOR LEADS
========================================================= */
async function getNextLeadCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `lead_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `LEAD-${year}-${String(counter.seq).padStart(4, "0")}`;
}

async function getNextClientCode() {
  const counter = await AppCounter.findByIdAndUpdate(
    "client_code",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CLI-${String(counter.seq).padStart(4, "0")}`;
}

async function getNextContactCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `contact_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CON-${year}-${String(counter.seq).padStart(4, "0")}`;
}

async function getNextDealCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `deal_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `DEAL-${year}-${String(counter.seq).padStart(4, "0")}`;
}

/* =========================================================
   PUBLIC LEAD CAPTURE (Website forms, Google/Meta Ads webhooks)
   POST /api/leads/capture
========================================================= */
router.post("/capture", async (req, res, next) => {
  try {
    const {
      title,
      companyName,
      contactName,
      email = "",
      phone,
      alternatePhone = "",
      city = "",
      state = "Maharashtra",
      source = "Website",
      estimatedBudget = 0,
      notes = "",
      industry = "Services",
    } = req.body;

    if (!companyName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Company name and phone number are required.",
      });
    }

    const leadCode = await getNextLeadCode();

    const newLead = new Lead({
      leadCode,
      title: title || `Inquiry from ${companyName}`,
      companyName: companyName.trim(),
      contactName: contactName ? contactName.trim() : companyName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      city: city.trim(),
      state: state.trim(),
      source,
      estimatedBudget: Number(estimatedBudget) || 0,
      industry,
      notes: notes.trim(),
      status: "New",
      priority: "Medium",
      timeline: [
        {
          action: "Lead Captured",
          description: `Captured via inbound ${source} webhook / contact form.`,
          performedByName: "Web Ingestion System",
          createdAt: new Date(),
        },
      ],
    });

    await newLead.save();

    return res.status(201).json({
      success: true,
      message: "Lead captured successfully.",
      data: {
        leadCode: newLead.leadCode,
        id: newLead._id,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   AUTHENTICATED ROUTES BELOW
========================================================= */
router.use(authenticateUser);

/* =========================================================
   GET LEADS STATS / METRICS
   GET /api/leads/stats
========================================================= */
router.get("/stats", async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalLeads,
      newToday,
      statusCounts,
      sourceCounts,
      convertedCount,
    ] = await Promise.all([
      Lead.countDocuments({ isDeleted: false }),
      Lead.countDocuments({ isDeleted: false, createdAt: { $gte: startOfToday } }),
      Lead.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
      ]),
      Lead.countDocuments({ isDeleted: false, status: "Converted" }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalLeads,
        newToday,
        convertedCount,
        conversionRate,
        statusBreakdown: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        sourceBreakdown: sourceCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET LEADS LIST
   GET /api/leads
========================================================= */
router.get("/", async (req, res, next) => {
  try {
    const {
      status = "All",
      source = "All",
      priority = "All",
      assignedTo,
      search = "",
      page = 1,
      limit = 25,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { isDeleted: false };

    if (status && status !== "All") {
      query.status = status;
    }
    if (source && source !== "All") {
      query.source = source;
    }
    if (priority && priority !== "All") {
      query.priority = priority;
    }
    if (assignedTo && assignedTo !== "All") {
      query.assignedTo = assignedTo;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { leadCode: regex },
        { title: regex },
        { companyName: regex },
        { contactName: regex },
        { email: regex },
        { phone: regex },
        { city: regex },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate("assignedTo", "name employeeCode role")
        .populate("interestedProducts", "name productCode")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: leads.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: leads,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET SINGLE LEAD
   GET /api/leads/:id
========================================================= */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lead ID." });
    }

    const lead = await Lead.findOne({ _id: id, isDeleted: false })
      .populate("assignedTo", "name employeeCode role email mobile")
      .populate("interestedProducts", "name productCode category pricing")
      .populate("convertedToClientId", "clientCode companyName contactPerson email mobile")
      .populate("convertedToDealId", "dealCode title stage amount expectedCloseDate")
      .lean();

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CREATE LEAD
   POST /api/leads
========================================================= */
router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      companyName,
      contactName,
      email = "",
      phone,
      alternatePhone = "",
      city = "",
      state = "Maharashtra",
      country = "India",
      source = "Website",
      priority = "Medium",
      score = 10,
      estimatedBudget = 0,
      assignedTo = null,
      industry = "Services",
      interestedProducts = [],
      notes = "",
    } = req.body;

    if (!title || !companyName || !contactName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Title, company name, contact name, and phone are required.",
      });
    }

    const leadCode = await getNextLeadCode();

    let assignedToName = "Unassigned";
    let assignedToCode = "";
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      const Employee = mongoose.models.Employee;
      const emp = await Employee.findById(assignedTo).lean();
      if (emp) {
        assignedToName = emp.name;
        assignedToCode = emp.employeeCode || "";
      }
    }

    const newLead = new Lead({
      leadCode,
      title: title.trim(),
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      source,
      priority,
      score: Number(score) || 10,
      estimatedBudget: Number(estimatedBudget) || 0,
      assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
      assignedToName,
      assignedToCode,
      industry,
      interestedProducts: Array.isArray(interestedProducts) ? interestedProducts : [],
      notes: notes.trim(),
      status: "New",
      timeline: [
        {
          action: "Lead Created",
          description: `Created manually by ${req.user.name || "Admin"}.`,
          performedBy: req.user._id,
          performedByName: req.user.name || "Admin",
          createdAt: new Date(),
        },
      ],
    });

    await newLead.save();

    return res.status(201).json({
      success: true,
      message: "Lead created successfully.",
      data: newLead,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   UPDATE LEAD
   PATCH /api/leads/:id
========================================================= */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lead ID." });
    }

    const lead = await Lead.findOne({ _id: id, isDeleted: false });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    const updatableFields = [
      "title",
      "companyName",
      "contactName",
      "email",
      "phone",
      "alternatePhone",
      "city",
      "state",
      "country",
      "source",
      "priority",
      "score",
      "estimatedBudget",
      "industry",
      "notes",
      "lostReason",
      "interestedProducts",
    ];

    let changesMade = [];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (lead[field] !== req.body[field]) {
          changesMade.push(field);
          lead[field] = req.body[field];
        }
      }
    });

    if (req.body.assignedTo !== undefined) {
      if (String(lead.assignedTo || "") !== String(req.body.assignedTo || "")) {
        if (req.body.assignedTo && mongoose.Types.ObjectId.isValid(req.body.assignedTo)) {
          const Employee = mongoose.models.Employee;
          const emp = await Employee.findById(req.body.assignedTo).lean();
          lead.assignedTo = emp ? emp._id : null;
          lead.assignedToName = emp ? emp.name : "Unassigned";
          lead.assignedToCode = emp ? emp.employeeCode || "" : "";
        } else {
          lead.assignedTo = null;
          lead.assignedToName = "Unassigned";
          lead.assignedToCode = "";
        }
        changesMade.push("assignedTo");
      }
    }

    if (changesMade.length > 0) {
      lead.timeline.push({
        action: "Lead Updated",
        description: `Updated fields: ${changesMade.join(", ")} by ${req.user.name || "Admin"}`,
        performedBy: req.user._id,
        performedByName: req.user.name || "Admin",
        createdAt: new Date(),
      });
      await lead.save();
    }

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully.",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   UPDATE LEAD STATUS
   PATCH /api/leads/:id/status
========================================================= */
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, lostReason = "", notes = "" } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const lead = await Lead.findOne({ _id: id, isDeleted: false });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    const oldStatus = lead.status;
    lead.status = status;
    if (lostReason) lead.lostReason = lostReason;
    if (notes) lead.notes = notes;

    lead.timeline.push({
      action: "Status Changed",
      description: `Stage moved from "${oldStatus}" to "${status}". ${notes ? `Notes: ${notes}` : ""}`,
      performedBy: req.user._id,
      performedByName: req.user.name || "Admin",
      createdAt: new Date(),
    });

    await lead.save();

    return res.status(200).json({
      success: true,
      message: `Lead status updated to ${status}.`,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   1-CLICK LEAD CONVERSION: LEAD -> CLIENT + CONTACT + DEAL
   POST /api/leads/:id/convert
========================================================= */
router.post("/:id/convert", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      dealTitle,
      dealAmount,
      expectedCloseDate,
      createDeal = true,
      existingClientId = null,
    } = req.body;

    const lead = await Lead.findOne({ _id: id, isDeleted: false });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    if (lead.status === "Converted") {
      return res.status(400).json({
        success: false,
        message: "This lead has already been converted.",
      });
    }

    let targetClient = null;

    // 1. Resolve or Create Client Account
    if (existingClientId && mongoose.Types.ObjectId.isValid(existingClientId)) {
      targetClient = await Client.findById(existingClientId);
    }

    if (!targetClient) {
      // Check if client with same company name already exists
      targetClient = await Client.findOne({
        companyName: { $regex: new RegExp(`^${lead.companyName.trim()}$`, "i") },
      });

      if (!targetClient) {
        const clientCode = await getNextClientCode();
        targetClient = new Client({
          clientCode,
          companyName: lead.companyName.trim(),
          contactPerson: lead.contactName.trim(),
          email: lead.email || "",
          mobile: lead.phone,
          city: lead.city || "Mumbai",
          state: lead.state || "Maharashtra",
          country: lead.country || "India",
          status: "Active",
          source: lead.source,
          notes: `Converted from Lead ${lead.leadCode}. ${lead.notes || ""}`,
        });
        await targetClient.save();
      }
    }

    // 2. Create B2B Contact under this Client Account
    const contactCode = await getNextContactCode();
    const nameParts = lead.contactName.trim().split(" ");
    const firstName = nameParts[0] || lead.contactName;
    const lastName = nameParts.slice(1).join(" ") || "";

    const newContact = new Contact({
      contactCode,
      clientId: targetClient._id,
      clientCode: targetClient.clientCode,
      clientName: targetClient.companyName,
      firstName,
      lastName,
      email: lead.email,
      phone: lead.phone,
      alternatePhone: lead.alternatePhone || "",
      designation: "Key Decision Maker",
      role: "Decision Maker",
      isPrimary: true,
      notes: `Imported from Lead ${lead.leadCode}`,
    });
    await newContact.save();

    // 3. Create active Deal Opportunity (if requested)
    let newDeal = null;
    if (createDeal) {
      const dealCode = await getNextDealCode();
      const amount = Number(dealAmount !== undefined ? dealAmount : lead.estimatedBudget) || 50000;
      const closeDate = expectedCloseDate
        ? new Date(expectedCloseDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      newDeal = new Deal({
        dealCode,
        title: dealTitle || lead.title || `Deal for ${targetClient.companyName}`,
        clientId: targetClient._id,
        clientCode: targetClient.clientCode,
        clientName: targetClient.companyName,
        primaryContactId: newContact._id,
        primaryContactName: `${firstName} ${lastName}`.trim(),
        leadId: lead._id,
        amount,
        stage: "Discovery",
        probability: 20,
        expectedCloseDate: closeDate,
        assignedTo: lead.assignedTo || null,
        assignedToName: lead.assignedToName || "Unassigned",
        assignedToCode: lead.assignedToCode || "",
        notes: `Originated from Lead ${lead.leadCode}. ${lead.notes || ""}`,
        timeline: [
          {
            action: "Deal Created from Lead Conversion",
            stage: "Discovery",
            notes: `Converted from Lead ${lead.leadCode}`,
            performedBy: req.user._id,
            performedByName: req.user.name || "Admin",
            createdAt: new Date(),
          },
        ],
      });
      await newDeal.save();
    }

    // 4. Mark Lead as Converted
    lead.status = "Converted";
    lead.convertedAt = new Date();
    lead.convertedToClientId = targetClient._id;
    lead.convertedToContactId = newContact._id;
    if (newDeal) lead.convertedToDealId = newDeal._id;

    lead.timeline.push({
      action: "Lead Converted",
      description: `Converted to Client (${targetClient.clientCode}), Contact (${newContact.contactCode})${newDeal ? `, and Deal (${newDeal.dealCode})` : ""} by ${req.user.name || "Admin"}.`,
      performedBy: req.user._id,
      performedByName: req.user.name || "Admin",
      createdAt: new Date(),
    });

    await lead.save();

    return res.status(200).json({
      success: true,
      message: "Lead successfully converted to Client, Contact, and active Deal.",
      data: {
        leadId: lead._id,
        client: targetClient,
        contact: newContact,
        deal: newDeal,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   DELETE LEAD (Soft Delete)
   DELETE /api/leads/:id
========================================================= */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findOne({ _id: id, isDeleted: false });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    lead.isDeleted = true;
    lead.timeline.push({
      action: "Lead Deleted",
      description: `Deleted by ${req.user.name || "Admin"}.`,
      performedBy: req.user._id,
      performedByName: req.user.name || "Admin",
      createdAt: new Date(),
    });
    await lead.save();

    return res.status(200).json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
