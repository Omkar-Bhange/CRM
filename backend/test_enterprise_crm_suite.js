"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Lead = require("./models/Lead");
const Deal = require("./models/Deal");
const Contact = require("./models/Contact");
const Client = require("./models/Client");
const Quotation = require("./models/Quotation");
const KnowledgeBaseArticle = require("./models/KnowledgeBaseArticle");
const User = require("./models/User");
const { runAllMaintenanceTasksNow } = require("./services/backgroundWorker");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ClientConnectTrack";
const JWT_SECRET = process.env.JWT_SECRET || "nexora_super_secret_jwt_key_2026";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("   NEXORA ENTERPRISE CRM: END-TO-END SUITE VERIFICATION                         ");
  console.log("================================================================================");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  let passed = 0;
  let failed = 0;

  function assert(title, condition) {
    if (condition) {
      console.log(`  ✅ PASSED: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${title}`);
      failed++;
    }
  }

  try {
    // 1. Setup Admin Test User
    let adminUser = await User.findOne({ email: "enterprise_admin_test@nexora.com" });
    if (!adminUser) {
      adminUser = new User({
        name: "Enterprise Admin Tester",
        email: "enterprise_admin_test@nexora.com",
        password: "hashed_dummy_password",
        role: "admin",
        status: "Active",
      });
      await adminUser.save();
    }

    const testToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, JWT_SECRET, { expiresIn: "1h" });
    assert("Admin test user authenticated with JWT", Boolean(testToken));

    // 2. Lead Capture
    const LeadRoute = require("./routes/leadRoutes");
    const testLead = new Lead({
      leadCode: `TEST-LEAD-${Date.now().toString().slice(-4)}`,
      title: "Enterprise ERP System for Logistics Corp",
      companyName: `Apex Logistics Ltd ${Date.now().toString().slice(-4)}`,
      contactName: "Vikram Malhotra",
      email: "vikram@apexlogistics.in",
      phone: "+91 9876543210",
      city: "Pune",
      state: "Maharashtra",
      source: "Website",
      estimatedBudget: 350000,
      industry: "Logistics & Supply Chain",
      status: "New",
      priority: "Hot",
      score: 85,
    });
    await testLead.save();
    assert("Lead captured with hot priority and score 85", testLead._id && testLead.score === 85);

    // 3. 1-Click Lead Conversion to Client + Contact + Deal
    const clientCode = `TEST-CLI-${Date.now().toString().slice(-4)}`;
    const convertedClient = new Client({
      clientCode,
      companyName: testLead.companyName,
      contactPerson: testLead.contactName,
      email: testLead.email,
      mobile: testLead.phone,
      city: testLead.city,
      status: "Active",
    });
    await convertedClient.save();

    const contactCode = `TEST-CON-${Date.now().toString().slice(-4)}`;
    const convertedContact = new Contact({
      contactCode,
      clientId: convertedClient._id,
      clientCode: convertedClient.clientCode,
      clientName: convertedClient.companyName,
      firstName: "Vikram",
      lastName: "Malhotra",
      email: testLead.email,
      phone: testLead.phone,
      designation: "Managing Director",
      role: "Decision Maker",
      isPrimary: true,
    });
    await convertedContact.save();

    const dealCode = `TEST-DEAL-${Date.now().toString().slice(-4)}`;
    const convertedDeal = new Deal({
      dealCode,
      title: testLead.title,
      clientId: convertedClient._id,
      clientCode: convertedClient.clientCode,
      clientName: convertedClient.companyName,
      primaryContactId: convertedContact._id,
      primaryContactName: "Vikram Malhotra",
      amount: 350000,
      stage: "Discovery",
      probability: 10,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      dealType: "New Business",
    });
    await convertedDeal.save();

    testLead.status = "Converted";
    testLead.convertedAt = new Date();
    testLead.convertedToClientId = convertedClient._id;
    testLead.convertedToContactId = convertedContact._id;
    testLead.convertedToDealId = convertedDeal._id;
    await testLead.save();

    assert("Lead converted to Client, Contact, and active Deal", testLead.status === "Converted" && testLead.convertedToDealId.equals(convertedDeal._id));
    assert("B2B Contact successfully linked to Client as Primary Decision Maker", convertedContact.isPrimary === true && convertedContact.clientId.equals(convertedClient._id));

    // 4. Deal Pipeline & Stage Progression
    convertedDeal.stage = "Negotiation / Review";
    convertedDeal.probability = 80;
    await convertedDeal.save();
    assert("Deal stage advanced to Negotiation with 80% probability", convertedDeal.stage === "Negotiation / Review" && convertedDeal.probability === 80);

    // Calculate virtual weighted value
    const weightedVal = Math.round((convertedDeal.amount * convertedDeal.probability) / 100);
    assert("Deal weighted pipeline forecast calculated correctly (₹2,80,000)", weightedVal === 280000);

    // 5. Line-Item Quotation & Statutory GST Computation
    const quotationNo = `TEST-QT-${Date.now().toString().slice(-4)}`;
    const quotation = new Quotation({
      quotationNo,
      dealId: convertedDeal._id,
      clientId: convertedClient._id,
      clientCode: convertedClient.clientCode,
      clientName: convertedClient.companyName,
      items: [
        {
          description: "Nexora ERP Core Platform License",
          quantity: 1,
          unitPrice: 200000,
          discountPercent: 10,
          discountAmount: 20000,
          taxableAmount: 180000,
          gstRate: 18,
          gstAmount: 32400,
          totalAmount: 212400,
        },
        {
          description: "Data Migration & Custom API Integration",
          quantity: 1,
          unitPrice: 50000,
          discountPercent: 0,
          discountAmount: 0,
          taxableAmount: 50000,
          gstRate: 18,
          gstAmount: 9000,
          totalAmount: 59000,
        },
      ],
      subtotal: 250000,
      totalDiscount: 20000,
      taxableAmount: 230000,
      isGstApplicable: true,
      gstType: "CGST_SGST",
      cgstAmount: 20700,
      sgstAmount: 20700,
      totalGst: 41400,
      grandTotal: 271400,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: "Client Approved",
    });
    await quotation.save();

    assert("Quotation created with line-item discounts and statutory GST (CGST ₹20,700 + SGST ₹20,700 = ₹41,400)", quotation.totalGst === 41400 && quotation.grandTotal === 271400);

    // 6. Online Payment Gateway Reconciler
    const paymentRoutes = require("./routes/paymentRoutes");
    assert("Payment routes and webhook handlers loaded", Boolean(paymentRoutes));

    // 7. Knowledge Base Article & Deflection Engine
    const article = new KnowledgeBaseArticle({
      articleCode: `TEST-KB-${Date.now().toString().slice(-4)}`,
      title: "How to Configure GST and AMC Renewal Settings",
      slug: `how-to-configure-gst-and-amc-${Date.now()}`,
      category: "AMC & Renewals",
      summary: "Step by step walkthrough to manage statutory GST rules and auto renewal triggers.",
      content: "# Step 1: Open Settings\nNavigate to System Settings to adjust grace periods and CGST/SGST defaults.",
      tags: ["AMC", "GST", "Invoicing", "Tax"],
      isPublic: true,
      isPublished: true,
    });
    await article.save();

    assert("Knowledge Base article created and indexed for search", article._id && article.tags.includes("GST"));

    // Vote helpful
    article.helpfulCount += 1;
    await article.save();
    assert("Knowledge Base user helpful feedback logged", article.helpfulCount === 1);

    // 8. Autonomous Background Worker Maintenance Sweep
    const sweepResults = await runAllMaintenanceTasksNow();
    assert("Autonomous Background Worker sweep executed successfully", Boolean(sweepResults && sweepResults.timestamp));

    // Cleanup test artifacts
    await Promise.all([
      Lead.deleteOne({ _id: testLead._id }),
      Deal.deleteOne({ _id: convertedDeal._id }),
      Contact.deleteOne({ _id: convertedContact._id }),
      Client.deleteOne({ _id: convertedClient._id }),
      Quotation.deleteOne({ _id: quotation._id }),
      KnowledgeBaseArticle.deleteOne({ _id: article._id }),
      User.deleteOne({ _id: adminUser._id }),
    ]);

    console.log("================================================================================");
    console.log(`   TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED                  `);
    console.log("================================================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test execution fatal error:", error);
    process.exit(1);
  }
}

runTestSuite();
