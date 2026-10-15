"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Employee = require("./models/Employee");
const Client = require("./models/Client");

let passCount = 0;
async function test(name, fn) {
  try {
    await fn();
    passCount++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runIsolatedTests() {
  console.log("=== USER ISOLATED FUNCTIONAL & SECURITY REGRESSION SUITE ===");

  const testDbName = `crm_isolated_user_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const testUri = `mongodb://127.0.0.1:27017/${testDbName}`;

  console.log(`Connecting to isolated test database: ${testDbName}`);
  const conn = await mongoose.createConnection(testUri).asPromise();
  console.log("Connected successfully to isolated local MongoDB.\n");

  const IsolatedUser = conn.model("User", User.schema);
  const IsolatedEmployee = conn.model("Employee", Employee.schema);
  const IsolatedClient = conn.model("Client", Client.schema);

  // Ensure unique indexes are built
  await IsolatedUser.init();

  try {
    // 1. Basic creation and field validations
    await test("Direct model instantiation and save with explicit bcrypt password", async () => {
      const hashed = await bcrypt.hash("Password123!", 12);
      const user = await IsolatedUser.create({
        name: "Test Admin",
        email: "ADMIN@example.com",
        password: hashed,
        role: "admin",
      });

      assert(user._id, "User must have an _id");
      assert.strictEqual(user.name, "Test Admin");
      assert.strictEqual(user.email, "admin@example.com", "Email must be lowercased automatically");
      assert.strictEqual(user.role, "admin");
      assert.strictEqual(user.status, "Active", "Default status must be Active");
      assert.strictEqual(user.mustChangePassword, false, "Default mustChangePassword must be false");
      assert.strictEqual(user.passwordChangedAt, null, "Default passwordChangedAt must be null");
      assert.strictEqual(user.lastLoginAt, null, "Default lastLoginAt must be null");
      assert(user.createdAt instanceof Date, "createdAt must be a Date");
      assert(user.updatedAt instanceof Date, "updatedAt must be a Date");
    });

    // 2. Email unique index enforcement
    await test("Duplicate email is rejected by unique index (E11000)", async () => {
      let duplicateError = null;
      try {
        const hashed = await bcrypt.hash("AnotherPass123", 12);
        await IsolatedUser.create({
          name: "Another Admin",
          email: "admin@example.com", // same lowercased email
          password: hashed,
          role: "admin",
        });
      } catch (err) {
        duplicateError = err;
      }
      assert(duplicateError, "Must throw duplicate key error");
      assert.strictEqual(duplicateError.code, 11000, "Error code must be 11000");
    });

    // 3. employeeCode uppercase transformation and trimming
    await test("employeeCode uppercase and trimming", async () => {
      const hashed = await bcrypt.hash("Pass123456", 12);
      const user = await IsolatedUser.create({
        name: "Employee User",
        email: "emp.user@example.com",
        password: hashed,
        role: "employee",
        employeeCode: "  emp-999  ",
      });
      assert.strictEqual(user.employeeCode, "EMP-999", "employeeCode must be trimmed and uppercased");
    });

    // 4. clientCode uppercase transformation and trimming
    await test("clientCode uppercase and trimming", async () => {
      const hashed = await bcrypt.hash("Pass123456", 12);
      const user = await IsolatedUser.create({
        name: "Client User",
        email: "client.user@example.com",
        password: hashed,
        role: "client",
        clientCode: "  cli-888  ",
        companyName: "  Acme Corp  ",
        mobile: "  9876543210  ",
      });
      assert.strictEqual(user.clientCode, "CLI-888");
      assert.strictEqual(user.companyName, "Acme Corp");
      assert.strictEqual(user.mobile, "9876543210");
    });

    // 5. Password select: false verification
    await test("Password is excluded by default in queries (select: false)", async () => {
      const foundUser = await IsolatedUser.findOne({ email: "admin@example.com" });
      assert(foundUser, "User must be found");
      assert.strictEqual(foundUser.password, undefined, "password field must be undefined on normal query");

      const foundWithPassword = await IsolatedUser.findOne({ email: "admin@example.com" }).select("+password");
      assert(foundWithPassword, "User must be found");
      assert(foundWithPassword.password, "password must be present when explicitly selected");
      assert(foundWithPassword.password.startsWith("$2"), "password must be bcrypt hash");
    });

    // 6. Password minlength enforcement
    await test("Password shorter than 6 characters is rejected by validation", async () => {
      let validationError = null;
      try {
        await IsolatedUser.create({
          name: "Short Pass User",
          email: "short@example.com",
          password: "123", // too short
          role: "admin",
        });
      } catch (err) {
        validationError = err;
      }
      assert(validationError, "Must throw validation error");
      assert(validationError.errors.password, "Validation error must be on password");
    });

    // 7. Role enum validation
    await test("Invalid role is rejected by schema enum validation", async () => {
      let roleError = null;
      try {
        const hashed = await bcrypt.hash("Pass123456", 12);
        await IsolatedUser.create({
          name: "Hacker User",
          email: "hacker@example.com",
          password: hashed,
          role: "superadmin_invalid",
        });
      } catch (err) {
        roleError = err;
      }
      assert(roleError, "Must throw error for invalid role");
      assert(roleError.errors.role, "Error must be on role path");
    });

    // 8. Status enum validation
    await test("Invalid status is rejected by schema enum validation", async () => {
      let statusError = null;
      try {
        const hashed = await bcrypt.hash("Pass123456", 12);
        await IsolatedUser.create({
          name: "Invalid Status User",
          email: "invalid.status@example.com",
          password: hashed,
          role: "admin",
          status: "Suspended_Invalid",
        });
      } catch (err) {
        statusError = err;
      }
      assert(statusError, "Must throw error for invalid status");
      assert(statusError.errors.status, "Error must be on status path");
    });

    // 9. Valid roles and statuses acceptance
    await test("All valid roles ('admin', 'employee', 'client') and statuses ('Active', 'Inactive', 'Blocked') are accepted", async () => {
      const hashed = await bcrypt.hash("ValidPass123", 12);
      const u1 = await IsolatedUser.create({ name: "U1", email: "u1@example.com", password: hashed, role: "admin", status: "Active" });
      const u2 = await IsolatedUser.create({ name: "U2", email: "u2@example.com", password: hashed, role: "employee", status: "Inactive" });
      const u3 = await IsolatedUser.create({ name: "U3", email: "u3@example.com", password: hashed, role: "client", status: "Blocked" });

      assert.strictEqual(u1.role, "admin");
      assert.strictEqual(u1.status, "Active");
      assert.strictEqual(u2.role, "employee");
      assert.strictEqual(u2.status, "Inactive");
      assert.strictEqual(u3.role, "client");
      assert.strictEqual(u3.status, "Blocked");
    });

    // 10. Bcrypt verification: correct password passes, incorrect password fails
    await test("Bcrypt comparison matches correct password and rejects incorrect password", async () => {
      const plain = "CorrectSecretPass#2026";
      const hashed = await bcrypt.hash(plain, 12);
      const user = await IsolatedUser.create({
        name: "Auth Test User",
        email: "auth.test@example.com",
        password: hashed,
        role: "admin",
      });

      const userWithPass = await IsolatedUser.findById(user._id).select("+password");
      const isMatch = await bcrypt.compare(plain, userWithPass.password);
      assert.strictEqual(isMatch, true, "Bcrypt compare must succeed for correct password");

      const isMismatch = await bcrypt.compare("WrongPassword!", userWithPass.password);
      assert.strictEqual(isMismatch, false, "Bcrypt compare must fail for wrong password");
    });

    // 11. Profile update does NOT overwrite or erase password hash
    await test("Updating user profile fields without password preserves existing password hash", async () => {
      const plain = "OriginalPass#123";
      const hashed = await bcrypt.hash(plain, 12);
      const user = await IsolatedUser.create({
        name: "Profile Update User",
        email: "profile.update@example.com",
        password: hashed,
        role: "employee",
      });

      // Fetch user without password (standard query)
      const fetched = await IsolatedUser.findById(user._id);
      fetched.name = "Updated Name";
      fetched.mobile = "9999888877";
      fetched.lastLoginAt = new Date();
      await fetched.save();

      // Verify password hash in storage was completely unchanged
      const verified = await IsolatedUser.findById(user._id).select("+password");
      assert.strictEqual(verified.name, "Updated Name");
      assert.strictEqual(verified.password, hashed, "Password hash must remain identical in database");
      const stillValid = await bcrypt.compare(plain, verified.password);
      assert.strictEqual(stillValid, true, "Original password must still verify");
    });

    // 12. Password change update hashes correctly and works
    await test("Explicit password update with bcrypt.hash(newPass, 12) updates hash and verifies", async () => {
      const user = await IsolatedUser.findOne({ email: "profile.update@example.com" }).select("+password");
      const newPlain = "BrandNewSecurePassword#2026";
      user.password = await bcrypt.hash(newPlain, 12);
      user.mustChangePassword = false;
      user.passwordChangedAt = new Date();
      await user.save();

      const updatedUser = await IsolatedUser.findById(user._id).select("+password");
      const matchNew = await bcrypt.compare(newPlain, updatedUser.password);
      assert.strictEqual(matchNew, true, "New password must match");
      const matchOld = await bcrypt.compare("OriginalPass#123", updatedUser.password);
      assert.strictEqual(matchOld, false, "Old password must no longer match");
      assert(updatedUser.passwordChangedAt instanceof Date, "passwordChangedAt must be populated");
    });

    // 13. Client reference assignment and population
    await test("User clientId links to Client and populates correctly", async () => {
      const client = await IsolatedClient.create({
        companyName: "Acme Enterprises",
        clientCode: "ACME-001",
        contactPerson: "Bob Smith",
        email: "bob@acme.com",
      });

      const user = await IsolatedUser.create({
        name: "Bob Smith",
        email: "bob.smith@acme.com",
        password: await bcrypt.hash("Pass123456", 12),
        role: "client",
        clientId: client._id,
      });

      const populated = await IsolatedUser.findById(user._id).populate("clientId");
      assert(populated.clientId, "clientId must populate");
      assert.strictEqual(populated.clientId.companyName, "Acme Enterprises");
      assert.strictEqual(populated.clientId.clientCode, "ACME-001");
    });

    // 14. Employee userId linkage and population
    await test("Employee links to User and populates correctly", async () => {
      const user = await IsolatedUser.create({
        name: "Jane Dev",
        email: "jane.dev@example.com",
        password: await bcrypt.hash("Pass123456", 12),
        role: "employee",
      });

      const emp = await IsolatedEmployee.create({
        name: "Jane Dev",
        email: "jane.dev@example.com",
        employeeCode: "EMP-JANE-01",
        role: "Developer",
        userId: user._id,
      });

      const populatedEmp = await IsolatedEmployee.findById(emp._id).populate("userId");
      assert(populatedEmp.userId, "Employee userId must populate");
      assert.strictEqual(populatedEmp.userId.name, "Jane Dev");
      assert.strictEqual(populatedEmp.userId.role, "employee");
    });

    // 15. Historical Atlas document hydration
    await test("Historical Atlas document shapes hydrate without error", async () => {
      const atlasDoc = {
        name: "Atlas Production Admin",
        email: "atlas.admin@example.com",
        password: "$2a$12$e8x0f3WqA.Xz8R1K8eX/aOWfPZz6j8oU3qO0N8R2Z0A6e9N7vX8bW", // 60-char dummy bcrypt
        role: "admin",
        status: "Active",
        mustChangePassword: false,
        lastLoginAt: new Date(),
        employeeCode: "",
        clientId: null,
        clientCode: "",
        companyName: "",
        mobile: "",
      };

      const doc = new IsolatedUser(atlasDoc);
      await doc.validate();
      await doc.save();
      assert(doc._id, "Atlas doc must save with _id");
    });

  } finally {
    console.log("\nDropping isolated test database and disconnecting...");
    await conn.dropDatabase();
    await conn.close();
    console.log("Isolated test database dropped cleanly.");
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL ISOLATED CHECKS: ${passCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: 0`);
  console.log(`======================================================`);
}

runIsolatedTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

