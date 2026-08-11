const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");
const AgentDevice = require("./models/AgentDevice");
async function authenticateAgent(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing device token",
      });
    }

    const device = await AgentDevice.findOne({
      token,
      isActive: true,
    });

    if (!device) {
      return res.status(401).json({
        success: false,
        message: "Invalid device token",
      });
    }

    req.agentDevice = device;
    next();
  } catch (error) {
    next(error);
  }
}

const AgentUploadedSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  employeeCode: String,
  uploadedAt: { type: Date, default: Date.now },
});

const AgentUploadedSession =
  mongoose.models.AgentUploadedSession ||
  mongoose.model("AgentUploadedSession", AgentUploadedSessionSchema);
const { getISTDateBucket } = require("./utils/dateUtils");

dotenv.config();

/* =========================================================
   ROUTES
========================================================= */

const authRoutes = require("./auth");
const adminRoutes = require("./admin");
const employeeRoutes = require("./employee");
require("./agentSession");
const clientRoutes = require("./client");
const settingsRoutes = require("./settings");
const attendanceRoutes = require("./attendance");
const attendanceV2Routes = require("./attendance-v2");
const documentsRoutes = require("./documents");
console.log("========================================");
console.log("SERVER FILE:", __filename);
console.log("SERVER FOLDER:", __dirname);
console.log(
  "ADMIN FILE:",
  require.resolve("./admin")
);
console.log("========================================");

/* =========================================================
   APP SETUP
========================================================= */

const app = express();

const PORT =
  process.env.PORT || 5000;

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/* =========================================================
   STATIC FILES
========================================================= */

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

/* =========================================================
   API ROUTES
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);
app.use("/api/admin", attendanceRoutes);

app.use(
  "/api/admin",
  adminRoutes
);
app.get(
  "/api/admin-route-test",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Admin router mounting section is active.",
      serverFile:
        __filename,
      adminFile:
        require.resolve("./admin"),

    });
  }
);

app.use(
  "/api/employee",
  employeeRoutes
);

app.use(
  "/api/attendance",
  attendanceV2Routes
);

app.use(
  "/api/client",
  clientRoutes
);

app.use(
  "/api/documents",
  documentsRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    const isConnected =
      mongoose.connection.readyState ===
      1;

    return res.status(200).json({
      success: true,

      message:
        "Client Connect backend is running.",

      database:
        isConnected
          ? "Connected"
          : "Disconnected",

      databaseName:
        isConnected
          ? mongoose.connection.name
          : null,
    });
  }
);
app.post("/api/agent/upload", async (req, res) => {
  return res.json({
    success: true,
    message: "Deprecated. Agent must use /api/agent/events",
  });
});
const AgentDailySummary = mongoose.models.AgentDailySummary;
const processedSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    employeeCode: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
  },
  { collection: "agent_processed_sessions" }
);

const ProcessedSession =
  mongoose.models.ProcessedSession ||
  mongoose.model("ProcessedSession", processedSessionSchema);

// =========================================================
// WINDOWS AGENT APPLICATION SESSION (DAILY SUMMARY)
// =========================================================
app.post("/api/agent/session", async (req, res) => {
  return res.json({
    success: true,
    message: "Deprecated. Agent must use /api/agent/events",
  });
});

app.post("/api/agent/events", async (req, res) => {
  try {
    const { employeeCode, pcName, sessions } = req.body;

    if (!employeeCode || !Array.isArray(sessions)) {
      return res.status(400).json({
        success: false,
        message: "employeeCode and sessions are required.",
      });
    }
    const employee = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const processedIds = [];
    const failed = [];

  for (const session of sessions) {
  try {
    const today = getISTDateBucket(new Date(session.startTime));

    // Prevent duplicate processing of the same session
    try {
      await ProcessedSession.create({
        sessionId: session.id,
        employeeCode: employee.employeeCode,
      });
    } catch (dupErr) {
      // Mongo duplicate key error = already processed
      if (dupErr.code === 11000) {
        console.log("Duplicate session skipped:", session.id);
        continue;
      }
      throw dupErr;
    }

    console.log(
      "EVENT",
      session.application,
      "|",
      session.windowTitle,
      "|",
      session.durationSeconds
    );
    const activeTask =
  employee.currentTaskId
    ? await mongoose.models.Task.findById(employee.currentTaskId).lean()
    : null;

        await AgentDailySummary.findOneAndUpdate(
          {
            employeeCode: employee.employeeCode,
            application: session.application,
            date: today,
          },
          {
            $inc: {
              totalSeconds: session.durationSeconds,
              sessionCount: 1,
            },
            $set: {
              employeeId: employee._id,
              employeeName: employee.name,
              pcName,

              application: session.application,
              lastWindowTitle: session.windowTitle,
              lastSeen: new Date(session.endTime),

              category: session.category || "Other",
              activity: session.activity || "",
              project: session.project || employee.currentProject || "—",
              client: session.client || employee.currentClient || "—",

              // attach the currently selected task
           taskId: activeTask?._id || null,
taskCode: activeTask?.taskCode || "",
taskTitle: activeTask?.title || "",

ticketId: activeTask?.ticketId || null,
ticketCode: activeTask?.ticketCode || "",
            },
            $setOnInsert: {
              firstSeen: new Date(session.startTime),
              date: today,
            },
          },
          {
            upsert: true,
            returnDocument: "after",
          }
        );

        processedIds.push(session.id);
      } catch (sessionErr) {
        // Don't let one bad session take the whole batch down.
        console.error(
          `Failed to upsert session [${session.application} | ${session.windowTitle}]:`,
          sessionErr.message
        );
        failed.push({ id: session.id, application: session.application, error: sessionErr.message });
      }
    }

    return res.json({
      success: true,
      processed: processedIds.length,
      processedIds,
      failed,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});
app.post("/api/agent/register", async (req, res) => {
  try {
    const { employeeCode, pcName, deviceId, deviceName, platform, appVersion } = req.body;

    if (!employeeCode || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "employeeCode and deviceId are required.",
      });
    }

    const employee = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const device = await AgentDevice.findOneAndUpdate(
      { deviceId },
      {
        employeeCode: employee.employeeCode,
        pcName: pcName || "",
        deviceName: deviceName || pcName || "",
        platform: platform || "windows",
        appVersion: appVersion || "1.0.0",
        token,
        lastSeen: new Date(),
        isActive: true,
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    return res.json({
      success: true,
      deviceToken: token,
      deviceId: device.deviceId,
      employeeCode: device.employeeCode,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});
app.get("/api/agent/current-task", authenticateAgent, async (req, res) => {
  try {
    const device = req.agentDevice;

    const employee = await Employee.findOne({
      employeeCode: device.employeeCode,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (!employee.currentTaskId) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const Task = mongoose.models.Task;

    const task = await Task.findById(employee.currentTaskId).lean();

    return res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current task",
    });
  }
});
app.get("/api/agent/online", async (req, res) => {
  try {
    const devices = await AgentDevice.find().lean();

    const now = Date.now();

    const result = devices.map((device) => {
      const lastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
      const diffSeconds = Math.floor((now - lastSeen) / 1000);

      let status = "Offline";
      if (diffSeconds <= 60) status = "Working";
      else if (diffSeconds <= 180) status = "Idle";

      return {
        employeeCode: device.employeeCode,
        deviceName: device.deviceName,
        pcName: device.pcName,
        application: device.application || "Unknown",
        lastSeen: device.lastSeen,
        status,
      };
    });

    res.json({
      success: true,
      devices: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load online devices",
    });
  }
});
// =========================================================
// WINDOWS AGENT HEARTBEAT
// =========================================================
// =========================================================
// WINDOWS AGENT HEARTBEAT
// =========================================================
const Employee = mongoose.models.Employee;


app.post("/api/agent/heartbeat", async (req, res) => {
  try {
    const {
      employeeCode,
      pcName,
      status,
      application,
      task,
      timestamp,
    } = req.body;

    const now = new Date(timestamp || Date.now());

    // Update employee status
    const employee = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    employee.status = status || "Working";
    employee.lastActivityAt = now;

    if (task) {
      employee.currentTask = task;
    }

    await employee.save();

    // Update device heartbeat
    await AgentDevice.updateOne(
      {
        employeeCode: employeeCode.toUpperCase(),
        pcName,
      },
      {
        $set: {
          lastSeen: now,
          updatedAt: now,
          isActive: true,
          application,
          status: status || "Working",
        },
      }
    );

    return res.json({
      success: true,
      serverTime: now,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Heartbeat failed.",
    });
  }
});

/* =========================================================
   ROOT ROUTE
========================================================= */

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,

    message:
      "Client Connect API is running.",
  });
});

/* =========================================================
   ROUTE NOT FOUND
========================================================= */

app.use((req, res) => {
  return res.status(404).json({
    success: false,

    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Validation failed.",

        errors:
          Object.fromEntries(
            Object.entries(
              error.errors
            ).map(
              ([
                field,
                fieldError,
              ]) => [
                  field,
                  fieldError.message,
                ]
            )
          ),
      });
    }

    if (
      error?.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid record ID.",
      });
    }

    if (
      error?.code === 11000
    ) {
      return res.status(409).json({
        success: false,

        message:
          "Duplicate record already exists.",
      });
    }

    return res.status(
      error.statusCode ||
      error.status ||
      500
    ).json({
      success: false,

      message:
        error.message ||
        "Internal server error.",
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    if (
      !process.env.MONGO_URI
    ) {
      throw new Error(
        "MONGO_URI is missing from the .env file."
      );
    }

    if (
      !process.env.JWT_SECRET
    ) {
      throw new Error(
        "JWT_SECRET is missing from the .env file."
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected successfully."
    );

    console.log(
      `Database: ${mongoose.connection.name}`
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running at http://localhost:${PORT}`
        );

        console.log(
          `Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          `Auth: http://localhost:${PORT}/api/auth/test`
        );

        console.log(
          `Settings: http://localhost:${PORT}/api/settings/health`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();