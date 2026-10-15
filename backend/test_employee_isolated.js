"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const Employee = require("./models/Employee");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_employee_isolated_${Date.now()}`;

async function runEmployeeIsolatedTests() {
  console.log("======================================================");
  console.log("   EMPLOYEE ISOLATED FUNCTIONAL TEST SUITE");
  console.log("======================================================\n");

  let passed = 0;
  let failed = 0;

  function check(name, condition, extraInfo) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      console.error(`  ✗ ${name} (FAILED)`);
      if (extraInfo) console.error("    Details:", extraInfo);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // Pre-flight safety check
  assert(TEST_DB_URI.includes("127.0.0.1"), "Must use local MongoDB host 127.0.0.1");
  assert(TEST_DB_URI.includes("crm_employee_isolated_"), "Must use isolated temporary test database");
  assert(!TEST_DB_URI.includes("ClientConnectTrack"), "Must NOT use production database");

  console.log(`Connecting to isolated test database: ${TEST_DB_URI}...`);
  await mongoose.connect(TEST_DB_URI);
  console.log("Connected successfully.\n");

  try {
    await Employee.init(); // Ensure indexes are built in isolated database

    // ── Test 1: Successful creation with required and default fields ───────
    console.log("--- 1. Document Creation & Defaults ---");
    const emp1 = await Employee.create({
      employeeCode: "EMP001",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Support Executive",
    });

    check("Employee created successfully", Boolean(emp1._id));
    check("Default department is 'Support'", emp1.department === "Support");
    check("Default status is 'Free'", emp1.status === "Free");
    check("Default currentTask is 'Available for assignment'", emp1.currentTask === "Available for assignment");
    check("Default activeMinutes is 0", emp1.activeMinutes === 0);
    check("Default openTasks is 0", emp1.openTasks === 0);
    check("Default completedToday is 0", emp1.completedToday === 0);
    check("Default isActive is true", emp1.isActive === true);
    check("Default currentTaskId is null", emp1.currentTaskId === null);
    check("Default currentTicketId is null", emp1.currentTicketId === null);
    check("Default currentClient is '—'", emp1.currentClient === "—");
    check("Default currentProject is '—'", emp1.currentProject === "—");
    check("Timestamps createdAt and updatedAt auto-populated", Boolean(emp1.createdAt && emp1.updatedAt));

    // ── Test 2: Trimming and casing transformations ─────────────────────────
    console.log("\n--- 2. Field Normalization & Trimming ---");
    const emp2 = await Employee.create({
      employeeCode: "  emp002  ",
      name: "  Jane Smith  ",
      email: "  JANE.Smith@Example.COM  ",
      role: "  Senior Developer  ",
      mobile: "  +91 9876543210  ",
      department: "Development",
    });

    check("employeeCode trimmed and uppercased", emp2.employeeCode === "EMP002");
    check("name trimmed", emp2.name === "Jane Smith");
    check("email trimmed and lowercased", emp2.email === "jane.smith@example.com");
    check("role trimmed", emp2.role === "Senior Developer");
    check("mobile trimmed", emp2.mobile === "+91 9876543210");

    // ── Test 3: Required field validations ─────────────────────────────────
    console.log("\n--- 3. Required Fields Validation ---");
    let errNoCode = null;
    try {
      await Employee.create({ name: "No Code", email: "nocode@example.com", role: "Dev" });
    } catch (e) {
      errNoCode = e;
    }
    check("Missing employeeCode throws ValidationError", errNoCode && errNoCode.name === "ValidationError");

    let errNoName = null;
    try {
      await Employee.create({ employeeCode: "EMP003", email: "noname@example.com", role: "Dev" });
    } catch (e) {
      errNoName = e;
    }
    check("Missing name throws ValidationError", errNoName && errNoName.name === "ValidationError");

    let errNoEmail = null;
    try {
      await Employee.create({ employeeCode: "EMP004", name: "No Email", role: "Dev" });
    } catch (e) {
      errNoEmail = e;
    }
    check("Missing email throws ValidationError", errNoEmail && errNoEmail.name === "ValidationError");

    let errNoRole = null;
    try {
      await Employee.create({ employeeCode: "EMP005", name: "No Role", email: "norole@example.com" });
    } catch (e) {
      errNoRole = e;
    }
    check("Missing role throws ValidationError", errNoRole && errNoRole.name === "ValidationError");

    // ── Test 4: Enum constraint validation ─────────────────────────────────
    console.log("\n--- 4. Enum Constraints ---");
    let errInvalidDept = null;
    try {
      await Employee.create({
        employeeCode: "EMP006",
        name: "Bad Dept",
        email: "baddept@example.com",
        role: "Dev",
        department: "NonExistentDept",
      });
    } catch (e) {
      errInvalidDept = e;
    }
    check("Invalid department enum value is rejected", errInvalidDept && errInvalidDept.name === "ValidationError");

    let errInvalidStatus = null;
    try {
      await Employee.create({
        employeeCode: "EMP007",
        name: "Bad Status",
        email: "badstatus@example.com",
        role: "Dev",
        status: "Sleeping",
      });
    } catch (e) {
      errInvalidStatus = e;
    }
    check("Invalid status enum value is rejected", errInvalidStatus && errInvalidStatus.name === "ValidationError");

    // Test valid status transitions
    for (const validStatus of ["Free", "Working", "Break", "Leave", "Offline", "Inactive"]) {
      emp1.status = validStatus;
      await emp1.save();
      check(`Status transition to '${validStatus}' accepted`, emp1.status === validStatus);
    }

    // ── Test 5: Numeric minimum bounds ─────────────────────────────────────
    console.log("\n--- 5. Numeric Bounds ---");
    let errNegMinutes = null;
    try {
      await Employee.create({
        employeeCode: "EMP008",
        name: "Neg Min",
        email: "negmin@example.com",
        role: "Dev",
        activeMinutes: -10,
      });
    } catch (e) {
      errNegMinutes = e;
    }
    check("Negative activeMinutes is rejected", errNegMinutes && errNegMinutes.name === "ValidationError");

    let errNegTasks = null;
    try {
      await Employee.create({
        employeeCode: "EMP009",
        name: "Neg Tasks",
        email: "negtasks@example.com",
        role: "Dev",
        openTasks: -1,
      });
    } catch (e) {
      errNegTasks = e;
    }
    check("Negative openTasks is rejected", errNegTasks && errNegTasks.name === "ValidationError");

    // ── Test 6: Unique index constraints (E11000) ──────────────────────────
    console.log("\n--- 6. Unique Constraints (E11000) ---");
    let errDupCode = null;
    try {
      await Employee.create({
        employeeCode: "EMP001", // duplicate
        name: "Duplicate Code",
        email: "unique.email@example.com",
        role: "Dev",
      });
    } catch (e) {
      errDupCode = e;
    }
    check("Duplicate employeeCode triggers E11000 duplicate key error", errDupCode && errDupCode.code === 11000);

    let errDupEmail = null;
    try {
      await Employee.create({
        employeeCode: "EMP010",
        name: "Duplicate Email",
        email: "john.doe@example.com", // duplicate
        role: "Dev",
      });
    } catch (e) {
      errDupEmail = e;
    }
    check("Duplicate email triggers E11000 duplicate key error", errDupEmail && errDupEmail.code === 11000);

    // ── Test 7: Reference population & assignments ─────────────────────────
    console.log("\n--- 7. Reference Population & Task Assignments ---");
    const syntheticUserId = new mongoose.Types.ObjectId();
    const syntheticTaskId = new mongoose.Types.ObjectId();
    const syntheticTicketId = new mongoose.Types.ObjectId();

    const empWithRefs = await Employee.create({
      employeeCode: "EMP011",
      name: "Assigned Dev",
      email: "assigned@example.com",
      role: "Full Stack",
      userId: syntheticUserId,
      currentTaskId: syntheticTaskId,
      currentTicketId: syntheticTicketId,
      currentTaskCode: "TSK-100",
      currentTaskTitle: "Optimize DB Queries",
      currentTaskStartedAt: new Date(),
    });

    check("userId persisted as ObjectId", empWithRefs.userId.equals(syntheticUserId));
    check("currentTaskId persisted as ObjectId", empWithRefs.currentTaskId.equals(syntheticTaskId));
    check("currentTicketId persisted as ObjectId", empWithRefs.currentTicketId.equals(syntheticTicketId));
    check("currentTaskCode saved", empWithRefs.currentTaskCode === "TSK-100");
    check("currentTaskStartedAt is Date", empWithRefs.currentTaskStartedAt instanceof Date);

    // ── Test 8: Atlas historical document hydration ────────────────────────
    console.log("\n--- 8. Historical Atlas Document Hydration ---");
    const atlasDoc1 = {
      _id: new mongoose.Types.ObjectId("6a5dcaedfb7cfeea6a1bef95"),
      employeeCode: "EMP100",
      name: "Atlas Dev One",
      email: "dev1@company.com",
      role: "DEVLOPER",
      department: "Development",
      status: "Offline",
      userId: new mongoose.Types.ObjectId(),
      currentTaskId: null,
      currentTicketId: null,
      activeMinutes: 0,
      isActive: true,
      createdAt: new Date("2026-07-20T07:14:53.000Z"),
      updatedAt: new Date("2026-10-14T13:54:36.000Z"),
    };

    const hydrated1 = new Employee(atlasDoc1);
    const valErr1 = hydrated1.validateSync();
    check("Atlas doc 1 validates cleanly", valErr1 == null);
    check("Atlas doc 1 employeeCode preserved", hydrated1.employeeCode === "EMP100");
    check("Atlas doc 1 status is 'Offline'", hydrated1.status === "Offline");

    const atlasDoc2 = {
      _id: new mongoose.Types.ObjectId("6a8432e2eb643f4087dee336"),
      employeeCode: "E101",
      name: "Atlas Dev Two",
      email: "dev2@company.com",
      role: "Developer",
      department: "Development",
      status: "Working",
      userId: new mongoose.Types.ObjectId(),
      currentTaskId: null,
      currentTicketId: null,
      activeMinutes: 0,
      isActive: true,
      createdAt: new Date("2026-08-18T10:24:34.000Z"),
      updatedAt: new Date("2026-10-07T07:52:06.000Z"),
    };

    const hydrated2 = new Employee(atlasDoc2);
    const valErr2 = hydrated2.validateSync();
    check("Atlas doc 2 validates cleanly", valErr2 == null);
    check("Atlas doc 2 status is 'Working'", hydrated2.status === "Working");

    // ── Test 9: Attendance query patterns compatibility ───────────────────
    console.log("\n--- 9. Attendance Query Compatibility ---");
    const foundByCode = await Employee.findOne({ employeeCode: "EMP001" });
    check("Found by employeeCode", foundByCode && foundByCode.name === "John Doe");

    const activeEmployees = await Employee.find({ isActive: true });
    check("Find active employees returns array", Array.isArray(activeEmployees) && activeEmployees.length >= 3);

    const devCount = await Employee.countDocuments({ department: "Development" });
    check("countDocuments by department succeeds", devCount >= 1);

    const updatedLogin = await Employee.findByIdAndUpdate(
      emp1._id,
      { status: "Working", loginTime: new Date() },
      { new: true }
    );
    check("findByIdAndUpdate status and loginTime succeeds", updatedLogin.status === "Working" && updatedLogin.loginTime instanceof Date);

    // ── Test 10: Import-Order Independence & Mongoose Model Cache ───────────
    console.log("\n--- 10. Import-Order Independence ---");
    check("Cached model matches canonical export", mongoose.models.Employee === Employee);

  } finally {
    console.log("\n--- Cleanup ---");
    try {
      await mongoose.connection.dropDatabase();
      console.log("Dropped isolated test database successfully.");
    } catch (e) {
      console.error("Cleanup warning:", e.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from isolated test database.\n");
  }

  console.log("======================================================");
  console.log(`TOTAL ISOLATED EMPLOYEE CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEmployeeIsolatedTests().catch((err) => {
  console.error("Fatal error in isolated test suite:", err);
  process.exit(1);
});

