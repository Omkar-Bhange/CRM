const path = require("path");
const mongoose = require(path.resolve("backend/node_modules/mongoose"));
require(path.resolve("backend/node_modules/dotenv")).config({ path: "backend/.env" });
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

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
clientNotificationSchema.index({ clientId: 1, dedupKey: 1 });

const ClientNotification =
  mongoose.models.ClientNotification ||
  mongoose.model("ClientNotification", clientNotificationSchema);

async function syncNotifications(clientId) {
  require(path.resolve("backend/admin"));
  const AmcInvoice = mongoose.models.AmcInvoice;
  const AmcPayment = mongoose.models.AmcPayment;
  const SupportTicket = mongoose.models.SupportTicket;
  const AmcContract = mongoose.models.AmcContract;

  const [invoices, payments, tickets, contracts] = await Promise.all([
    AmcInvoice.find({ clientId, isDeleted: false }).lean(),
    AmcPayment.find({ clientId, isDeleted: false }).lean(),
    SupportTicket.find({ clientId, isDeleted: false }).lean(),
    AmcContract.find({ clientId, isDeleted: false }).lean(),
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

  // 3. Tickets
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

    if (["Resolved", "Closed"].includes(tkt.status)) {
      const resolvedKey = `tkt_resolved_${tkt._id}`;
      if (!existingSet.has(resolvedKey)) {
        toInsert.push({
          clientId,
          type: "TICKET_RESOLVED",
          title: "Support Ticket Resolved",
          message: `Support ticket ${tkt.ticketCode} has been resolved.`,
          entityType: "ticket",
          entityCode: tkt.ticketCode || "",
          entityId: tkt._id,
          navigationTarget: "tickets",
          dedupKey: resolvedKey,
          createdAt: tkt.resolvedAt || tkt.updatedAt || new Date(),
        });
        existingSet.add(resolvedKey);
      }
    }
  }

  // 4. AMC Contracts (Expiring / Renewed / Documents)
  const now = new Date();
  for (const ctr of contracts) {
    if (ctr.expiryDate) {
      const expDate = new Date(ctr.expiryDate);
      const diffMs = expDate - now;
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (days > 0 && days <= 30) {
        const monthKey = `${expDate.getFullYear()}_${expDate.getMonth() + 1}`;
        const expKey = `amc_exp_${ctr._id}_${monthKey}`;
        if (!existingSet.has(expKey)) {
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

    // Documents
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

  if (toInsert.length > 0) {
    await ClientNotification.insertMany(toInsert);
    console.log(`Inserted ${toInsert.length} notifications for client.`);
  } else {
    console.log("No new notifications needed syncing.");
  }
}

mongoose.connect(uri).then(async () => {
  const cId = new mongoose.Types.ObjectId("6a5dd25afb7cfeea6a1befc6");
  await syncNotifications(cId);

  const notifications = await ClientNotification.find({ clientId: cId }).sort({ createdAt: -1 });
  console.log(`Total notifications in DB for DABAR: ${notifications.length}`);
  notifications.slice(0, 5).forEach((n) => {
    console.log(`- [${n.type}] ${n.title}: "${n.message}" (${n.isRead ? "Read" : "Unread"})`);
  });
  process.exit(0);
});
