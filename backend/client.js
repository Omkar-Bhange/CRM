const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const axios = require("axios");

const allowedTicketFileTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "image/jpg",
];

const ticketUploadDirectory = path.join(__dirname, "uploads", "tickets");
if (!fs.existsSync(ticketUploadDirectory)) {
  fs.mkdirSync(ticketUploadDirectory, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, ticketUploadDirectory),
    filename: (req, file, callback) => {
      const originalBaseName = path.basename(file.originalname, path.extname(file.originalname));
      const originalExtension = path.extname(file.originalname);
      const safeBaseName = originalBaseName
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .slice(0, 80);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBaseName}${originalExtension}`;
      callback(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (allowedTicketFileTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Unsupported file type. Upload a PNG, JPG, JPEG, or PDF file."));
  },
});

// Ensure Client / SupportTicket / ActivityLog models are registered
// before we grab them below (same pattern employee.js uses for admin.js).
require("./admin");
const {
  getTicketSlaPolicy,
  calculateDueAt,
  calculateTicketSla,
  SLA_POLICY_VERSION,
} = require("./slaConfig");

const authenticateUser = require("./authMiddleware");

const Client = mongoose.model("Client");
const SupportTicket = mongoose.models.SupportTicket;
const ActivityLog = mongoose.models.ActivityLog;
const AmcContract = mongoose.models.AmcContract;
const AmcInvoice = mongoose.models.AmcInvoice;
const AmcPayment = mongoose.models.AmcPayment;
const ClientAmcRequest = mongoose.models.ClientAmcRequest;
const AppCounter = mongoose.models.AppCounter;

let ClientNotification = mongoose.models.ClientNotification;
if (!ClientNotification) {
  const clientNotificationSchema = new mongoose.Schema(
    {
      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true,
        index: true,
      },
      type: {
        type: String,
        enum: [
          "INVOICE_GENERATED",
          "PAYMENT_RECEIVED",
          "AMC_EXPIRING",
          "AMC_RENEWED",
          "AMC_REQUEST_SUBMITTED",
          "AMC_REQUEST_UPDATED",
          "AMC_QUOTATION_READY",
          "TICKET_CREATED",
          "TICKET_UPDATED",
          "TICKET_RESOLVED",
          "DOCUMENT_SHARED",
        ],
        required: true,
        index: true,
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      message: {
        type: String,
        required: true,
        trim: true,
      },
      entityType: {
        type: String,
        enum: ["invoice", "payment", "amc", "ticket", "document", "other"],
        default: "other",
      },
      entityCode: {
        type: String,
        default: "",
        trim: true,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      navigationTarget: {
        type: String,
        enum: ["overview", "products", "billing", "tickets", "documents", "profile"],
        default: "overview",
      },
      isRead: {
        type: Boolean,
        default: false,
        index: true,
      },
      readAt: {
        type: Date,
        default: null,
      },
      dedupKey: {
        type: String,
        default: "",
        index: true,
      },
    },
    {
      timestamps: true,
      collection: "clientnotifications",
    }
  );

  clientNotificationSchema.index({ clientId: 1, createdAt: -1 });
  clientNotificationSchema.index({ clientId: 1, isRead: 1 });
  clientNotificationSchema.index({ clientId: 1, dedupKey: 1 }, { unique: true });

  ClientNotification = mongoose.model("ClientNotification", clientNotificationSchema);
}

let jsPDF = null;
try {
  jsPDF = require("jspdf").jsPDF;
} catch (e) {
  // handled safely
}

const router = express.Router();

/* =========================================================
   TEST ROUTE
   GET /api/client/test
========================================================= */

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Client API is working.",
  });
});

/* =========================================================
   AUTHENTICATION
   Everything below requires a logged-in user.
========================================================= */

router.use(authenticateUser);

/* =========================================================
   HELPERS
========================================================= */

function clientResponse(client) {
  return {
    id: client._id,
    _id: client._id,
    clientCode: client.clientCode,
    companyName: client.companyName,
    contactPerson: client.contactPerson,
    email: client.email,
    mobile: client.mobile,
    city: client.city,
    products: client.products || [],
    amcStatus: client.amcStatus,
    nextRenewal: client.nextRenewal,
    openTickets: client.openTickets,
    assignedEmployeeName: client.assignedEmployeeName,
    status: client.status,
    createdAt: client.createdAt,
  };
}

async function findOwnClient(req) {
  if (req.user.role !== "client") {
    return { error: { status: 403, message: "Client account is required." } };
  }

  const client = await Client.findOne({
    userId: req.user._id,
    isDeleted: false,
  });

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
function formatAttachment(file, req) {
  if (!file) return null;

  const relativeUrl = file.fileUrl || "";
  const fullUrl = req
    ? `${req.protocol}://${req.get("host")}${relativeUrl}`
    : relativeUrl;

  return {
    originalName: file.fileName || "",
    filename: relativeUrl ? path.basename(relativeUrl) : "",
    url: fullUrl,
    fileUrl: relativeUrl,
    mimeType: file.fileType || "",
    size: file.fileSize || 0,
    uploadedAt: file.uploadedAt || file.createdAt || null,
    uploadedBy: file.uploadedBy,
    uploadedByName: file.uploadedByName,
    uploadedByRole: file.uploadedByRole,
  };
}

function formatTicket(ticket, req) {
  if (!ticket) return ticket;

  const data = ticket.toObject ? ticket.toObject() : { ...ticket };

  // Filter out internal notes or internal replies from client view
  const safeReplies = (data.replies || [])
    .filter((r) => r.replyType !== "Internal")
    .map((r) => ({
      id: String(r._id || r.id || ""),
      _id: String(r._id || r.id || ""),
      message: r.message,
      replyType: r.replyType || "Public",
      authorName: r.authorName || (r.authorRole === "client" ? "You" : "Support Engineer"),
      authorRole: r.authorRole || "support",
      createdAt: r.createdAt,
    }));

  // Clean timeline for client
  const safeTimeline = (data.timeline || []).map((t) => ({
    id: String(t._id || t.id || ""),
    _id: String(t._id || t.id || ""),
    type: t.type,
    title: t.title,
    description: t.description,
    performedByName: t.performedByName || (t.performedByRole === "client" ? "You" : "Support Desk"),
    performedByRole: t.performedByRole || "system",
    createdAt: t.createdAt,
  }));

  return {
    ...data,
    internalNotes: [], // client must never see internal notes
    replies: safeReplies,
    timeline: safeTimeline,
    attachments: (data.attachments || []).map((file) =>
      formatAttachment(file, req)
    ),
    sla: calculateTicketSla(data),
    clientFeedback:
      data.clientFeedback && data.clientFeedback.rating
        ? {
            rating: data.clientFeedback.rating,
            comment: data.clientFeedback.comment || "",
            submittedAt: data.clientFeedback.submittedAt || null,
            submittedByName: data.clientFeedback.submittedByName || "",
          }
        : null,
  };
}

function ticketResponse(ticket) {
  return {
    id: ticket._id,
    _id: ticket._id,
    ticketNo: ticket.ticketNo,
    title: ticket.title,
    product: ticket.product,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    assignedTo:
      ticket.assignedEmployeeName || "Waiting for assignment",
    description: ticket.description,
    attachmentName: ticket.attachmentName || "",
    attachments: ticket.attachments || [],
    timeline: ticket.timeline || [],
    messages: ticket.messages || [],
  };
}

function formatClientAmcContract(contract) {
  if (!contract) return null;

  const data = contract.toObject ? contract.toObject() : { ...contract };

  return {
    id: String(data._id || data.id || ""),
    contractCode: data.contractCode || data.contractNo || "",
    clientId: String(data.clientId || ""),
    clientCode: data.clientCode || "",
    clientName: data.clientName || "",
    productId: String(data.productId || ""),
    productCode: data.productCode || "",
    productName: data.productName || "",
    productVersion: data.productVersion || "",
    contractType: data.plan || data.contractType || "Annual",
    startDate: data.startDate || data.startDate,
    endDate: data.expiryDate || data.endDate || null,
    amount: Number(data.totalAmount ?? data.amount ?? 0),
    gstPercent:
      Number(data.cgstRate || 0) + Number(data.sgstRate || 0) + Number(data.igstRate || 0),
    totalAmount: Number(data.totalAmount ?? data.amount ?? 0),
    status: data.status || "Pending",
    renewalStatus: data.reminderStatus || "Upcoming",
    supportLevel: data.plan || data.supportLevel || "Standard",
    responseTimeHours: Number(data.responseTimeHours || 0),
    assignedEmployeeId: String(data.assignedEmployeeId || "") || null,
    assignedEmployeeCode: data.assignedEmployeeCode || "",
    assignedEmployeeName: data.assignedEmployeeName || "",
    lastInvoiceId: String(data.currentInvoiceId || data.lastInvoiceId || "") || null,
    nextInvoiceDate: data.dueDate || data.nextInvoiceDate || null,
    lastPaymentDate: data.lastPaymentDate || null,
    notes: data.notes || "",
    createdBy: String(data.createdBy || "") || null,
    updatedBy: String(data.updatedBy || "") || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    pendingAmount: Number(data.pendingAmount ?? 0),
    paidAmount: Number(data.paidAmount ?? 0),
  };
}

function formatClientAmcInvoice(invoice) {
  if (!invoice) return null;

  const data = invoice.toObject ? invoice.toObject() : { ...invoice };

  return {
 id: String(
  data._id ||
  data.id ||
  ""
),

invoiceCode:
  data.invoiceCode ||
  "",

invoiceDate:
  data.invoiceDate ||
  null,

dueDate:
  data.dueDate ||
  null,

/*
 * REQUIRED FOR CUSTOM INVOICE MATCHING
 */
contractId: String(
  data.amcContractId ||
  data.contractId ||
  ""
),

amcContractId: String(
  data.amcContractId ||
  data.contractId ||
  ""
),

contractCode:
  data.contractCode ||
  "",
    contractStartDate: data.contractStartDate || null,
    contractExpiryDate: data.contractExpiryDate || null,
    productId: String(data.productId || ""),
    productCode: data.productCode || "",
    productName: data.productName || "",
    productVersion: data.productVersion || "",
    invoiceType: data.invoiceType || "AMC",
 taxableAmount:
  Number(
    data.taxableAmount ??
    0
  ),

cgstRate:
  Number(
    data.cgstRate ??
    0
  ),

cgstAmount:
  Number(
    data.cgstAmount ??
    0
  ),

sgstRate:
  Number(
    data.sgstRate ??
    0
  ),

sgstAmount:
  Number(
    data.sgstAmount ??
    0
  ),

igstRate:
  Number(
    data.igstRate ??
    0
  ),

igstAmount:
  Number(
    data.igstAmount ??
    0
  ),

gstAmount:
  Number(
    data.totalTaxAmount ??
    0
  ),

totalTaxAmount:
  Number(
    data.totalTaxAmount ??
    0
  ),

amount:
  Number(
    data.totalAmount ??
    data.amount ??
    0
  ),

totalAmount:
  Number(
    data.totalAmount ??
    data.amount ??
    0
  ),
    paymentStatus: data.paymentStatus || "Pending",
    paidAmount: Number(data.paidAmount ?? 0),
    balanceAmount: Number(data.pendingAmount ?? 0),
    paymentMode: data.paymentMode || "",
    transactionReference: data.transactionReference || "",
    pdfUrl: data.pdfUrl || "",
    notes: data.notes || "",
    status: data.status || "Issued",
    createdBy: String(data.createdBy || "") || null,
    updatedBy: String(data.updatedBy || "") || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    contractStart: data.contractStartDate || null,
    contractEnd: data.contractExpiryDate || null,
  };
}
function sanitizeClientFileName(fileName) {
  if (!fileName) return "Document";
  // Strip leading timestamp prefixes e.g. 1729384729-file.pdf or 1729384729_file.pdf
  let clean = String(fileName).replace(/^\d{9,14}[-_]/, "");
  return clean || fileName;
}

function mapClientDocumentCategory(documentType) {
  const dt = String(documentType || "").toLowerCase();
  if (dt.includes("invoice") || dt.includes("bill")) return "Invoices";
  if (dt.includes("receipt") || dt.includes("payment")) return "Receipts";
  if (dt.includes("amc") || dt.includes("contract")) return "AMC / Contracts";
  if (dt.includes("agreement") || dt.includes("sla") || dt.includes("nda")) return "Agreements";
  if (dt.includes("quotation") || dt.includes("proposal") || dt.includes("purchase order") || dt.includes("estimate") || dt.includes("po")) return "Proposals";
  return "Other";
}

function formatClientAmcDocument(
  document,
  contract
) {
  if (!document || !contract) {
    return null;
  }

  const documentId = String(
    document._id ||
    document.id ||
    ""
  );

  const contractId = String(
    contract._id ||
    contract.id ||
    ""
  );

  const rawFileName = document.fileName || "Document";
  const cleanName = sanitizeClientFileName(rawFileName);
  const clientCategory = mapClientDocumentCategory(document.documentType);

  return {
    id: documentId,
    _id: documentId,

    contractId,
    contractCode:
      contract.contractCode ||
      "",

    productId: String(
      contract.productId ||
      ""
    ),

    productCode:
      contract.productCode ||
      "",

    productName:
      contract.productName ||
      "",

    name: cleanName,
    displayName: cleanName,
    fileName: rawFileName,
    documentTitle: document.title || cleanName,

    documentType:
      document.documentType ||
      "Other Document",

    type:
      document.documentType ||
      "Other Document",

    category: clientCategory,
    rawCategory:
      document.documentType ||
      "Other Document",

    mimeType:
      document.mimeType ||
      "",

    size: Number(
      document.fileSize ||
      0
    ),

    fileSize: Number(
      document.fileSize ||
      0
    ),

    source:
      document.source ||
      "Uploaded",

    status:
      document.status ||
      "Available",

    uploadedAt:
      document.uploadedAt ||
      null,

    uploadedByName:
      document.uploadedByName ||
      "Support Desk",

    previewUrl:
      `/api/client/amc/document/${documentId}/view`,

    downloadUrl:
      `/api/client/amc/document/${documentId}/download`,
  };
}
async function findOwnAmcDocument(
  clientId,
  documentId
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      documentId
    )
  ) {
    return {
      error: {
        status: 400,
        message:
          "Invalid AMC document ID.",
      },
    };
  }

  /*
   * Critical security:
   * clientId is part of the query.
   *
   * Therefore Client A cannot access
   * Client B's AMC document simply by
   * knowing its document ID.
   */
  const contract =
    await AmcContract.findOne({
      clientId,
      isDeleted: false,

      documents: {
        $elemMatch: {
          _id: documentId,
          isDeleted: {
            $ne: true,
          },
          status: {
            $ne: "Archived",
          },
        },
      },
    });

  if (!contract) {
    return {
      error: {
        status: 404,
        message:
          "AMC document was not found.",
      },
    };
  }

  const document =
    contract.documents.id(
      documentId
    );

  if (
    !document ||
    document.isDeleted ||
    document.status ===
      "Archived"
  ) {
    return {
      error: {
        status: 404,
        message:
          "AMC document was not found.",
      },
    };
  }

  return {
    contract,
    document,
  };
}

function formatClientAmcPayment(payment) {
  if (!payment) return null;

  const data = payment.toObject ? payment.toObject() : { ...payment };

  const invoiceCode =
    data.invoiceCode ||
    (data.amcInvoiceId && typeof data.amcInvoiceId === "object" ? data.amcInvoiceId.invoiceCode : "") ||
    "";

  return {
    id: String(data._id || data.id || ""),
    paymentCode: data.paymentCode || "",
    invoiceCode: invoiceCode || "",
    invoiceId: String(data.amcInvoiceId?._id || data.amcInvoiceId || ""),
    contractId: String(data.amcContractId?._id || data.amcContractId || ""),
    contractCode: data.contractCode || "",
    clientId: String(data.clientId || ""),
    amount: Number(data.amount ?? 0),
    paymentDate: data.paymentDate || null,
    paymentMode: data.mode || data.paymentMode || "",
    transactionReference: data.referenceNo || data.transactionReference || "",
    remarks: data.notes || "",
    receivedBy: data.receivedByName || data.receivedBy || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

async function generateTicketNumber() {
  const lastTicket = await SupportTicket
    .findOne({ ticketNo: { $exists: true } })
    .sort({ createdAt: -1 });

  const year = new Date().getFullYear();

  if (!lastTicket?.ticketNo) {
    return `TKT-${year}-0001`;
  }

  const match = String(lastTicket.ticketNo).match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;

  return `TKT-${year}-${String(next).padStart(4, "0")}`;
}
router.get("/tickets", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const tickets = await SupportTicket.find({
      clientId: client._id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: tickets.map((ticket) => formatTicket(ticket, req)),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/tickets/:id", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    return res.json({
      success: true,
      data: formatTicket(ticket, req),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/amc/dashboard", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const [contracts, invoices, payments] = await Promise.all([
      AmcContract.find({ clientId: client._id, isDeleted: false }).sort({ startDate: -1 }).lean(),
      AmcInvoice.find({ clientId: client._id, isDeleted: false }).sort({ invoiceDate: -1 }).lean(),
      AmcPayment.find({ clientId: client._id, isDeleted: false }).sort({ paymentDate: -1 }).lean(),
    ]);

    const totalBilled = invoices.reduce(
      (total, invoice) => total + Number(invoice.totalAmount ?? invoice.amount ?? 0),
      0
    );

    const totalPaid = invoices.reduce(
      (total, invoice) => total + Number(invoice.paidAmount ?? 0),
      0
    );

    const pendingAmount = invoices.reduce(
      (total, invoice) => total + Number(invoice.pendingAmount ?? 0),
      0
    );

    const nextDueInvoice = invoices
      .filter((invoice) => invoice.paymentStatus !== "Paid" && invoice.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;

    const currentContract =
      contracts.find((contract) => contract.status === "Active") ||
      contracts.find((contract) => !["Cancelled", "Paid"].includes(contract.status)) ||
      contracts[0] ||
      null;

    return res.json({
      success: true,
      data: {
        totalBilled,
        totalPaid,
        pendingAmount,
        nextDueDate: nextDueInvoice ? nextDueInvoice.dueDate : null,
        currentContract: formatClientAmcContract(currentContract),
        latestInvoice: formatClientAmcInvoice(invoices[0] || null),
        paymentHistory: payments.map(formatClientAmcPayment),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/amc/contracts", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const contracts = await AmcContract.find({ clientId: client._id, isDeleted: false })
      .sort({ startDate: -1 })
      .lean();

    return res.json({
      success: true,
      data: contracts.map(formatClientAmcContract),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   AMC RENEWAL & QUOTATION REQUESTS (CLIENT PORTAL)
========================================================= */

function formatClientAmcRequest(reqDoc) {
  if (!reqDoc) return null;
  const d = reqDoc.toObject ? reqDoc.toObject() : { ...reqDoc };
  return {
    id: String(d._id),
    _id: String(d._id),
    requestCode: d.requestCode,
    contractId: String(d.contractId),
    contractCode: d.contractCode || "",
    productId: d.productId ? String(d.productId) : null,
    productName: d.productName || "",
    currentExpiryDate: d.currentExpiryDate || null,
    requestType: d.requestType,
    renewalPeriod: d.renewalPeriod || "1 Year",
    preferredStartDate: d.preferredStartDate || null,
    remarks: d.remarks || "",
    status: d.status,
    quotationAmount: Number(d.quotationAmount || 0),
    quotationDetails: d.quotationDetails || "",
    hasQuotationDocument: Boolean(d.quotationDocument && d.quotationDocument.filePath),
    quotationDocumentName: d.quotationDocument ? d.quotationDocument.fileName : "",
    quotationDocumentSize: d.quotationDocument ? d.quotationDocument.fileSize : 0,
    quotationDownloadUrl: d.quotationDocument && d.quotationDocument.filePath
      ? `/api/client/amc/requests/${d._id}/quotation`
      : null,
    timeline: (d.timeline || []).map((t) => ({
      action: t.action,
      status: t.status,
      remarks: t.remarks || "",
      performedByName: t.performedByRole === "client" ? "You" : (t.performedByName || "AMC Support Desk"),
      performedByRole: t.performedByRole || "system",
      timestamp: t.timestamp,
    })),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

async function getNextAmcRequestCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `amc_req_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `AMC-REQ-${year}-${String(counter.seq).padStart(4, "0")}`;
}

// GET /api/client/amc/requests
router.get("/amc/requests", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const requests = await ClientAmcRequest.find({
      clientId: client._id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: requests.map(formatClientAmcRequest),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/client/amc/renewal-request
router.post("/amc/renewal-request", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const {
      contractId,
      requestType = "AMC Renewal",
      renewalPeriod = "1 Year",
      preferredStartDate,
      remarks = "",
    } = req.body;

    // 1. Validate contractId
    if (!contractId || !mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({
        success: false,
        message: "A valid AMC contract is required.",
      });
    }

    // 2. Validate requestType
    const allowedTypes = ["AMC Renewal", "Quotation Request"];
    if (!allowedTypes.includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid request type. Must be one of: ${allowedTypes.join(", ")}`,
      });
    }

    // 3. Validate renewalPeriod
    if (renewalPeriod !== "1 Year") {
      return res.status(400).json({
        success: false,
        message: "Renewal period currently only supports '1 Year'.",
      });
    }

    // 4. Verify contract belongs to logged-in client (tenant isolation)
    const contract = await AmcContract.findOne({
      _id: contractId,
      clientId: client._id,
      isDeleted: false,
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "AMC contract not found or does not belong to your account.",
      });
    }

    // 5. Pre-check for active request of the same type
    const existingActive = await ClientAmcRequest.findOne({
      clientId: client._id,
      contractId: contract._id,
      requestType,
      status: { $in: ["Submitted", "Under Review", "Quotation Ready"] },
      isDeleted: false,
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: `An active ${requestType} request (${existingActive.requestCode}) is already pending for this contract.`,
      });
    }

    // 6. Generate unique request code and activeRequestKey
    const requestCode = await getNextAmcRequestCode();
    const activeRequestKey = `${client._id}:${contract._id}:${requestType}`;

    const newRequest = new ClientAmcRequest({
      requestCode,
      activeRequestKey,
      clientId: client._id,
      clientCode: client.clientCode || "",
      clientName: client.companyName || client.contactPerson || "",
      contractId: contract._id,
      contractCode: contract.contractCode || "",
      productId: contract.productId || null,
      productName: contract.productName || "AMC Software Support",
      currentExpiryDate: contract.expiryDate || contract.endDate || null,
      requestType,
      renewalPeriod: "1 Year",
      preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
      remarks: String(remarks || "").trim().slice(0, 1000),
      status: "Submitted",
      timeline: [
        {
          action: "Request Submitted",
          status: "Submitted",
          remarks: String(remarks || "").trim() || `${requestType} submitted by client`,
          performedBy: req.user._id,
          performedByName: client.companyName || client.contactPerson || "Client",
          performedByRole: "client",
          timestamp: new Date(),
        },
      ],
    });

    await newRequest.save();

    return res.status(201).json({
      success: true,
      message: "Your request has been submitted successfully.",
      data: formatClientAmcRequest(newRequest),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An active renewal or quotation request is already pending for this contract.",
      });
    }
    next(err);
  }
});

// PATCH /api/client/amc/requests/:id/cancel
router.patch("/amc/requests/:id/cancel", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    const request = await ClientAmcRequest.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    // Cancellation policy:
    // Only "Submitted" requests can be cancelled directly by the client.
    // If "Under Review" or "Quotation Ready", return 409 Conflict.
    if (["Under Review", "Quotation Ready"].includes(request.status)) {
      return res.status(409).json({
        success: false,
        message: "This request is already under review and cannot be cancelled directly. Please contact support.",
      });
    }

    if (["Completed", "Rejected", "Cancelled"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status.toLowerCase()}.`,
      });
    }

    // Cancel the request and clear activeRequestKey so sparse unique index is freed
    request.status = "Cancelled";
    request.activeRequestKey = null;
    request.timeline.push({
      action: "Request Cancelled",
      status: "Cancelled",
      remarks: String(req.body.remarks || "Cancelled by client").trim(),
      performedBy: req.user._id,
      performedByName: client.companyName || client.contactPerson || "Client",
      performedByRole: "client",
      timestamp: new Date(),
    });

    await request.save();

    return res.json({
      success: true,
      message: "Request cancelled successfully.",
      data: formatClientAmcRequest(request),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/client/amc/requests/:id/quotation
router.get("/amc/requests/:id/quotation", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    const request = await ClientAmcRequest.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (!request.quotationDocument || !request.quotationDocument.filePath) {
      return res.status(404).json({
        success: false,
        message: "Quotation document is not available for this request.",
      });
    }

    const filePath = request.quotationDocument.filePath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Quotation file was not found on the server.",
      });
    }

    res.setHeader("Content-Type", request.quotationDocument.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(request.quotationDocument.fileName || 'quotation.pdf')}"`
    );
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
});

router.get("/amc/invoices", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const invoices = await AmcInvoice.find({ clientId: client._id, isDeleted: false })
      .sort({ invoiceDate: -1 })
      .lean();

    return res.json({
      success: true,
      data: invoices.map(formatClientAmcInvoice),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/amc/invoices/:id", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID.",
      });
    }

    const invoice = await AmcInvoice.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    }).lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "AMC invoice not found.",
      });
    }

    return res.json({
      success: true,
      data: formatClientAmcInvoice(invoice),
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   CLIENT AMC DOCUMENTS
   GET /api/client/amc/documents
========================================================= */

router.get(
  "/amc/documents",

  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        client,
        error,
      } =
        await findOwnClient(
          req
        );

      if (error) {
        return res
          .status(
            error.status
          )
          .json({
            success: false,
            message:
              error.message,
          });
      }

      /*
       * Only this client's AMC contracts.
       */
      const contracts =
        await AmcContract.find({
          clientId:
            client._id,

          isDeleted:
            false,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      const documents =
        [];

      for (
        const contract
        of contracts
      ) {
        for (
          const document
          of contract.documents ||
          []
        ) {
          if (
            document.isDeleted ||
            document.status ===
              "Archived"
          ) {
            continue;
          }

          const formatted =
            formatClientAmcDocument(
              document,
              contract
            );

          if (formatted) {
            documents.push(
              formatted
            );
          }
        }
      }

      /*
       * Latest documents first.
       */
      documents.sort(
        (a, b) =>
          new Date(
            b.uploadedAt ||
            0
          ) -
          new Date(
            a.uploadedAt ||
            0
          )
      );

      return res.json({
        success: true,

        data:
          documents,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   PREVIEW CLIENT AMC DOCUMENT
   GET /api/client/amc/document/:documentId/view
========================================================= */

router.get(
  "/amc/document/:documentId/view",

  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        client,
        error,
      } =
        await findOwnClient(
          req
        );

      if (error) {
        return res
          .status(
            error.status
          )
          .json({
            success: false,
            message:
              error.message,
          });
      }

      const result =
        await findOwnAmcDocument(
          client._id,
          req.params
            .documentId
        );

      if (result.error) {
        return res
          .status(
            result.error
              .status
          )
          .json({
            success: false,
            message:
              result.error
                .message,
          });
      }

      const {
        document,
      } = result;

      const absolutePath =
        path.resolve(
          __dirname,
          document.relativePath
        );

      /*
       * Prevent path traversal / access
       * outside the uploads directory.
       */
      const uploadsRoot =
        path.resolve(
          __dirname,
          "uploads"
        );

      const relative =
        path.relative(
          uploadsRoot,
          absolutePath
        );

      if (
        relative.startsWith(
          ".."
        ) ||
        path.isAbsolute(
          relative
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Invalid document path.",
          });
      }

      if (
        !fs.existsSync(
          absolutePath
        )
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Document file is not available.",
          });
      }

      const safeName =
        String(
          document.fileName ||
          "document"
        ).replace(
          /[\r\n"]/g,
          "_"
        );

      res.setHeader(
        "Content-Type",

        document.mimeType ||
        "application/octet-stream"
      );

      res.setHeader(
        "Content-Disposition",

        `inline; filename="${safeName}"`
      );

      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );

      return res.sendFile(
        absolutePath
      );
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   DOWNLOAD CLIENT AMC DOCUMENT
   GET /api/client/amc/document/:documentId/download
========================================================= */

router.get(
  "/amc/document/:documentId/download",

  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        client,
        error,
      } =
        await findOwnClient(
          req
        );

      if (error) {
        return res
          .status(
            error.status
          )
          .json({
            success: false,
            message:
              error.message,
          });
      }

      const result =
        await findOwnAmcDocument(
          client._id,
          req.params
            .documentId
        );

      if (result.error) {
        return res
          .status(
            result.error
              .status
          )
          .json({
            success: false,

            message:
              result.error
                .message,
          });
      }

      const {
        document,
      } = result;

      const absolutePath =
        path.resolve(
          __dirname,
          document.relativePath
        );

      const uploadsRoot =
        path.resolve(
          __dirname,
          "uploads"
        );

      const relative =
        path.relative(
          uploadsRoot,
          absolutePath
        );

      if (
        relative.startsWith(
          ".."
        ) ||
        path.isAbsolute(
          relative
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Invalid document path.",
          });
      }

      if (
        !fs.existsSync(
          absolutePath
        )
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Document file is not available.",
          });
      }

      return res.download(
        absolutePath,

        document.fileName ||
        "document"
      );
    } catch (error) {
      next(error);
    }
  }
);
router.get("/amc/payments", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const payments = await AmcPayment.find({ clientId: client._id, isDeleted: false })
      .sort({ paymentDate: -1 })
      .lean();

    return res.json({
      success: true,
      data: payments.map(formatClientAmcPayment),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GENERATE CLIENT PAYMENT RECEIPT PDF
   ========================================================= */
function generatePaymentReceiptPdf({ payment, client, invoice, company }) {
  if (!jsPDF) {
    throw new Error("PDF generation library is unavailable.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // 1. Top Decorative Brand Bar
  doc.setFillColor(27, 89, 248); // #1B59F8 Royal Blue
  doc.rect(0, 0, pageWidth, 5, "F");

  // 2. Header: Company Info on Left, RECEIPT on Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(27, 89, 248);
  doc.text((company.name || "TOTAL SOLUTION").toUpperCase(), margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(company.tagline || "Client Connect & AMC Maintenance Management", margin, 25);
  doc.text(company.address || "Billing & Customer Support", margin, 29);
  doc.text(`Email: ${company.email || "billing@totalsolution.in"} | Phone: ${company.phone || "+91 98765 43210"}`, margin, 33);
  if (company.gstNo) {
    doc.text(`GSTIN: ${company.gstNo}`, margin, 37);
  }

  // Right Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("PAYMENT RECEIPT", pageWidth - margin, 20, { align: "right" });

  // Receipt Number & Date Badge
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - margin - 65, 25, 65, 14, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(27, 89, 248);
  doc.text("RECEIPT NO:", pageWidth - margin - 62, 30);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(payment.paymentCode || "AMC-PAY", pageWidth - margin - 3, 30, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("DATE:", pageWidth - margin - 62, 35);
  doc.setTextColor(15, 23, 42);
  doc.text(payment.formattedDate || "—", pageWidth - margin - 3, 35, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 43, pageWidth - margin, 43);

  // 3. Two Information Cards: Received From & Payment Details
  const cardY = 48;
  const cardHeight = 38;
  const colWidth = (contentWidth - 6) / 2;

  // Card 1: Received From (Left)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cardY, colWidth, cardHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(27, 89, 248);
  doc.text("RECEIVED FROM", margin + 4, cardY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(client.companyName || "Valued Client", margin + 4, cardY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  let cy = cardY + 17;
  if (client.contactPerson) {
    doc.text(`Contact: ${client.contactPerson}`, margin + 4, cy);
    cy += 4.5;
  }
  if (client.address) {
    doc.text(client.address.substring(0, 48), margin + 4, cy);
    cy += 4.5;
  }
  if (client.gstNo) {
    doc.text(`GSTIN: ${client.gstNo}`, margin + 4, cy);
  }

  // Card 2: Payment Details (Right)
  const col2X = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, cardY, colWidth, cardHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(27, 89, 248);
  doc.text("PAYMENT DETAILS", col2X + 4, cardY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Payment Mode:", col2X + 4, cardY + 12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(payment.mode || "Bank Transfer", col2X + colWidth - 4, cardY + 12, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Reference / UTR:", col2X + 4, cardY + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(payment.referenceNo || "—", col2X + colWidth - 4, cardY + 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Payment Status:", col2X + 4, cardY + 22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("VERIFIED & RECEIVED", col2X + colWidth - 4, cardY + 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Processed By:", col2X + 4, cardY + 27);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(payment.receivedByName || "Billing Desk", col2X + colWidth - 4, cardY + 27, { align: "right" });

  // 4. Breakdown Table
  const tableY = 94;
  doc.setFillColor(27, 89, 248);
  doc.rect(margin, tableY, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION / PARTICULARS", margin + 4, tableY + 5.5);
  doc.text("AGAINST INVOICE", margin + 100, tableY + 5.5);
  doc.text("AMOUNT RECEIVED", pageWidth - margin - 4, tableY + 5.5, { align: "right" });

  // Table Row
  const rowY = tableY + 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, rowY, contentWidth, 14, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(payment.productName ? `AMC Support - ${payment.productName}` : "Annual Maintenance Contract (AMC) Payment", margin + 4, rowY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(payment.contractCode ? `Contract Ref: ${payment.contractCode}` : "Official Support Installment", margin + 4, rowY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(27, 89, 248);
  doc.text(payment.invoiceCode || "—", margin + 100, rowY + 5.5);

  if (invoice && invoice.invoiceDate) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dated: ${invoice.invoiceDate}`, margin + 100, rowY + 10);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, rowY + 7, { align: "right" });

  // 5. Total Highlight Box
  const totalY = rowY + 18;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(pageWidth - margin - 85, totalY, 85, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text("TOTAL AMOUNT RECEIVED:", pageWidth - margin - 80, totalY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(22, 101, 52);
  doc.text(`INR ${Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, totalY + 13, { align: "right" });

  // 6. Remarks / Notes (if any)
  if (payment.notes) {
    const notesY = totalY + 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Remarks / Notes:", margin, notesY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(String(payment.notes), margin, notesY + 5);
  }

  // 7. Verification Seal & Sign-off
  const footerY = 165;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("This is a computer-generated official payment receipt. No physical signature is required.", margin, footerY + 6);
  doc.text(`For billing inquiries or GST-stamped copies, contact ${company.email || "billing@totalsolution.in"}`, margin, footerY + 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`FOR ${(company.name || "TOTAL SOLUTION").toUpperCase()}`, pageWidth - margin, footerY + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Finance Signatory", pageWidth - margin, footerY + 18, { align: "right" });

  return Buffer.from(doc.output("arraybuffer"));
}

/* =========================================================
   GET /api/client/amc/payment/:id/receipt
   Download authenticated official payment receipt PDF
   ========================================================= */
router.get("/amc/payment/:id/receipt", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID.",
      });
    }

    const payment = await AmcPayment.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    }).lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment receipt not found.",
      });
    }

    let relatedInvoice = null;
    if (payment.amcInvoiceId) {
      relatedInvoice = await AmcInvoice.findOne({
        _id: payment.amcInvoiceId,
        clientId: client._id,
        isDeleted: false,
      }).lean();
    }

    let company = {
      name: "Total Solution",
      tagline: "Client Connect & AMC Maintenance Management",
      address: "Billing & Customer Support",
      email: "billing@totalsolution.in",
      phone: "+91 98765 43210",
      gstNo: "",
    };

    try {
      const SystemSettings = mongoose.models.SystemSettings;
      if (SystemSettings) {
        const settings = await SystemSettings.findOne().lean();
        if (settings?.company?.companyName) {
          company.name = settings.company.companyName;
        }
        if (settings?.company?.address) {
          company.address = [settings.company.address, settings.company.city, settings.company.state].filter(Boolean).join(", ");
        }
        if (settings?.company?.email) {
          company.email = settings.company.email;
        }
        if (settings?.company?.mobile) {
          company.phone = settings.company.mobile;
        }
        if (settings?.company?.gstNo) {
          company.gstNo = settings.company.gstNo;
        }
      }
    } catch (e) {
      // Fallback cleanly to default branding
    }

    const formattedPaymentDate = payment.paymentDate
      ? new Date(payment.paymentDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

    const formattedInvoiceDate = relatedInvoice?.invoiceDate
      ? new Date(relatedInvoice.invoiceDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

    const pdfBuffer = generatePaymentReceiptPdf({
      payment: {
        paymentCode: payment.paymentCode || "AMC-PAY",
        amount: payment.amount || 0,
        mode: payment.mode || "Bank Transfer",
        referenceNo: payment.referenceNo || "—",
        productName: payment.productName || "",
        contractCode: payment.contractCode || "",
        invoiceCode: payment.invoiceCode || relatedInvoice?.invoiceCode || "—",
        formattedDate: formattedPaymentDate,
        notes: payment.notes || "",
        receivedByName: payment.receivedByName || "Billing Desk",
      },
      client: {
        companyName: client.companyName || client.name || "Valued Client",
        contactPerson: client.contactPerson || "",
        address: [client.addressLine1, client.addressLine2, client.city, client.state, client.pinCode].filter(Boolean).join(", "),
        gstNo: client.gstNo || "",
      },
      invoice: {
        invoiceCode: relatedInvoice?.invoiceCode || payment.invoiceCode || "—",
        invoiceDate: formattedInvoiceDate,
      },
      company,
    });

    const cleanPaymentCode = (payment.paymentCode || id).replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Payment-Receipt-${cleanPaymentCode}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.get("/amc/invoice/:id/pdf", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID.",
      });
    }

    const invoice = await AmcInvoice.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    }).lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "AMC invoice not found.",
      });
    }

    if (!invoice.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: "Invoice PDF is not available.",
      });
    }

    const pdfUrl = String(invoice.pdfUrl).trim();

    if (pdfUrl.startsWith("http")) {
      return res.redirect(pdfUrl);
    }

    return res.redirect(`${req.protocol}://${req.get("host")}${pdfUrl}`);
  } catch (error) {
    next(error);
  }
});

router.put("/tickets/:id", upload.single("attachment"), async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    });

    if (!ticket) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    if (!["New", "Assigned"].includes(ticket.status)) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(403).json({
        success: false,
        message: "Only New or Assigned tickets can be edited.",
      });
    }

    const {
      title,
      description,
      productName,
      category,
      priority,
      module,
    } = req.body;

    if (!title || !description || !productName) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(400).json({
        success: false,
        message: "Title, description and product are required.",
      });
    }

    const product = client.products.find(
      (p) => p.productName === productName
    );

    if (req.file) {
      if (ticket.attachments?.length > 0) {
        const previousFileUrl = ticket.attachments[0].fileUrl;
        const previousFilePath = path.join(
          __dirname,
          previousFileUrl.replace(/^\//, "")
        );

        if (fs.existsSync(previousFilePath)) {
          fs.unlinkSync(previousFilePath);
        }
      }

      ticket.attachments = [
        {
          fileName: req.file.originalname,
          fileUrl: '/uploads/tickets/' + req.file.filename,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedBy: req.user._id,
          uploadedByName:
            client.contactPerson || client.companyName,
          uploadedByRole: "client",
          uploadedAt: new Date(),
        },
      ];

      ticket.timeline.push({
        type: "attachment",
        title: "Attachment Updated",
        description: req.file.originalname + " uploaded by the client.",
        performedBy: req.user._id,
        performedByName:
          client.contactPerson || client.companyName,
        performedByRole: "client",
        createdAt: new Date(),
      });
    }

    ticket.title = String(title).trim();
    ticket.description = String(description).trim();
    ticket.productId = product?.productId || ticket.productId || null;
    ticket.productName = productName;
    ticket.productVersion = product?.version || ticket.productVersion || "";
    ticket.module = module || ticket.module || "General";
    ticket.category = category || ticket.category || "Other";
    ticket.priority = priority || ticket.priority || "Medium";
    ticket.updatedAt = new Date();

    ticket.timeline.push({
      type: "updated",
      title: "Ticket Updated",
      description: "The ticket details were updated by the client.",
      performedBy: req.user._id,
      performedByName:
        client.contactPerson || client.companyName,
      performedByRole: "client",
      createdAt: new Date(),
    });

    await ticket.save();

    return res.json({
      success: true,
      message: "Support ticket updated successfully.",
      data: formatTicket(ticket, req),
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    next(error);
  }
});

/* =========================================================
   CLIENT ADD TICKET REPLY
   POST /api/client/tickets/:id/reply
========================================================= */
router.post("/tickets/:id/reply", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID." });
    }

    const normalizedMessage = String(message || "").trim();
    if (!normalizedMessage) {
      return res.status(400).json({ success: false, message: "Reply message cannot be empty." });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    const authorName = client.contactPerson || client.companyName || "Client";

    ticket.replies.push({
      message: normalizedMessage,
      replyType: "Public",
      authorId: req.user._id,
      authorName,
      authorRole: "client",
      createdAt: new Date(),
    });

    ticket.timeline.push({
      type: "reply",
      title: "Client Replied",
      description: normalizedMessage.length > 80 ? normalizedMessage.substring(0, 77) + "..." : normalizedMessage,
      performedBy: req.user._id,
      performedByName: authorName,
      performedByRole: "client",
      createdAt: new Date(),
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    return res.json({
      success: true,
      message: "Reply sent successfully.",
      data: formatTicket(ticket, req),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CLIENT UPDATE TICKET STATUS (CONFIRM RESOLUTION / REOPEN)
   POST /api/client/tickets/:id/status
========================================================= */
router.post("/tickets/:id/status", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { id } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID." });
    }

    if (!["Closed", "New", "In Progress"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status update action." });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    const authorName = client.contactPerson || client.companyName || "Client";

    if (status === "Closed") {
      ticket.status = "Closed";
      ticket.closedAt = new Date();
      if (!ticket.resolvedAt) {
        ticket.resolvedAt = ticket.closedAt;
      }
      if (!ticket.firstResolvedAt) {
        ticket.firstResolvedAt = ticket.resolvedAt;
      }
      if (!ticket.firstResponseAt) {
        ticket.firstResponseAt = ticket.resolvedAt;
      }
      ticket.timeline.push({
        type: "closed",
        title: "Ticket Closed by Client",
        description: note || "Client confirmed satisfactory resolution.",
        performedBy: req.user._id,
        performedByName: authorName,
        performedByRole: "client",
        createdAt: new Date(),
      });
    } else {
      ticket.status = "New";
      ticket.timeline.push({
        type: "reopened",
        title: "Ticket Reopened by Client",
        description: note || "Client requested further assistance on this issue.",
        performedBy: req.user._id,
        performedByName: authorName,
        performedByRole: "client",
        createdAt: new Date(),
      });
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    return res.json({
      success: true,
      message: `Ticket marked as ${ticket.status}.`,
      data: formatTicket(ticket, req),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   SUBMIT CLIENT FEEDBACK
   POST /api/client/tickets/:id/feedback
========================================================= */
router.post("/tickets/:id/feedback", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID." });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      clientId: client._id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    // Verify ticket is in an eligible post-resolution state
    const eligibleStatuses = ["Resolved", "Verified", "Closed"];
    if (!eligibleStatuses.includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted for resolved or closed tickets.",
      });
    }

    // Prevent duplicate feedback
    if (ticket.clientFeedback && ticket.clientFeedback.rating) {
      return res.status(409).json({
        success: false,
        message: "Feedback has already been submitted for this ticket.",
      });
    }

    // Validate rating: integer 1..5
    const rawRating = req.body.rating;
    const rating = Number(rawRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    // Validate comment: optional, max 1000 characters
    let comment = "";
    if (typeof req.body.comment === "string") {
      comment = req.body.comment.trim();
      if (comment.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot exceed 1000 characters.",
        });
      }
    }

    const authorName = client.contactPerson || client.companyName || "Client";

    ticket.clientFeedback = {
      rating,
      comment,
      submittedAt: new Date(),
      submittedByClientId: client._id,
      submittedByName: authorName,
    };

    ticket.timeline.push({
      type: "feedback",
      title: "Client Feedback Submitted",
      description: `Client submitted a ${rating}-star rating.`,
      performedBy: req.user._id,
      performedByName: authorName,
      performedByRole: "client",
      createdAt: new Date(),
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    return res.json({
      success: true,
      message: "Thank you for your feedback.",
      data: formatTicket(ticket, req),
    });
  } catch (error) {
    next(error);
  }
});

async function findBestEmployeeForTicket(client) {
  const Employee =
    mongoose.models.Employee;

  const Task =
    mongoose.models.Task;

  const SupportTicket =
    mongoose.models.SupportTicket;

  if (!Employee) {
    throw new Error(
      "Employee model is not available."
    );
  }

  /*
   * Eligible employees:
   * Free or Working only.
   *
   * Never auto-assign:
   * Break
   * Leave
   * Offline
   * Inactive
   */
  const employees =
    await Employee.find({
      isActive: {
        $ne: false,
      },

      status: {
        $in: [
          "Free",
          "Working",
        ],
      },
    }).lean();

  if (!employees.length) {
    return null;
  }

  const employeeIds =
    employees.map(
      (employee) =>
        employee._id
    );

  /*
   * Count active tasks.
   */
  const taskCounts = Task
    ? await Task.aggregate([
        {
          $match: {
            assignedEmployeeId: {
              $in: employeeIds,
            },

            isDeleted: false,

            status: {
              $nin: [
                "Completed",
                "Closed",
                "Cancelled",
              ],
            },
          },
        },

        {
          $group: {
            _id:
              "$assignedEmployeeId",

            count: {
              $sum: 1,
            },
          },
        },
      ])
    : [];

  const taskMap =
    new Map(
      taskCounts.map(
        (item) => [
          String(item._id),
          Number(item.count || 0),
        ]
      )
    );

  /*
   * Count active tickets.
   */
  const ticketCounts =
    SupportTicket
      ? await SupportTicket.aggregate([
          {
            $match: {
              assignedEmployeeId: {
                $in: employeeIds,
              },

              isDeleted: false,

              status: {
                $nin: [
                  "Resolved",
                  "Verified",
                  "Closed",
                  "Cancelled",
                ],
              },
            },
          },

          {
            $group: {
              _id:
                "$assignedEmployeeId",

              count: {
                $sum: 1,
              },
            },
          },
        ])
      : [];

  const ticketMap =
    new Map(
      ticketCounts.map(
        (item) => [
          String(item._id),
          Number(item.count || 0),
        ]
      )
    );

  const ranked =
    employees.map(
      (employee) => {
        const activeTasks =
          taskMap.get(
            String(employee._id)
          ) || 0;

        const activeTickets =
          ticketMap.get(
            String(employee._id)
          ) || 0;

        return {
          employee,

          activeTasks,

          activeTickets,

          workload:
            activeTasks +
            activeTickets,
        };
      }
    );

  /*
   * ==========================================
   * RULE 1
   * Client's assigned employee ONLY if FREE.
   * ==========================================
   */

  if (
    client.assignedEmployeeId
  ) {
    const preferred =
      ranked.find(
        (item) =>
          String(
            item.employee._id
          ) ===
          String(
            client.assignedEmployeeId
          )
      );

    if (
      preferred &&
      preferred.employee.status ===
        "Free"
    ) {
      return {
        ...preferred,

        reason:
          "CLIENT_EMPLOYEE_FREE",
      };
    }
  }

  /*
   * ==========================================
   * RULE 2
   * Any FREE employee with least workload.
   * ==========================================
   */

  const freeEmployees =
    ranked
      .filter(
        (item) =>
          item.employee.status ===
          "Free"
      )
      .sort(
        (a, b) =>
          a.workload -
          b.workload
      );

  if (freeEmployees.length) {
    return {
      ...freeEmployees[0],

      reason:
        "FREE_EMPLOYEE_LEAST_WORKLOAD",
    };
  }

  /*
   * ==========================================
   * RULE 3
   * Nobody Free -> Working employee
   * with least workload.
   * ==========================================
   */

  const workingEmployees =
    ranked
      .filter(
        (item) =>
          item.employee.status ===
          "Working"
      )
      .sort(
        (a, b) =>
          a.workload -
          b.workload
      );

  if (workingEmployees.length) {
    return {
      ...workingEmployees[0],

      reason:
        "WORKING_EMPLOYEE_LEAST_WORKLOAD",
    };
  }

  return null;
}

router.post("/tickets", upload.single("attachment"), async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const {
      title,
      description,
      productName,
      category,
      priority,
      module,
    } = req.body;

    if (!title || !description || !productName) {
      return res.status(400).json({
        success: false,
        message: "Title, description and product are required.",
      });
    }

    const product = client.products.find(
      (p) => p.productName === productName
    );

 const ticketCode =
  await generateTicketCode();

/*
 * Smart employee selection
 */
const autoAssignment =
  await findBestEmployeeForTicket(
    client
  );

const assignedEmployee =
  autoAssignment?.employee ||
  null;

console.log(
  "[AUTO TICKET ASSIGNMENT]",
  {
    ticketCode,

    client:
      client.companyName,

    employee:
      assignedEmployee
        ? assignedEmployee.name
        : "Unassigned",

    employeeCode:
      assignedEmployee
        ? assignedEmployee.employeeCode
        : "",

    reason:
      autoAssignment?.reason ||
      "NO_AVAILABLE_EMPLOYEE",

    workload:
      autoAssignment?.workload ??
      null,

    activeTasks:
      autoAssignment?.activeTasks ??
      null,

    activeTickets:
      autoAssignment?.activeTickets ??
      null,
  }
);

const ticketCreatedAt = new Date();
const effectivePriority = priority || "Medium";
const slaPolicy = getTicketSlaPolicy(effectivePriority);
const slaFirstResponseMinutes = slaPolicy.firstResponseMinutes;
const slaResolutionMinutes = slaPolicy.resolutionMinutes;
const firstResponseDueAt = calculateDueAt(
  ticketCreatedAt,
  slaFirstResponseMinutes
);
const resolutionDueAt = calculateDueAt(
  ticketCreatedAt,
  slaResolutionMinutes
);

const ticket =
  await SupportTicket.create({
      ticketCode,
      createdAt: ticketCreatedAt,
      slaFirstResponseMinutes,
      slaResolutionMinutes,
      firstResponseDueAt,
      resolutionDueAt,
      slaPolicyVersion: SLA_POLICY_VERSION,
      title: String(title).trim(),
      description: String(description).trim(),

      clientId: client._id,
      clientCode: client.clientCode,
      clientName: client.companyName,
      contactPerson: client.contactPerson,
      contactMobile: client.mobile,
      contactEmail: client.email,

      productId: product?.productId || null,
      productName,
      productVersion: product?.version || "",

      module: module || "General",
      category: category || "Other",
      priority: effectivePriority,
      source: "Client Portal",

assignedEmployeeId:
  assignedEmployee
    ? assignedEmployee._id
    : null,

assignedEmployeeCode:
  assignedEmployee
    ? assignedEmployee.employeeCode || ""
    : "",

assignedEmployeeName:
  assignedEmployee
    ? assignedEmployee.name
    : "Unassigned",

assignedAt:
  assignedEmployee
    ? new Date()
    : null,

      createdBy: req.user._id,
      createdByName:
        client.contactPerson || client.companyName,
      createdByRole: "client",

      attachments: req.file
        ? [
            {
              fileName: req.file.originalname,
              fileUrl: `/uploads/tickets/${req.file.filename}`,
              fileType: req.file.mimetype,
              fileSize: req.file.size,
              uploadedBy: req.user._id,
              uploadedByName: client.contactPerson || client.companyName,
              uploadedByRole: "client",
            },
          ]
        : [],

      timeline: [
        {
          title: "Ticket Created",
          description:
            "Support request submitted from the client portal.",
          status: "New",
          actorName:
            client.contactPerson || client.companyName,
          actorRole: "client",
          createdAt: new Date(),
        },
      ],
    });

    await Client.updateOne(
      { _id: client._id },
      { $inc: { openTickets: 1 } }
    );

    try {
      await ClientNotification.create({
        clientId: client._id,
        type: "TICKET_CREATED",
        title: "Support Ticket Raised",
        message: `Support ticket ${ticket.ticketCode} (${ticket.title}) has been registered.`,
        entityType: "ticket",
        entityCode: ticket.ticketCode || "",
        entityId: ticket._id,
        navigationTarget: "tickets",
        dedupKey: `tkt_created_${ticket._id}`,
        createdAt: ticket.createdAt || new Date(),
      });
    } catch (notifErr) {
      // Non-blocking for notification insertion
    }

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully.",
      data: formatTicket(ticket, req),
    });
  } catch (error) {
    next(error);
  }
});
async function generateTicketCode() {
  const year = new Date().getFullYear();

  const lastTicket = await SupportTicket.findOne({
    ticketCode: new RegExp(`^TKT-${year}-`),
  }).sort({ createdAt: -1 });

  if (!lastTicket?.ticketCode) {
    return `TKT-${year}-0001`;
  }

  const match = lastTicket.ticketCode.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;

  return `TKT-${year}-${String(next).padStart(4, "0")}`;
}

/* =========================================================
   GET CURRENT CLIENT PROFILE
   GET /api/client/me
========================================================= */

router.get("/me", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      data: clientResponse(client),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CLIENT DASHBOARD
   GET /api/client/dashboard
========================================================= */

router.get("/dashboard", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);

    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

const [
  tickets,
  openTicketCount,
  activity,
  recentInvoices,
] = await Promise.all([
      SupportTicket
        ? SupportTicket.find({ clientId: client._id, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        : [],

      SupportTicket
        ? SupportTicket.countDocuments({
            clientId: client._id,
            isDeleted: false,
            status: { $nin: ["Resolved", "Closed", "Cancelled"] },
          })
        : 0,

      ActivityLog
        ? ActivityLog.find({ clientId: client._id, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(6)
            .lean()
        : [],
        AmcInvoice
  ? AmcInvoice.find({
      clientId:
        client._id,

      isDeleted:
        false,
    })
      .sort({
        invoiceDate: -1,
      })
      .limit(5)
      .lean()
  : [],
    ]);

    const products = client.products || [];

    const activeProductCount = products.filter(
      (product) => product.installationStatus !== "Inactive"
    ).length;

    const totalLicensedUsers = products.reduce(
      (total, product) => total + Number(product.licensedUsers || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        client: clientResponse(client),
        summary: {
          activeProductCount,
          openTicketCount,
          totalLicensedUsers,
          amcStatus: client.amcStatus,
          nextRenewal: client.nextRenewal,
        },
        products,
        tickets,
        activity,
 billingHistory:
  recentInvoices.map(
    formatClientAmcInvoice
  ),
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   REAL AI ASSISTANT (ZIA COPILOT)
   POST /api/client/ai/chat
   GET  /api/client/ai/status
========================================================= */

router.get("/ai/status", async (req, res) => {
  return res.json({
    success: true,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    provider: process.env.GEMINI_API_KEY ? "Google Gemini AI" : "CRM Live Intelligence",
  });
});

function buildCrmEngineReply(client, message, tickets, amcContracts, amcInvoices) {
  const q = (message || "").toLowerCase().trim();
  const openTickets = tickets.filter((t) => !["Resolved", "Closed"].includes(t.status));
  const resolvedTickets = tickets.filter((t) => ["Resolved", "Closed"].includes(t.status));
  const latestInvoice = amcInvoices[0] || null;
  const products = client.products || [];

  // 1. GREETINGS & INTRO
  if (/^(hi|hello|hey|greetings|morning|afternoon|evening|help|who are you|what can you do)/i.test(q)) {
    return {
      reply: `Hello **${client.contactPerson || "there"}**! 👋 I am **Zia**, your dedicated CRM Assistant for **${client.companyName}**.\n\nHere is your live account snapshot:\n- 📦 **Active Products**: ${products.length} software licenses registered\n- 🛡️ **AMC Status**: **${client.amcStatus || "Active"}** (Renewal: ${client.nextRenewal || "Not scheduled"})\n- 🎫 **Support Tickets**: **${openTickets.length} open** / ${resolvedTickets.length} resolved\n\nHow can I assist you today? You can ask me about:\n- 💳 **Billing & Invoices**: *"What is my pending balance?"*\n- 🎫 **Support Tickets**: *"Check status of open tickets"*\n- 📦 **Products**: *"What software licenses do we have?"*\n- 📞 **Support**: *"Contact support desk"*`,
      suggestedActions: [
        { label: "Check AMC & Billing", action: "billing" },
        { label: "View Support Tickets", action: "tickets" },
        { label: "Raise New Ticket", action: "raise_ticket" },
      ],
    };
  }

  // 2. BILLING, INVOICE, PAYMENT, BALANCE
  if (/(bill|invoice|payment|balance|due|pay|amount|charge|receipt|cost|money)/i.test(q)) {
    if (latestInvoice) {
      const balance = Number(latestInvoice.balanceAmount ?? latestInvoice.pendingAmount ?? 0);
      const isPaid = (latestInvoice.paymentStatus || latestInvoice.status) === "Paid" || balance === 0;
      return {
        reply: `### 💳 Billing & Invoice Overview for ${client.companyName}\n\n- **Latest Invoice**: \`${latestInvoice.invoiceCode || latestInvoice.invoiceNo || "N/A"}\`\n- **Invoice Date**: ${latestInvoice.invoiceDate ? new Date(latestInvoice.invoiceDate).toLocaleDateString("en-IN") : "N/A"}\n- **Total Amount**: ₹${Number(latestInvoice.totalAmount ?? latestInvoice.amount ?? 0).toLocaleString("en-IN")}\n- **Balance Due**: **₹${balance.toLocaleString("en-IN")}**\n- **Due Date**: ${latestInvoice.dueDate ? new Date(latestInvoice.dueDate).toLocaleDateString("en-IN") : "N/A"}\n- **Payment Status**: ${isPaid ? "✅ **Fully Paid**" : "⚠️ **Payment Pending**"}\n\n${
        isPaid
          ? "Your account is in good standing! You can download your official GST invoice from the **Bills & AMC** section."
          : "Please arrange payment before the due date to avoid any interruption to your software support services."
      }`,
        suggestedActions: [
          { label: "Open Billing & Invoices", action: "billing" },
          { label: "Download Current Bill", action: "download_bill" },
        ],
      };
    }

    return {
      reply: `### 💳 Billing Information\n\n- **Account Name**: ${client.companyName}\n- **AMC Status**: **${client.amcStatus || "Up to date"}**\n- **Upcoming Renewal**: ${client.nextRenewal || "No pending renewals"}\n\nNo pending invoice balances found on file. You can view past payment receipts and invoices in the **Bills & AMC** portal.`,
      suggestedActions: [{ label: "Open Billing", action: "billing" }],
    };
  }

  // 3. AMC, RENEWAL, CONTRACT, VALIDITY
  if (/(amc|renew|renewal|contract|validity|expiry|expire|coverage)/i.test(q)) {
    return {
      reply: `### 🛡️ Annual Maintenance Contract (AMC)\n\n- **Client**: ${client.companyName}\n- **Current AMC Status**: **${client.amcStatus || "Active"}**\n- **Next Renewal Date**: **${client.nextRenewal || "Active"}**\n- **Assigned Account Manager**: ${client.assignedEmployeeName || "Dedicated Support Desk"}\n\nYour AMC coverage guarantees priority helpdesk support, software version updates, and remote troubleshooting assistance.`,
      suggestedActions: [
        { label: "Review AMC Details", action: "billing" },
        { label: "Contact Support Desk", action: "contact_desk" },
      ],
    };
  }

  // 4. TICKETS, ISSUES, BUGS, SUPPORT REQUESTS
  if (/(ticket|issue|bug|problem|support|error|helpdesk|technician|engineer|glitch|down)/i.test(q)) {
    if (openTickets.length > 0) {
      const ticketList = openTickets
        .slice(0, 4)
        .map(
          (t) =>
            `- **\`${t.ticketCode}\`** — *${t.title}*\n  - Priority: **${t.priority}** | Status: **${t.status}**\n  - Assigned Engineer: **${t.assignedEmployeeName || "Support Team"}**`
        )
        .join("\n\n");

      return {
        reply: `### 🎫 Active Support Tickets (${openTickets.length} Open)\n\nHere are your current active tickets:\n\n${ticketList}\n\nOur engineers are actively working on resolving these requests. You can click on any ticket in the **Support Tickets** tab to review notes, send replies, or confirm resolution.`,
        suggestedActions: [
          { label: "View Support Tickets", action: "tickets" },
          { label: "Raise Another Ticket", action: "raise_ticket" },
        ],
      };
    }

    return {
      reply: `### 🎫 Support Tickets Status\n\nGreat news! You currently have **0 open support tickets** for **${client.companyName}**.\n\nAll previous support inquiries have been resolved. If you are experiencing any technical difficulty or have a new request, feel free to raise a new support ticket anytime.`,
      suggestedActions: [
        { label: "Raise New Ticket", action: "raise_ticket" },
        { label: "View Ticket History", action: "tickets" },
      ],
    };
  }

  // 5. PRODUCTS, SOFTWARE, LICENSES, VERSIONS
  if (/(product|software|license|licence|module|version|tally|erp)/i.test(q)) {
    if (products.length > 0) {
      const productList = products
        .map(
          (p) =>
            `- **${p.name}** (${p.version || "Current"})\n  - Status: **${p.installationStatus || "Active"}** | Users: **${p.licensedUsers || 1} seat(s)**`
        )
        .join("\n");

      return {
        reply: `### 📦 Registered Software Products for ${client.companyName}\n\n${productList}\n\nAll listed software licenses are under active support. If you need to add user licenses or request an upgrade, you can raise an issue or reach out to our team.`,
        suggestedActions: [
          { label: "View Products & Licences", action: "products" },
          { label: "Raise Product Issue", action: "raise_ticket" },
        ],
      };
    }

    return {
      reply: `### 📦 Software Licences\n\nYour account is set up with standard software support coverage. Visit the **My Products** tab to view your software configurations and module details.`,
      suggestedActions: [{ label: "View My Products", action: "products" }],
    };
  }

  // 6. CONTACT, SUPPORT DESK, PHONE, EMAIL
  if (/(contact|phone|call|email|reach|number|office|hours|desk)/i.test(q)) {
    return {
      reply: `### 📞 Technical Support & Billing Desk\n\n- **Support Hotline**: \`+91 98765 43210\`\n- **Support Email**: \`support@totalsolution.in\`\n- **Billing Department**: \`billing@totalsolution.in\`\n- **Working Hours**: Monday – Saturday, 9:30 AM – 6:30 PM IST\n- **Emergency Support**: Available 24/7 for Critical severity tickets\n\nOur team is ready to assist **${client.companyName}**.`,
      suggestedActions: [
        { label: "Raise Support Ticket", action: "raise_ticket" },
        { label: "View Agreements & Files", action: "documents" },
      ],
    };
  }

  // 7. DEFAULT / EXECUTIVE SUMMARY
  return {
    reply: `### 🏢 Account Summary for ${client.companyName}\n\n- **Primary Contact**: ${client.contactPerson || "Client"} (${client.mobile || client.email || "Registered"})\n- **AMC Contract**: **${client.amcStatus || "Active"}** (Renewal: ${client.nextRenewal || "Upcoming"})\n- **Registered Software**: ${products.length} product(s)\n- **Active Tickets**: **${openTickets.length} open** ticket(s)\n\nI can help you check invoices, track tickets, look up contract dates, or guide you through raising support tickets. What would you like to know?`,
    suggestedActions: [
      { label: "View Support Tickets", action: "tickets" },
      { label: "Check Bills & AMC", action: "billing" },
      { label: "My Products", action: "products" },
    ],
  };
}

router.post("/ai/chat", async (req, res, next) => {
  try {
    const clientResult = await findOwnClient(req);
    if (clientResult.error) {
      return res.status(clientResult.error.status).json({
        success: false,
        message: clientResult.error.message,
      });
    }

    const client = clientResult.client;
    const { message, history = [] } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message prompt is required.",
      });
    }

    // Load live CRM database records for grounding
    const [tickets, amcContracts, amcInvoices] = await Promise.all([
      SupportTicket.find({ clientId: client._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      AmcContract.find({ clientId: client._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AmcInvoice.find({ clientId: client._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();

    // If Gemini API Key is configured, attempt real LLM generation
    if (apiKey) {
      try {
        const crmContext = {
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          email: client.email,
          mobile: client.mobile,
          city: client.city,
          amcStatus: client.amcStatus,
          nextRenewal: client.nextRenewal,
          products: (client.products || []).map((p) => ({
            name: p.name,
            version: p.version,
            status: p.installationStatus,
            users: p.licensedUsers,
          })),
          openTickets: tickets
            .filter((t) => !["Resolved", "Closed"].includes(t.status))
            .map((t) => ({
              ticketCode: t.ticketCode,
              title: t.title,
              priority: t.priority,
              status: t.status,
              assignedEmployee: t.assignedEmployeeName,
            })),
          resolvedTicketsCount: tickets.filter((t) => ["Resolved", "Closed"].includes(t.status)).length,
          recentInvoices: amcInvoices.slice(0, 3).map((i) => ({
            code: i.invoiceCode || i.invoiceNo,
            total: i.totalAmount || i.amount,
            balance: i.balanceAmount ?? i.pendingAmount ?? 0,
            dueDate: i.dueDate,
            status: i.paymentStatus || i.status,
          })),
        };

        const systemInstruction = `You are Zia, the friendly, intelligent CRM AI Assistant for the Nexora Client Portal (provided by Total Solution).
You are assisting ${client.contactPerson || "the client"} from "${client.companyName}".
You have real-time live access to the client's CRM account data:
${JSON.stringify(crmContext, null, 2)}

Instructions:
1. Always be professional, concise, helpful, and empathetic.
2. Answer based on the provided live account data. Mention exact ticket codes (e.g. TKT-...), invoice numbers, dates, and amounts when relevant.
3. Use formatted GitHub Markdown (bullet points, bold keys, clean section headers).
4. If the user wants to take action (like view bills, raise ticket, see documents), inform them they can use the respective tabs in the portal or quick action buttons.
5. Keep answers focused and avoid overly long essays.`;

        // Format conversation history for Gemini API
        const contents = [];
        for (const item of history.slice(-6)) {
          if (item.role && item.content) {
            contents.push({
              role: item.role === "assistant" ? "model" : "user",
              parts: [{ text: item.content }],
            });
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: String(message).trim() }],
        });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await axios.post(
          geminiUrl,
          {
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
            },
          },
          { timeout: 12000 }
        );

        const replyText =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (replyText) {
          // Detect relevant suggested actions
          const suggestedActions = [];
          const lowerReply = (replyText + " " + message).toLowerCase();
          if (lowerReply.includes("bill") || lowerReply.includes("invoice") || lowerReply.includes("amc")) {
            suggestedActions.push({ label: "View Bills & AMC", action: "billing" });
          }
          if (lowerReply.includes("ticket") || lowerReply.includes("issue")) {
            suggestedActions.push({ label: "View Tickets", action: "tickets" });
            suggestedActions.push({ label: "Raise Ticket", action: "raise_ticket" });
          }
          if (lowerReply.includes("product") || lowerReply.includes("license")) {
            suggestedActions.push({ label: "My Products", action: "products" });
          }

          return res.json({
            success: true,
            reply: replyText,
            provider: "gemini",
            suggestedActions: suggestedActions.slice(0, 3),
          });
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to CRM Intelligence engine:", geminiError.message);
      }
    }

    // Intelligent CRM Grounded Fallback
    const fallbackResponse = buildCrmEngineReply(
      client,
      message,
      tickets,
      amcContracts,
      amcInvoices
    );

    return res.json({
      success: true,
      reply: fallbackResponse.reply,
      provider: "crm-engine",
      suggestedActions: fallbackResponse.suggestedActions || [],
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CLIENT NOTIFICATIONS & EVENT SYNC
========================================================= */

async function syncClientNotifications(clientId) {
  try {
    const [invoices, payments, tickets, contracts, amcRequests] = await Promise.all([
      AmcInvoice.find({ clientId, isDeleted: false }).lean(),
      AmcPayment.find({ clientId, isDeleted: false }).lean(),
      SupportTicket.find({ clientId, isDeleted: false }).lean(),
      AmcContract.find({ clientId, isDeleted: false }).lean(),
      ClientAmcRequest ? ClientAmcRequest.find({ clientId, isDeleted: false }).lean() : [],
    ]);

    const existing = await ClientNotification.find({ clientId }).select("dedupKey").lean();
    const existingSet = new Set(existing.map((n) => n.dedupKey).filter(Boolean));

    const toInsert = [];

    // 1. Invoices
    for (const inv of invoices) {
      const key = `inv_${inv._id}`;
      if (!existingSet.has(key)) {
        const amtStr = inv.totalAmount ? Number(inv.totalAmount).toLocaleString("en-IN") : "0";
        toInsert.push({
          clientId,
          type: "INVOICE_GENERATED",
          title: "Invoice Generated",
          message: `Invoice ${inv.invoiceCode || "AMC"} for ₹${amtStr} has been generated.`,
          entityType: "invoice",
          entityCode: inv.invoiceCode || "",
          entityId: inv._id,
          navigationTarget: "billing",
          dedupKey: key,
          createdAt: inv.createdAt || inv.invoiceDate || new Date(),
        });
        existingSet.add(key);
      }
    }

    // 2. Payments
    for (const pay of payments) {
      const key = `pay_${pay._id}`;
      if (!existingSet.has(key)) {
        const amtStr = pay.amount ? Number(pay.amount).toLocaleString("en-IN") : "0";
        toInsert.push({
          clientId,
          type: "PAYMENT_RECEIVED",
          title: "Payment Received",
          message: `Payment of ₹${amtStr} received against invoice ${pay.invoiceCode || "—"}. Receipt ${pay.paymentCode || ""}.`,
          entityType: "payment",
          entityCode: pay.paymentCode || "",
          entityId: pay._id,
          navigationTarget: "billing",
          dedupKey: key,
          createdAt: pay.createdAt || pay.paymentDate || new Date(),
        });
        existingSet.add(key);
      }
    }

    // 3. Support Tickets
    for (const tkt of tickets) {
      const createdKey = `tkt_created_${tkt._id}`;
      if (!existingSet.has(createdKey)) {
        toInsert.push({
          clientId,
          type: "TICKET_CREATED",
          title: "Support Ticket Raised",
          message: `Support ticket ${tkt.ticketCode} (${tkt.title}) has been registered.`,
          entityType: "ticket",
          entityCode: tkt.ticketCode || "",
          entityId: tkt._id,
          navigationTarget: "tickets",
          dedupKey: createdKey,
          createdAt: tkt.createdAt || new Date(),
        });
        existingSet.add(createdKey);
      }

      // Process ticket timeline transitions (supports repeated transitions like New -> In Progress -> Resolved -> Reopened -> In Progress)
      if (Array.isArray(tkt.timeline) && tkt.timeline.length > 0) {
        for (const entry of tkt.timeline) {
          if (!entry || !entry._id) continue;

          // Skip the creation timeline event since it's already covered by tkt_created_${tkt._id}
          const isCreationEntry =
            entry.type === "created" ||
            (entry.title && entry.title.toLowerCase() === "ticket created");
          if (isCreationEntry) continue;

          const entryType = (entry.type || "").toLowerCase();
          const entryTitle = (entry.title || "").toLowerCase();
          const entryDesc = (entry.description || "");

          const isResolved =
            entryType === "resolved" ||
            entryTitle.includes("resolved") ||
            entryDesc.toLowerCase().includes("status changed to resolved");

          const isClosed =
            entryType === "closed" ||
            entryTitle.includes("closed") ||
            entryDesc.toLowerCase().includes("status changed to closed");

          const isReopened =
            entryType === "reopened" ||
            entryTitle.includes("reopened");

          const isStatusChange =
            entryType === "status" ||
            entryTitle.includes("status") ||
            isReopened;

          const statusKey = `tkt_status_${tkt._id}_${entry._id}`;

          if (isResolved) {
            const legacyResolvedKey = `tkt_resolved_${tkt._id}`;
            if (!existingSet.has(statusKey) && !existingSet.has(legacyResolvedKey)) {
              toInsert.push({
                clientId,
                type: "TICKET_RESOLVED",
                title: "Support Ticket Resolved",
                message: `Support ticket ${tkt.ticketCode} has been marked as resolved.`,
                entityType: "ticket",
                entityCode: tkt.ticketCode || "",
                entityId: tkt._id,
                navigationTarget: "tickets",
                dedupKey: statusKey,
                createdAt: entry.createdAt || tkt.resolvedAt || new Date(),
              });
              existingSet.add(statusKey);
            }
          } else if (isClosed) {
            const legacyResolvedKey = `tkt_resolved_${tkt._id}`;
            if (!existingSet.has(statusKey) && !existingSet.has(legacyResolvedKey)) {
              toInsert.push({
                clientId,
                type: "TICKET_RESOLVED",
                title: "Support Ticket Closed",
                message: `Support ticket ${tkt.ticketCode} has been closed.`,
                entityType: "ticket",
                entityCode: tkt.ticketCode || "",
                entityId: tkt._id,
                navigationTarget: "tickets",
                dedupKey: statusKey,
                createdAt: entry.createdAt || tkt.closedAt || new Date(),
              });
              existingSet.add(statusKey);
            }
          } else if (isStatusChange) {
            if (!existingSet.has(statusKey)) {
              let statusName = "";
              if (isReopened) {
                statusName = "Reopened";
              } else {
                const match = entryDesc.match(/to\s+([A-Za-z\s]+)/i);
                if (match && match[1]) {
                  statusName = match[1].trim();
                } else if (entryTitle.includes("in progress")) {
                  statusName = "In Progress";
                }
              }

              const msg = statusName
                ? `Support ticket ${tkt.ticketCode} status updated to ${statusName}.`
                : `Support ticket ${tkt.ticketCode} status updated.`;

              toInsert.push({
                clientId,
                type: "TICKET_UPDATED",
                title: isReopened ? "Support Ticket Reopened" : "Support Ticket Updated",
                message: msg,
                entityType: "ticket",
                entityCode: tkt.ticketCode || "",
                entityId: tkt._id,
                navigationTarget: "tickets",
                dedupKey: statusKey,
                createdAt: entry.createdAt || tkt.updatedAt || new Date(),
              });
              existingSet.add(statusKey);
            }
          }
        }
      }

      // Safe fallback for legacy tickets without timeline status entries
      const hasTimelineStatus =
        Array.isArray(tkt.timeline) &&
        tkt.timeline.some((e) =>
          ["status", "resolved", "closed", "reopened"].includes((e.type || "").toLowerCase())
        );

      if (!hasTimelineStatus) {
        if (["Resolved", "Closed"].includes(tkt.status)) {
          const resolvedKey = `tkt_resolved_${tkt._id}`;
          if (!existingSet.has(resolvedKey)) {
            toInsert.push({
              clientId,
              type: "TICKET_RESOLVED",
              title: "Support Ticket Resolved",
              message: `Support ticket ${tkt.ticketCode} has been marked as ${tkt.status.toLowerCase()}.`,
              entityType: "ticket",
              entityCode: tkt.ticketCode || "",
              entityId: tkt._id,
              navigationTarget: "tickets",
              dedupKey: resolvedKey,
              createdAt: tkt.resolvedAt || tkt.updatedAt || new Date(),
            });
            existingSet.add(resolvedKey);
          }
        } else if (tkt.status && !["Open", "New"].includes(tkt.status)) {
          const updateKey = `tkt_status_${tkt._id}_${tkt.status}`;
          if (!existingSet.has(updateKey)) {
            toInsert.push({
              clientId,
              type: "TICKET_UPDATED",
              title: "Support Ticket Updated",
              message: `Support ticket ${tkt.ticketCode} status updated to ${tkt.status}.`,
              entityType: "ticket",
              entityCode: tkt.ticketCode || "",
              entityId: tkt._id,
              navigationTarget: "tickets",
              dedupKey: updateKey,
              createdAt: tkt.updatedAt || new Date(),
            });
            existingSet.add(updateKey);
          }
        }
      }
    }

    // 4. AMC Contracts & Documents
    const now = new Date();
    for (const ctr of contracts) {
      if (ctr.expiryDate) {
        const expDate = new Date(ctr.expiryDate);
        const diffMs = expDate - now;
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (days > 0 && days <= 30) {
          const expDateIso = expDate.toISOString().slice(0, 10);
          const expKey = `amc_exp_${ctr._id}_${expDateIso}_30d`;
          const legacyMonthKey = `${expDate.getFullYear()}_${expDate.getMonth() + 1}`;
          const legacyExpKey = `amc_exp_${ctr._id}_${legacyMonthKey}`;

          if (!existingSet.has(expKey) && !existingSet.has(legacyExpKey)) {
            toInsert.push({
              clientId,
              type: "AMC_EXPIRING",
              title: "AMC Expiring Soon",
              message: `Your ${ctr.productName || "AMC Support"} contract expires in ${days} days.`,
              entityType: "amc",
              entityCode: ctr.contractCode || "",
              entityId: ctr._id,
              navigationTarget: "billing",
              dedupKey: expKey,
              createdAt: new Date(),
            });
            existingSet.add(expKey);
          }
        }
      }

      if (ctr.renewalStatus === "Renewed") {
        const renKey = `amc_renewed_${ctr._id}`;
        if (!existingSet.has(renKey)) {
          toInsert.push({
            clientId,
            type: "AMC_RENEWED",
            title: "AMC Contract Renewed",
            message: `Your ${ctr.productName || "AMC Support"} contract has been renewed successfully.`,
            entityType: "amc",
            entityCode: ctr.contractCode || "",
            entityId: ctr._id,
            navigationTarget: "billing",
            dedupKey: renKey,
            createdAt: ctr.updatedAt || ctr.createdAt || new Date(),
          });
          existingSet.add(renKey);
        }
      }

      // Shared Documents
      if (Array.isArray(ctr.documents)) {
        for (const doc of ctr.documents) {
          if (!doc.isDeleted && doc.status !== "Archived") {
            const docKey = `doc_${doc._id}`;
            if (!existingSet.has(docKey)) {
              toInsert.push({
                clientId,
                type: "DOCUMENT_SHARED",
                title: "New Document Shared",
                message: `A new document (${doc.documentType || "Agreement"}) has been shared with you.`,
                entityType: "document",
                entityCode: doc.fileName || "",
                entityId: doc._id,
                navigationTarget: "documents",
                dedupKey: docKey,
                createdAt: doc.uploadedAt || ctr.createdAt || new Date(),
              });
              existingSet.add(docKey);
            }
          }
        }
      }
    }

    // 5. AMC Renewal & Quotation Requests
    if (Array.isArray(amcRequests)) {
      for (const req of amcRequests) {
        // Submission notification
        const subKey = `amc_req_sub_${req._id}`;
        if (!existingSet.has(subKey)) {
          toInsert.push({
            clientId,
            type: "AMC_REQUEST_SUBMITTED",
            title: `${req.requestType} Submitted`,
            message: `Your ${req.requestType} request (${req.requestCode}) for ${req.productName} has been submitted for review.`,
            entityType: "amc",
            entityCode: req.requestCode || "",
            entityId: req.contractId || req._id,
            navigationTarget: "billing",
            dedupKey: subKey,
            createdAt: req.createdAt || new Date(),
          });
          existingSet.add(subKey);
        }

        // Quotation ready notification
        if (req.status === "Quotation Ready") {
          const quoteKey = `amc_req_quote_${req._id}`;
          if (!existingSet.has(quoteKey)) {
            toInsert.push({
              clientId,
              type: "AMC_QUOTATION_READY",
              title: "Quotation Ready",
              message: `Quotation for ${req.requestCode} (${req.productName}) is ready for your review.`,
              entityType: "amc",
              entityCode: req.requestCode || "",
              entityId: req.contractId || req._id,
              navigationTarget: "billing",
              dedupKey: quoteKey,
              createdAt: req.updatedAt || new Date(),
            });
            existingSet.add(quoteKey);
          }
        }

        // Completed notification
        if (req.status === "Completed") {
          const compKey = `amc_req_comp_${req._id}`;
          if (!existingSet.has(compKey)) {
            toInsert.push({
              clientId,
              type: "AMC_REQUEST_UPDATED",
              title: "AMC Request Processed",
              message: `Your ${req.requestType} request (${req.requestCode}) has been processed.`,
              entityType: "amc",
              entityCode: req.requestCode || "",
              entityId: req.contractId || req._id,
              navigationTarget: "billing",
              dedupKey: compKey,
              createdAt: req.updatedAt || new Date(),
            });
            existingSet.add(compKey);
          }
        }
      }
    }

    if (toInsert.length > 0) {
      await ClientNotification.insertMany(toInsert, { ordered: false }).catch(() => {
        // Ignore duplicate key conflicts gracefully
      });
    }
  } catch (err) {
    console.error("Error in syncClientNotifications:", err.message);
  }
}

function formatClientNotification(n) {
  if (!n) return null;
  return {
    id: String(n._id),
    _id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message,
    entityType: n.entityType || "other",
    entityCode: n.entityCode || "",
    entityId: n.entityId ? String(n.entityId) : null,
    navigationTarget: n.navigationTarget || "overview",
    isRead: Boolean(n.isRead),
    readAt: n.readAt || null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

/* =========================================================
   CLIENT NOTIFICATIONS ENDPOINTS
   GET /api/client/notifications
   PATCH /api/client/notifications/:id/read
   PATCH /api/client/notifications/read-all
========================================================= */

router.get("/notifications", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    // Idempotent background sync
    await syncClientNotifications(client._id);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = String(req.query.filter || "all").toLowerCase();

    const query = { clientId: client._id };
    if (filter === "unread") {
      query.isRead = false;
    } else if (filter === "billing") {
      query.entityType = { $in: ["invoice", "payment"] };
    } else if (filter === "tickets") {
      query.entityType = "ticket";
    } else if (filter === "amc" || filter === "contracts") {
      query.entityType = "amc";
    } else if (filter === "documents") {
      query.entityType = "document";
    }

    const [total, unreadCount, notifs] = await Promise.all([
      ClientNotification.countDocuments(query),
      ClientNotification.countDocuments({ clientId: client._id, isRead: false }),
      ClientNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return res.json({
      success: true,
      notifications: notifs.map(formatClientNotification),
      unreadCount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id/read", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const notification = await ClientNotification.findOneAndUpdate(
      { _id: id, clientId: client._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    const unreadCount = await ClientNotification.countDocuments({ clientId: client._id, isRead: false });

    return res.json({
      success: true,
      notification: formatClientNotification(notification),
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/read-all", async (req, res, next) => {
  try {
    const { client, error } = await findOwnClient(req);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    await ClientNotification.updateMany(
      { clientId: client._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

