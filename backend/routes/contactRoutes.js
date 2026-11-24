"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authenticateUser = require("../authMiddleware");
const Contact = require("../models/Contact");
const Client = require("../models/Client");
const AppCounter = require("../models/AppCounter");

async function getNextContactCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `contact_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CON-${year}-${String(counter.seq).padStart(4, "0")}`;
}

router.use(authenticateUser);

/* =========================================================
   GET ALL CONTACTS
   GET /api/contacts
========================================================= */
router.get("/", async (req, res, next) => {
  try {
    const { clientId, role = "All", status = "All", search = "", limit = 50, page = 1 } = req.query;
    const query = { isDeleted: false };

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = clientId;
    }
    if (role && role !== "All") {
      query.role = role;
    }
    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { contactCode: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { designation: regex },
        { clientName: regex },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .populate("clientId", "clientCode companyName city email mobile")
        .sort({ isPrimary: -1, firstName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET CONTACT BY ID
   GET /api/contacts/:id
========================================================= */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid contact ID." });
    }

    const contact = await Contact.findOne({ _id: id, isDeleted: false })
      .populate("clientId", "clientCode companyName email mobile city state gstNo")
      .lean();

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found." });
    }

    return res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CREATE CONTACT
   POST /api/contacts
========================================================= */
router.post("/", async (req, res, next) => {
  try {
    const {
      clientId,
      firstName,
      lastName = "",
      email = "",
      phone,
      alternatePhone = "",
      designation = "Business Contact",
      department = "Management",
      role = "Decision Maker",
      isPrimary = false,
      canAccessPortal = false,
      notes = "",
    } = req.body;

    if (!clientId || !firstName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Client, first name, and phone are required.",
      });
    }

    const client = await Client.findById(clientId).lean();
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    // If marked primary, unset existing primary contact for this client
    if (isPrimary) {
      await Contact.updateMany({ clientId: client._id, isPrimary: true }, { $set: { isPrimary: false } });
    }

    const contactCode = await getNextContactCode();

    const newContact = new Contact({
      contactCode,
      clientId: client._id,
      clientCode: client.clientCode,
      clientName: client.companyName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      designation: designation.trim(),
      department: department.trim(),
      role,
      isPrimary: Boolean(isPrimary),
      canAccessPortal: Boolean(canAccessPortal),
      notes: notes.trim(),
    });

    await newContact.save();

    return res.status(201).json({
      success: true,
      message: "Contact created successfully.",
      data: newContact,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   UPDATE CONTACT
   PATCH /api/contacts/:id
========================================================= */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid contact ID." });
    }

    const contact = await Contact.findOne({ _id: id, isDeleted: false });
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found." });
    }

    const fields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "alternatePhone",
      "designation",
      "department",
      "role",
      "canAccessPortal",
      "status",
      "notes",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        contact[f] = req.body[f];
      }
    });

    if (req.body.isPrimary !== undefined) {
      const willBePrimary = Boolean(req.body.isPrimary);
      if (willBePrimary && !contact.isPrimary) {
        await Contact.updateMany(
          { clientId: contact.clientId, _id: { $ne: contact._id }, isPrimary: true },
          { $set: { isPrimary: false } }
        );
      }
      contact.isPrimary = willBePrimary;
    }

    await contact.save();

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully.",
      data: contact,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   DELETE CONTACT (Soft Delete)
   DELETE /api/contacts/:id
========================================================= */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOne({ _id: id, isDeleted: false });
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found." });
    }

    contact.isDeleted = true;
    await contact.save();

    return res.status(200).json({ success: true, message: "Contact deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
