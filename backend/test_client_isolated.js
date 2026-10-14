"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_client_${Date.now()}`;

async function runClientIsolatedTests() {
  console.log("=== ISOLATED CLIENT MODEL TEST SUITE ===");
  console.log("Connecting to isolated local test database:", TEST_DB_URI);

  const conn = await mongoose.connect(TEST_DB_URI);
  console.log("Connected to isolated test database successfully.\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // Pre-register referenced models for population tests if not already registered
  const User =
    mongoose.models.User ||
    mongoose.model(
      "User",
      new mongoose.Schema({
        name: { type: String, default: "Test User" },
        email: { type: String, default: "test@example.com" },
        role: { type: String, default: "admin" },
      })
    );

  const Employee =
    mongoose.models.Employee ||
    mongoose.model(
      "Employee",
      new mongoose.Schema({
        name: { type: String, default: "Test Employee" },
        employeeCode: { type: String, default: "EMP001" },
      })
    );

  const Product =
    mongoose.models.Product ||
    require("./models/Product");

  const Client = require("./models/Client");

  try {
    // ── GROUP 1: Identity & Collection ──────────────────────────────────────
    console.log("--- TEST GROUP 1: Model & Collection Identity ---");
    assert(Client.modelName === "Client", "1. Model name is 'Client'");
    assert(Client.collection.name === "clients", "2. Target collection is 'clients'");

    // ── GROUP 2: Creation & Defaults ────────────────────────────────────────
    console.log("\n--- TEST GROUP 2: Client Creation & Defaults ---");
    const testUser = await User.create({ name: "Admin Creator", email: "creator@example.com" });
    const testEmployee = await Employee.create({ name: "Assigned Dev", employeeCode: "DEV100" });
    const testProduct = await Product.create({
      productName: "Nexora CRM ERP",
      productCode: "NEX-ERP",
      category: "Software",
    });

    const client1 = await Client.create({
      clientCode: "CLI-001",
      companyName: "Acme Corporation",
      contactPerson: "John Doe",
      email: "john@acme.com",
      mobile: "+91-9876543210",
      city: "Mumbai",
      createdBy: testUser._id,
      assignedEmployeeId: testEmployee._id,
      assignedEmployeeCode: testEmployee.employeeCode,
      assignedEmployeeName: testEmployee.name,
      products: [
        {
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          version: "v2.5.0",
          licensedUsers: 10,
          supportType: "Premium",
          licenceType: "Annual Licence",
          amcStatus: "Pending",
          installationStatus: "Installed",
        },
      ],
    });

    assert(client1._id !== undefined, "3. Client record created successfully");
    assert(client1.clientCode === "CLI-001", "4. clientCode stored in uppercase");
    assert(client1.country === "India", "5. Default country is 'India'");
    assert(client1.status === "Active", "6. Default status is 'Active'");
    assert(client1.amcStatus === "Not Started", "7. Default client amcStatus is 'Not Started'");
    assert(client1.openTickets === 0, "8. Default openTickets is 0");
    assert(client1.loginEnabled === true, "9. Default loginEnabled is true");
    assert(client1.isDeleted === false, "10. Default isDeleted is false");
    assert(client1.products.length === 1, "11. products array persisted subdocument");
    assert(client1.products[0]._id !== undefined, "12. Subdocument has auto-generated _id");
    assert(client1.products[0].createdAt !== undefined, "13. Subdocument has timestamps (createdAt)");

    // ── GROUP 3: Unique Index Enforcement ───────────────────────────────────
    console.log("\n--- TEST GROUP 3: Uniqueness & Validation ---");
    // Ensure indexes are built on test DB
    await Client.init();

    let duplicateFailed = false;
    try {
      await Client.create({
        clientCode: "CLI-001", // Duplicate code
        companyName: "Duplicate Acme Corp",
      });
    } catch (err) {
      duplicateFailed = true;
      assert(err.code === 11000, "14. Duplicate clientCode rejected by MongoDB unique index (E11000)");
    }
    assert(duplicateFailed, "15. Duplicate clientCode creation threw expected error");

    // Required fields check
    let requiredFailed = false;
    try {
      await Client.create({
        // missing clientCode & companyName
        contactPerson: "Nobody",
      });
    } catch (err) {
      requiredFailed = true;
      assert(err.name === "ValidationError", "16. Missing required fields triggers ValidationError");
      assert(err.errors.clientCode !== undefined, "17. clientCode is marked required in ValidationError");
      assert(err.errors.companyName !== undefined, "18. companyName is marked required in ValidationError");
    }
    assert(requiredFailed, "19. Missing required fields threw ValidationError");

    // ── GROUP 4: Retrieval & Population ─────────────────────────────────────
    console.log("\n--- TEST GROUP 4: Retrieval & Population ---");
    const foundByCode = await Client.findOne({ clientCode: "CLI-001" })
      .populate("createdBy", "name email")
      .populate("assignedEmployeeId", "name employeeCode")
      .populate("products.productId", "productName category");

    assert(foundByCode !== null, "20. Client retrieved by clientCode");
    assert(foundByCode.createdBy && foundByCode.createdBy.name === "Admin Creator", "21. populated createdBy User");
    assert(foundByCode.assignedEmployeeId && foundByCode.assignedEmployeeId.name === "Assigned Dev", "22. populated assignedEmployeeId Employee");
    assert(foundByCode.products[0].productId && foundByCode.products[0].productId.productName === "Nexora CRM ERP", "23. populated products.productId Product");

    // ── GROUP 5: Update & Mutations ─────────────────────────────────────────
    console.log("\n--- TEST GROUP 5: Update & Mutations ---");
    await Client.updateOne(
      { _id: client1._id },
      {
        $set: {
          gstNo: "27AAAAA0000A1Z5",
          panNo: "ABCDE1234F",
          city: "Pune",
          status: "Inactive",
          amcStatus: "Paid",
        },
      }
    );

    const updatedClient = await Client.findById(client1._id);
    assert(updatedClient.gstNo === "27AAAAA0000A1Z5", "24. gstNo updated");
    assert(updatedClient.panNo === "ABCDE1234F", "25. panNo updated");
    assert(updatedClient.city === "Pune", "26. city updated");
    assert(updatedClient.status === "Inactive", "27. status updated to 'Inactive'");
    assert(updatedClient.amcStatus === "Paid", "28. amcStatus updated to 'Paid'");

    // ── GROUP 6: Soft Delete Behavior ───────────────────────────────────────
    console.log("\n--- TEST GROUP 6: Soft Delete Semantics ---");
    const delDate = new Date();
    await Client.updateOne(
      { _id: client1._id },
      {
        $set: {
          isDeleted: true,
          deletedAt: delDate,
          deletedBy: testUser._id,
          deletedByName: testUser.name,
        },
      }
    );

    const activeClients = await Client.find({ isDeleted: false });
    assert(activeClients.length === 0, "29. Soft-deleted client excluded from active queries");

    const allClients = await Client.find({});
    assert(allClients.length === 1 && allClients[0].isDeleted === true, "30. Client record preserved in DB with isDeleted: true");

    // ── GROUP 7: Text Search Query ──────────────────────────────────────────
    console.log("\n--- TEST GROUP 7: Text Search Index ---");
    const client2 = await Client.create({
      clientCode: "CLI-002",
      companyName: "Global Logistics Ltd",
      contactPerson: "Alice Smith",
      city: "Bengaluru",
      products: [
        {
          productId: testProduct._id,
          productCode: "GL-SPEC",
          productName: "Supply Chain Tracker",
        },
      ],
    });

    const textSearchResults = await Client.find({
      $text: { $search: "Logistics" },
    });
    assert(textSearchResults.length === 1, "31. Text search on companyName returned matching client");
    assert(textSearchResults[0].clientCode === "CLI-002", "32. Matching clientCode is CLI-002");

    // ── GROUP 8: Historical Document Compatibility ──────────────────────────
    console.log("\n--- TEST GROUP 8: Historical Document Hydration ---");
    // Insert raw document directly via native collection to simulate historical record
    await conn.connection.collection("clients").insertOne({
      clientCode: "LEGACY-099",
      companyName: "Old School Textiles",
      // omitted fields: gstNo, panNo, preferredContact, openTickets, products
      status: "Active",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    const legacyDoc = await Client.findOne({ clientCode: "LEGACY-099" });
    assert(legacyDoc !== null, "33. Historical client read without error");
    assert(legacyDoc.country === "India", "34. Historical client applies default country 'India'");
    assert(legacyDoc.openTickets === 0, "35. Historical client applies default openTickets 0");
    assert(legacyDoc.gstNo === "", "36. Historical client applies default gstNo ''");
    assert(Array.isArray(legacyDoc.products) && legacyDoc.products.length === 0, "37. Historical client applies default products []");

    // ── GROUP 9: Import-Order Independence ──────────────────────────────────
    console.log("\n--- TEST GROUP 9: Import-Order Independence ---");
    delete require.cache[require.resolve("./models/Client")];
    const FreshClient = require("./models/Client");
    assert(FreshClient === mongoose.models.Client, "38. Fresh require matches mongoose.models.Client");
    assert(FreshClient.modelName === "Client", "39. Fresh require preserves modelName 'Client'");
    assert(FreshClient.collection.name === "clients", "40. Fresh require preserves collection 'clients'");

    console.log(`\n========================================`);
    console.log(`TOTAL ISOLATED CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`========================================\n`);
  } finally {
    console.log("Cleaning up: dropping temporary isolated test database...");
    await conn.connection.dropDatabase();
    await mongoose.disconnect();
    console.log("Test database dropped and connection closed cleanly.");
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All Client isolated integration tests passed successfully!");
    process.exit(0);
  }
}

runClientIsolatedTests().catch((err) => {
  console.error("Client isolated tests failed with exception:", err);
  process.exit(1);
});
