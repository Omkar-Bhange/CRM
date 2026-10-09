/**
 * NEXORA CRM — Standalone AMC Upcoming Renewal Recovery Script
 * 
 * Purpose:
 * In the event of a code rollback to a legacy version without the integrated
 * cron scheduler, this standalone utility can be executed manually or via OS cron
 * to transition pending `upcomingRenewal` records whose coverage start date has arrived.
 * 
 * Usage:
 *   node backend/scripts/recover_upcoming_renewals.js
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ClientConnectTrack";

async function runUpcomingRenewalRecovery() {
  console.log("================================================================================");
  console.log("   NEXORA CRM: STANDALONE AMC UPCOMING RENEWAL RECOVERY SCRIPT                  ");
  console.log("================================================================================");
  console.log(`Connecting to database...`);

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  const AmcContract = mongoose.models.AmcContract || mongoose.model("AmcContract", new mongoose.Schema({}, { strict: false }));
  const AmcInvoice = mongoose.models.AmcInvoice || mongoose.model("AmcInvoice", new mongoose.Schema({}, { strict: false }));
  const Client = mongoose.models.Client || mongoose.model("Client", new mongoose.Schema({}, { strict: false }));

  const now = new Date();
  const dueContracts = await AmcContract.find({
    isDeleted: false,
    "upcomingRenewal.startDate": { $lte: now },
    "upcomingRenewal.invoiceId": { $ne: null },
  });

  console.log(`Found ${dueContracts.length} contract(s) due for scheduled activation.`);

  if (dueContracts.length === 0) {
    console.log("Zero contracts pending activation. Exiting cleanly.");
    await mongoose.disconnect();
    return { activatedCount: 0 };
  }

  let activatedCount = 0;

  for (const contract of dueContracts) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const freshContract = await AmcContract.findById(contract._id).session(session);
        if (
          !freshContract ||
          !freshContract.upcomingRenewal?.startDate ||
          new Date(freshContract.upcomingRenewal.startDate) > now
        ) {
          return;
        }

        const upcoming = freshContract.upcomingRenewal;

        // 1. Archive previous active cycle into renewalHistory
        freshContract.renewalHistory = freshContract.renewalHistory || [];
        freshContract.renewalHistory.push({
          cycleNumber: (freshContract.renewalHistory?.length || 0) + 1,
          previousInvoiceId: freshContract.currentInvoiceId || null,
          previousInvoiceCode: freshContract.currentInvoiceCode || freshContract.invoiceCode || "",
          startDate: freshContract.startDate,
          expiryDate: freshContract.expiryDate,
          dueDate: freshContract.dueDate,
          plan: freshContract.plan,
          licensedUsers: freshContract.licensedUsers,
          taxableAmount: freshContract.taxableAmount,
          cgstRate: freshContract.cgstRate,
          cgstAmount: freshContract.cgstAmount,
          sgstRate: freshContract.sgstRate,
          sgstAmount: freshContract.sgstAmount,
          igstRate: freshContract.igstRate,
          igstAmount: freshContract.igstAmount,
          totalTaxAmount: freshContract.totalTaxAmount,
          totalAmount: freshContract.totalAmount,
          paidAmount: freshContract.paidAmount,
          pendingAmount: freshContract.pendingAmount,
          status: freshContract.status,
          gstApplicable: freshContract.gstApplicable || "YES",
          taxType: freshContract.taxType || "intra",
          taxClassification: freshContract.taxClassification || "Standard Rate (18%)",
          notes: freshContract.notes,
          archivedAt: now,
          archivedBy: null,
          archivedByName: "Standalone Recovery Worker",
        });

        // 2. Transition active cycle to the upcoming renewal
        freshContract.startDate = upcoming.startDate;
        freshContract.expiryDate = upcoming.expiryDate;
        freshContract.dueDate = upcoming.dueDate;
        freshContract.plan = upcoming.plan;
        freshContract.licensedUsers = upcoming.licensedUsers;
        freshContract.taxableAmount = upcoming.taxableAmount;
        freshContract.cgstRate = upcoming.cgstRate;
        freshContract.cgstAmount = upcoming.cgstAmount;
        freshContract.sgstRate = upcoming.sgstRate;
        freshContract.sgstAmount = upcoming.sgstAmount;
        freshContract.igstRate = upcoming.igstRate;
        freshContract.igstAmount = upcoming.igstAmount;
        freshContract.totalTaxAmount = upcoming.totalTaxAmount;
        freshContract.totalAmount = upcoming.totalAmount;
        freshContract.gstApplicable = upcoming.gstApplicable;
        freshContract.taxType = upcoming.taxType;
        freshContract.taxClassification = upcoming.taxClassification;
        freshContract.currentInvoiceId = upcoming.invoiceId;
        freshContract.currentInvoiceCode = upcoming.invoiceCode;
        freshContract.invoiceCode = upcoming.invoiceCode;
        freshContract.invoiceDate = upcoming.createdAt || now;

        const linkedInvoice = await AmcInvoice.findById(upcoming.invoiceId).session(session);
        freshContract.paidAmount = linkedInvoice?.paidAmount || 0;
        freshContract.pendingAmount = linkedInvoice?.pendingAmount || upcoming.totalAmount;
        freshContract.status = linkedInvoice?.paymentStatus === "Paid" ? "Paid" : "Pending";

        // 3. Clear upcomingRenewal
        freshContract.upcomingRenewal = {
          invoiceId: null,
          invoiceCode: "",
          startDate: null,
          expiryDate: null,
          dueDate: null,
          plan: "Standard",
          licensedUsers: 1,
          taxableAmount: 0,
          cgstRate: 0,
          cgstAmount: 0,
          sgstRate: 0,
          sgstAmount: 0,
          igstRate: 0,
          igstAmount: 0,
          totalTaxAmount: 0,
          totalAmount: 0,
          gstApplicable: "YES",
          taxType: "intra",
          taxClassification: "Standard Rate (18%)",
          paymentStatus: "Pending",
          notes: "",
          createdAt: null,
        };

        // 4. Update Client Product Status
        const client = await Client.findById(freshContract.clientId).session(session);
        if (client) {
          const clientProd = client.products?.id ? client.products.id(freshContract.clientProductId) : null;
          if (clientProd) {
            clientProd.expiryDate = new Date(freshContract.expiryDate).toISOString().slice(0, 10);
            clientProd.amcStatus = freshContract.status;
          }
          client.nextRenewal = new Date(freshContract.expiryDate).toISOString().slice(0, 10);
          client.amcStatus = freshContract.status;
          await client.save({ session });
        }

        freshContract.timeline = freshContract.timeline || [];
        freshContract.timeline.push({
          type: "renewal",
          title: "Scheduled AMC Renewal Activated via Recovery Script",
          description: `Upcoming AMC cycle for ${new Date(freshContract.startDate).toISOString().slice(0, 10)} to ${new Date(freshContract.expiryDate).toISOString().slice(0, 10)} transitioned cleanly.`,
          performedByName: "Standalone Recovery Worker",
        });

        await freshContract.save({ session });
        activatedCount++;
        console.log(`  ✅ Activated contract ${contract.contractCode} (Invoice: ${upcoming.invoiceCode})`);
      });
    } catch (err) {
      console.error(`  ❌ Failed activating contract ${contract.contractCode}:`, err.message);
    } finally {
      await session.endSession();
    }
  }

  console.log(`\nRecovery complete: ${activatedCount} contract(s) activated successfully.`);
  await mongoose.disconnect();
  return { activatedCount };
}

if (require.main === module) {
  runUpcomingRenewalRecovery()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal recovery error:", err);
      process.exit(1);
    });
}

module.exports = { runUpcomingRenewalRecovery };

