const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { authenticateUser } = require("./auth");
require("./admin");
require("./employee");

const Client = mongoose.model("Client");
const Employee = mongoose.model("Employee");
const User = mongoose.model("User");

const documentUploadDirectory = path.join(__dirname, "uploads", "documents");
if (!fs.existsSync(documentUploadDirectory)) {
  fs.mkdirSync(documentUploadDirectory, { recursive: true });
}

const allowedDocumentFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
];

const uploadDocumentStorage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, documentUploadDirectory),
  filename: (req, file, callback) => {
    const originalExtension = path.extname(file.originalname);
    const originalBaseName = path
      .basename(file.originalname, originalExtension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 80);

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalBaseName}${originalExtension}`;
    callback(null, uniqueName);
  },
});

const uploadDocument = multer({
  storage: uploadDocumentStorage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (allowedDocumentFileTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Unsupported document type. Upload an image, PDF, Word, Excel, ZIP, or text file."));
  },
});

const router = express.Router();
router.use(authenticateUser);

const clientDocumentSchema = new mongoose.Schema(
  {
    documentCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    clientCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    productName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
      index: true,
    },
    documentType: {
      type: String,
      default: "Document",
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    fileName: {
      type: String,
      default: "",
      trim: true,
    },
    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },
    mimeType: {
      type: String,
      default: "",
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Requested", "Pending", "Verified", "Active", "Archived"],
      default: "Pending",
      index: true,
    },
    isRequest: {
      type: Boolean,
      default: false,
    },
    requestedAt: {
      type: Date,
      default: null,
    },
    uploadedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    uploadedByName: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedByRole: {
      type: String,
      enum: ["admin", "employee", "client", "system"],
      default: "admin",
      index: true,
    },
    verifiedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedByName: {
      type: String,
      default: "",
      trim: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    archivedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    archivedByName: {
      type: String,
      default: "",
      trim: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdByName: {
      type: String,
      default: "",
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedByName: {
      type: String,
      default: "",
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "clientdocuments",
  }
);

clientDocumentSchema.index({ name: "text", category: "text", productName: "text", description: "text", clientName: "text", uploadedByName: "text" });

const ClientDocument =
  mongoose.models.ClientDocument ||
  mongoose.model("ClientDocument", clientDocumentSchema);

function getDocumentTypeLabel(mimeType, fileName) {
  const mime = String(mimeType || "").toLowerCase();
  const name = String(fileName || "").toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return "PDF";
  }

  if (mime.includes("excel") || name.endsWith(".xls") || name.endsWith(".xlsx")) {
    return "Excel";
  }

  if (mime.includes("zip") || name.endsWith(".zip")) {
    return "ZIP";
  }

  if (mime.includes("image")) {
    return "Image";
  }

  if (name.endsWith(".doc") || name.endsWith(".docx")) {
    return "Word";
  }

  return "Document";
}

function formatDocument(document, req) {
  if (!document) return null;

  const data = document.toObject ? document.toObject() : { ...document };
  const baseUrl = req ? `${req.protocol}://${req.get("host")}` : "";
  const downloadUrl = data.fileUrl
    ? `${baseUrl}${req.baseUrl}/${data._id}/download`
    : null;

  return {
    id: String(data._id || data.id || ""),
    clientId: String(data.clientId || ""),
    clientCode: data.clientCode || "",
    clientName: data.clientName || "",
    category: data.category || "General",
    documentType: data.documentType || getDocumentTypeLabel(data.mimeType, data.fileName),
    name: data.name || "",
    description: data.description || "",
    productName: data.productName || "",
    fileName: data.fileName || "",
    fileUrl: data.fileUrl || "",
    mimeType: data.mimeType || "",
    size: Number(data.size || 0),
    status: data.status || "Pending",
    isRequest: Boolean(data.isRequest),
    requestedAt: data.requestedAt || null,
    uploadedByName: data.uploadedByName || "",
    uploadedByRole: data.uploadedByRole || "",
    verifiedByName: data.verifiedByName || "",
    verifiedAt: data.verifiedAt || null,
    archivedAt: data.archivedAt || null,
    downloadUrl,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

async function getClientForUser(req) {
  if (req.user.role !== "client") {
    return { error: { status: 403, message: "Client account is required." } };
  }

  const client = await Client.findOne({ userId: req.user._id, isDeleted: false });

  if (!client) {
    return {
      error: {
        status: 404,
        message: "Client profile is not connected to this login account.",
      },
    };
  }

  return { client };
}

async function getAssignedClientIds(employeeId) {
  const clients = await Client.find({ assignedEmployeeId: employeeId, isDeleted: false }).select("_id").lean();
  return clients.map((item) => String(item._id));
}

function getAccessQuery(req, document) {
  if (!document) {
    return { allowed: false, message: "Document not found." };
  }

  if (req.user.role === "admin") {
    return { allowed: true };
  }

  if (req.user.role === "client") {
    return {
      allowed: String(document.clientId) === String(req.client?._id || document.clientId),
    };
  }

  return { allowed: false };
}

async function authorizeDocumentAccess(req, document) {
  if (!document) {
    return { allowed: false, status: 404, message: "Document not found." };
  }

  if (req.user.role === "admin") {
    return { allowed: true };
  }

  if (req.user.role === "client") {
    const { client, error } = await getClientForUser(req);
    if (error) return { allowed: false, status: error.status, message: error.message };
    return {
      allowed: String(document.clientId) === String(client._id),
    };
  }

  if (req.user.role === "employee") {
    const employee = await Employee.findOne({ userId: req.user._id }).lean();
    if (!employee) {
      return { allowed: false, status: 403, message: "Employee account is required." };
    }

    const allowedClientIds = await getAssignedClientIds(employee._id);
    return {
      allowed: allowedClientIds.includes(String(document.clientId)),
    };
  }

  return { allowed: false, status: 403, message: "Access denied." };
}

router.get("/", async (req, res, next) => {
  try {
    const { clientId, category = "All", status = "All", search = "" } = req.query;
    const query = { isDeleted: false };

    if (req.user.role === "client") {
      const { client, error } = await getClientForUser(req);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      query.clientId = client._id;
    } else if (req.user.role === "employee") {
      const employee = await Employee.findOne({ userId: req.user._id }).lean();
      if (!employee) {
        return res.status(403).json({ success: false, message: "Employee account is required." });
      }
      const assignedClientIds = await getAssignedClientIds(employee._id);
      if (clientId) {
        if (!assignedClientIds.includes(String(clientId))) {
          return res.status(403).json({ success: false, message: "Access denied for this client." });
        }
        query.clientId = clientId;
      } else {
        query.clientId = { $in: assignedClientIds };
      }
    } else if (req.user.role === "admin") {
      if (clientId) {
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
          return res.status(400).json({ success: false, message: "Invalid client ID." });
        }
        query.clientId = clientId;
      }
    } else {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), "i");
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { documentType: searchRegex },
        { productName: searchRegex },
        { description: searchRegex },
        { uploadedByName: searchRegex },
      ];
    }

    const documents = await ClientDocument.find(query).sort({ requestedAt: -1, createdAt: -1 }).lean();

    return res.json({
      success: true,
      data: documents.map((document) => formatDocument(document, req)),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid document ID." });
    }

    const document = await ClientDocument.findById(id).lean();
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const authorized = await authorizeDocumentAccess(req, document);
    if (!authorized.allowed) {
      return res.status(authorized.status || 403).json({ success: false, message: authorized.message || "Access denied." });
    }

    return res.json({ success: true, data: formatDocument(document, req) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/download", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid document ID." });
    }

    const document = await ClientDocument.findById(id).lean();
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const authorized = await authorizeDocumentAccess(req, document);
    if (!authorized.allowed) {
      return res.status(authorized.status || 403).json({ success: false, message: authorized.message || "Access denied." });
    }

    if (!document.fileUrl) {
      return res.status(404).json({ success: false, message: "Document file is not available." });
    }

    const fileUrl = String(document.fileUrl).trim();
    if (fileUrl.startsWith("http")) {
      return res.redirect(fileUrl);
    }

    return res.redirect(`${req.protocol}://${req.get("host")}${fileUrl}`);
  } catch (error) {
    next(error);
  }
});

router.post("/upload", uploadDocument.single("file"), async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(403).json({ success: false, message: "Admin access is required to upload documents." });
    }

    const { clientId, category, productName, description, name } = req.body;

    if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ success: false, message: "Valid client ID is required." });
    }

    const client = await Client.findOne({ _id: clientId, isDeleted: false });
    if (!client) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Document file is required." });
    }

    const document = await ClientDocument.create({
      clientId: client._id,
      clientCode: client.clientCode,
      clientName: client.companyName,
      category: String(category || "General").trim(),
      productName: String(productName || "").trim(),
      name: String(name || req.file.originalname).trim(),
      description: String(description || "").trim(),
      fileName: req.file.originalname,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      documentType: getDocumentTypeLabel(req.file.mimetype, req.file.originalname),
      status: "Pending",
      uploadedById: req.user._id,
      uploadedByName: req.user.name || "",
      uploadedByRole: req.user.role,
      createdBy: req.user._id,
      createdByName: req.user.name || "",
      updatedBy: req.user._id,
      updatedByName: req.user.name || "",
    });

    return res.status(201).json({ success: true, message: "Document uploaded successfully.", data: formatDocument(document, req) });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
});

router.post("/request", async (req, res, next) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ success: false, message: "Client access is required to request documents." });
    }

    const { category, productName, description, name } = req.body;
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, message: "Document request description is required." });
    }

    const { client, error } = await getClientForUser(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const document = await ClientDocument.create({
      clientId: client._id,
      clientCode: client.clientCode,
      clientName: client.companyName,
      category: String(category || "General").trim(),
      productName: String(productName || "").trim(),
      name: String(name || "Document Upload Request").trim(),
      description: String(description).trim(),
      documentType: "Request",
      status: "Requested",
      isRequest: true,
      requestedAt: new Date(),
      uploadedById: req.user._id,
      uploadedByName: req.user.name || client.companyName || "Client",
      uploadedByRole: req.user.role,
      createdBy: req.user._id,
      createdByName: req.user.name || client.companyName || "Client",
      updatedBy: req.user._id,
      updatedByName: req.user.name || client.companyName || "Client",
    });

    return res.status(201).json({ success: true, message: "Document request submitted.", data: formatDocument(document, req) });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/verify", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access is required." });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid document ID." });
    }

    const document = await ClientDocument.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    document.status = "Verified";
    document.verifiedAt = new Date();
    document.verifiedById = req.user._id;
    document.verifiedByName = req.user.name || "";
    document.updatedBy = req.user._id;
    document.updatedByName = req.user.name || "";
    await document.save();

    return res.json({ success: true, message: "Document verified successfully.", data: formatDocument(document, req) });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/archive", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access is required." });
    }

    const { id } = req.params;
    const { archived = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid document ID." });
    }

    const document = await ClientDocument.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    if (archived) {
      document.status = "Archived";
      document.archivedAt = new Date();
      document.archivedById = req.user._id;
      document.archivedByName = req.user.name || "";
    } else {
      document.status = document.verifiedAt ? "Verified" : "Pending";
      document.archivedAt = null;
      document.archivedById = null;
      document.archivedByName = "";
    }

    document.updatedBy = req.user._id;
    document.updatedByName = req.user.name || "";
    await document.save();

    return res.json({ success: true, message: "Document archive status updated.", data: formatDocument(document, req) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
