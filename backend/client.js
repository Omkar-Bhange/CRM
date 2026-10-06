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

const authenticateUser = require("./authMiddleware");

const Client = mongoose.model("Client");
const SupportTicket = mongoose.models.SupportTicket;
const ActivityLog = mongoose.models.ActivityLog;
const AmcContract = mongoose.models.AmcContract;
const AmcInvoice = mongoose.models.AmcInvoice;
const AmcPayment = mongoose.models.AmcPayment;

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

  return {
    ...data,
    attachments: (data.attachments || []).map((file) =>
      formatAttachment(file, req)
    ),
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

    name:
      document.fileName ||
      "Document",

    fileName:
      document.fileName ||
      "Document",

    documentType:
      document.documentType ||
      "Other Document",

    type:
      document.documentType ||
      "Other Document",

    category:
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
      "Admin",

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

  return {
    id: String(data._id || data.id || ""),
    paymentCode: data.paymentCode || "",
    invoiceId: String(data.amcInvoiceId || ""),
    contractId: String(data.amcContractId || ""),
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

const ticket =
  await SupportTicket.create({
      ticketCode,
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
      priority: priority || "Medium",
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

module.exports = router;
