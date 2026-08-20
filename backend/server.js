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
  isApproved: true,
});

    if (!device) {
  return res.status(403).json({
    success: false,
    message:
      "This agent device is not approved or is inactive.",
  });
}

    req.agentDevice = device;
    next();
  } catch (error) {
    next(error);
  }
}


const {
  getISTDateBucket,
  getISTDateString,
} = require("./utils/dateUtils");

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
const reportRoutes = require("./reports");
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
  "/api/reports",
  reportRoutes
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
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    employeeCode: {
      type: String,
      required: true,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30,
    },
  },
  {
    collection: "agent_processed_sessions",
    versionKey: false,
  }
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

app.post("/api/agent/events", authenticateAgent, async (req, res) => {
  try {

   const { pcName, sessions } = req.body;

// Never trust employeeCode supplied by the client.
// The authenticated AgentDevice decides which employee
// this agent belongs to.
const employeeCode =
  req.agentDevice.employeeCode;

    // =====================================================
    // BASIC REQUEST VALIDATION
    // =====================================================

    if (
      !employeeCode ||
      !Array.isArray(sessions)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "employeeCode and sessions are required.",
      });
    }

    if (sessions.length === 0) {
      return res.json({
        success: true,
        processed: 0,
        processedIds: [],
        failed: [],
      });
    }

    // Protect backend from accidentally huge payloads.
    if (sessions.length > 200) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 200 sessions allowed per batch.",
      });
    }

    // =====================================================
    // EMPLOYEE
    // =====================================================

    const normalizedEmployeeCode =
      employeeCode.toUpperCase();

    const employee = await Employee.findOne({
      employeeCode: normalizedEmployeeCode,
    }).lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const processedIds = [];
    const failed = [];
    const validSessions = [];

    // =====================================================
    // VALIDATE ALL SESSIONS FIRST
    // =====================================================

    for (const session of sessions) {
      if (
        !session ||
        !session.id ||
        !session.application ||
        !session.startTime ||
        !session.endTime ||
        !Number.isFinite(
          Number(session.durationSeconds)
        ) ||
        Number(session.durationSeconds) <= 0
      ) {
        failed.push({
          id: session?.id || null,
          application:
            session?.application || "",
          error: "Invalid session payload",
        });

        continue;
      }

      const start = new Date(
        session.startTime
      );

      const end = new Date(
        session.endTime
      );

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        failed.push({
          id: session.id,
          application:
            session.application,
          error: "Invalid session timestamps",
        });

        continue;
      }

      validSessions.push(session);
    }

    if (validSessions.length === 0) {
      return res.json({
        success: true,
        processed: 0,
        processedIds,
        failed,
      });
    }
    // =====================================================
// ATTENDANCE / WORKDAY SAFETY GUARD
// =====================================================
//
// Important:
//
// We do NOT simply reject everything after End Workday.
//
// The agent's final session may start BEFORE End Workday
// and finish a few seconds AFTER attendance logoutTime
// because:
//
// Backend attendance logout
//        ↓
// Browser calls local agent /logout
//        ↓
// tracker.stop() saves final session
//
// Therefore:
//
// session STARTED before logoutTime = allow
// session STARTED after logoutTime  = discard
//
// Discarded sessions are ACKNOWLEDGED so the Windows
// agent does not keep retrying them forever.
//

const sessionDates = [
  ...new Set(
    validSessions.map((session) =>
      getISTDateString(
        new Date(
          session.startTime
        )
      )
    )
  ),
];

const attendanceRecords =
  AttendanceV2
    ? await AttendanceV2.find({
        employeeId:
          employee._id,

        date: {
          $in: sessionDates,
        },

        isDeleted: {
          $ne: true,
        },
      }).lean()
    : [];

const attendanceByDate =
  new Map(
    attendanceRecords.map(
      (attendance) => [
        attendance.date,
        attendance,
      ]
    )
  );

const workdaySessions = [];
const ignoredSessions = [];

for (const session of validSessions) {
  const sessionStart =
    new Date(
      session.startTime
    );

  const attendanceDate =
    getISTDateString(
      sessionStart
    );

  const attendance =
    attendanceByDate.get(
      attendanceDate
    );

  /*
   * No attendance/workday for this date.
   *
   * Do not save PC tracking outside an
   * authenticated workday.
   */
  if (
    !attendance ||
    !attendance.loginTime
  ) {
    processedIds.push(
      session.id
    );

    ignoredSessions.push({
      id:
        session.id,

      reason:
        "No active attendance record.",
    });

    continue;
  }

  const loginAt =
    new Date(
      attendance.loginTime
    );

  /*
   * Session started before employee workday.
   */
  if (
    sessionStart.getTime() <
    loginAt.getTime()
  ) {
    processedIds.push(
      session.id
    );

    ignoredSessions.push({
      id:
        session.id,

      reason:
        "Session started before workday.",
    });

    continue;
  }

  /*
   * WORKDAY COMPLETED
   *
   * Final session is still accepted when it
   * started BEFORE logoutTime.
   *
   * But if the agent restarts after End Workday,
   * all new sessions start AFTER logoutTime and
   * are ignored.
   */
  if (attendance.logoutTime) {
    const logoutAt =
      new Date(
        attendance.logoutTime
      );

    if (
      sessionStart.getTime() >
      logoutAt.getTime()
    ) {
      processedIds.push(
        session.id
      );

      ignoredSessions.push({
        id:
          session.id,

        reason:
          "Workday already completed.",
      });

      continue;
    }
  }

  workdaySessions.push(
    session
  );
}

if (
  ignoredSessions.length >
  0
) {
  console.log(
    `[AGENT GUARD] ${employee.employeeCode} | Ignored outside-workday sessions: ${ignoredSessions.length}`
  );
}

/*
 * If nothing remains after attendance validation,
 * ACK ignored IDs so SQLite can clear them.
 */

if (
  workdaySessions.length ===
  0
) {
  return res.json({
    success: true,

    processed:
      processedIds.length,

    processedIds: [
      ...new Set(
        processedIds
      ),
    ],

    ignored:
      ignoredSessions,

    failed,
  });
}

    // =====================================================
    // REMOVE DUPLICATES INSIDE THIS REQUEST
    // =====================================================

    const uniqueSessionMap = new Map();

    for (const session of workdaySessions) {
      if (!uniqueSessionMap.has(session.id)) {
        uniqueSessionMap.set(
          session.id,
          session
        );
      }
    }

    const uniqueSessions = [
      ...uniqueSessionMap.values(),
    ];

    const incomingIds = uniqueSessions.map(
      (session) => session.id
    );

    // =====================================================
    // ONE DB QUERY FOR PREVIOUSLY PROCESSED IDS
    // =====================================================

    const existingProcessed =
      await ProcessedSession.find(
        {
          sessionId: {
            $in: incomingIds,
          },
        },
        {
          sessionId: 1,
          _id: 0,
        }
      ).lean();

    const existingIdSet = new Set(
      existingProcessed.map(
        (item) => item.sessionId
      )
    );

    // Already processed = ACK immediately.
    for (const id of existingIdSet) {
      processedIds.push(id);
    }

    const newSessions =
      uniqueSessions.filter(
        (session) =>
          !existingIdSet.has(
            session.id
          )
      );

    if (newSessions.length === 0) {
      return res.json({
        success: true,
        processed:
          processedIds.length,
        processedIds,
        failed,
      });
    }

    // =====================================================
    // LOAD TASKS ONCE FOR THE WHOLE BATCH
    // =====================================================

    const taskIds = [
      ...new Set(
        newSessions
          .map(
            (session) =>
              session.taskId ||
              employee.currentTaskId ||
              null
          )
          .filter(Boolean)
          .map(String)
      ),
    ];

    const Task = mongoose.models.Task;

    let taskMap = new Map();

    if (taskIds.length > 0) {
      const tasks = await Task.find({
        _id: {
          $in: taskIds,
        },
      }).lean();

      taskMap = new Map(
        tasks.map((task) => [
          String(task._id),
          task,
        ])
      );
    }

    // =====================================================
    // PROCESS NEW SESSIONS
    // =====================================================

    for (const session of newSessions) {
      let reservationCreated = false;

      try {
        // -----------------------------------------------
        // ATOMIC IDEMPOTENCY RESERVATION
        // -----------------------------------------------

        try {
          await ProcessedSession.create({
            sessionId: session.id,
            employeeCode:
              employee.employeeCode,
          });

          reservationCreated = true;
        } catch (dupErr) {
          if (dupErr.code === 11000) {
            // Another request processed/reserved this
            // session after our batch lookup.
            processedIds.push(
              session.id
            );

            continue;
          }

          throw dupErr;
        }

        const today =
          getISTDateBucket(
            new Date(
              session.startTime
            )
          );

        const summaryTaskId =
          session.taskId ||
          employee.currentTaskId ||
          null;

        const taskKey =
          summaryTaskId
            ? String(summaryTaskId)
            : null;

        const activeTask =
          taskKey
            ? taskMap.get(taskKey) ||
              null
            : null;

        const summaryTaskCode =
          session.taskCode ||
          employee.currentTaskCode ||
          "";

        const summaryTaskTitle =
          session.taskTitle ||
          employee.currentTaskTitle ||
          "";

        const summaryTaskStatus =
          session.taskStatus ||
          activeTask?.status ||
          "";

        // -----------------------------------------------
        // DAILY SUMMARY
        // -----------------------------------------------

        await AgentDailySummary.findOneAndUpdate(
          {
            employeeCode:
              employee.employeeCode,

            application:
              session.application,

            date: today,

            taskId:
              summaryTaskId,
          },
          {
            $set: {
              employeeId:
                employee._id,

              employeeName:
                employee.name,

              pcName:
                pcName || "",

              lastWindowTitle:
                session.windowTitle ||
                "",

              project:
                session.project ||
                employee.currentProject ||
                "",

              client:
                session.client ||
                employee.currentClient ||
                "",

              category:
                session.category ||
                "Other",

              activity:
                session.activity ||
                "",

              taskId:
                summaryTaskId,

              taskCode:
                summaryTaskCode,

              taskTitle:
                summaryTaskTitle,

              taskStatus:
                summaryTaskStatus,

              ticketId:
                activeTask?.ticketId ||
                null,

              ticketCode:
                activeTask?.ticketCode ||
                "",

              lastSeen:
                new Date(
                  session.endTime
                ),
            },

            $setOnInsert: {
              firstSeen:
                new Date(
                  session.startTime
                ),
            },

            $inc: {
              totalSeconds:
                Number(
                  session.durationSeconds
                ),

              sessionCount: 1,
            },
          },
       {
  upsert: true,
  returnDocument: "after",
}
        );

        processedIds.push(
          session.id
        );
      } catch (sessionErr) {
        console.error(
          `Failed session [${session.application} | ${session.windowTitle}]:`,
          sessionErr.message
        );

        // =================================================
        // CRITICAL:
        // Summary failed after reservation.
        //
        // Remove reservation so the agent can retry later.
        // Otherwise the session would be considered processed
        // even though its summary was never updated.
        // =================================================

        if (reservationCreated) {
          try {
            await ProcessedSession.deleteOne({
              sessionId:
                session.id,
            });
          } catch (cleanupErr) {
            console.error(
              "Processed-session cleanup failed:",
              session.id,
              cleanupErr.message
            );
          }
        }

        failed.push({
          id: session.id,

          application:
            session.application,

          error:
            sessionErr.message,
        });
      }
    }

    // =====================================================
    // RESPONSE
    // =====================================================
    console.log(
  `[AGENT EVENTS] ${employee.employeeCode} | PC: ${pcName || "Unknown"} | Received: ${sessions.length} | Processed: ${processedIds.length} | Failed: ${failed.length}`
);
    return res.json({
      success: true,

      processed:
        processedIds.length,

      processedIds:
        [...new Set(processedIds)],

      failed,
    });

  } catch (error) {
    console.error(
      "Agent events error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});
app.post("/api/agent/register", async (req, res) => {
  try {
    const {
      employeeCode,
      pcName,
      deviceId,
      deviceName,
      platform,
      appVersion,
    } = req.body;

    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (!employeeCode || !deviceId) {
      return res.status(400).json({
        success: false,
        message:
          "employeeCode and deviceId are required.",
      });
    }

    const normalizedEmployeeCode =
      employeeCode.toUpperCase().trim();

    // =====================================================
    // VERIFY EMPLOYEE
    // =====================================================

    const employee = await Employee.findOne({
      employeeCode: normalizedEmployeeCode,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // =====================================================
    // CHECK WHETHER DEVICE ALREADY EXISTS
    // =====================================================

    let device = await AgentDevice.findOne({
      deviceId,
    });

    // =====================================================
    // EXISTING DEVICE
    // =====================================================

    if (device) {
      /*
       * SECURITY:
       *
       * A registered device cannot silently move from one
       * employee to another employee.
       */

      if (
        device.employeeCode &&
        device.employeeCode.toUpperCase() !==
          normalizedEmployeeCode
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This device is already registered to another employee.",
        });
      }

      /*
       * Keep the SAME token whenever possible.
       *
       * Do not create a new identity every time the
       * Windows agent restarts.
       */

      if (!device.token) {
        device.token =
          crypto.randomBytes(32).toString("hex");
      }

      device.employeeCode =
        normalizedEmployeeCode;

      device.pcName =
        pcName || device.pcName || "";

      device.deviceName =
        deviceName ||
        pcName ||
        device.deviceName ||
        "";

      device.platform =
        platform ||
        device.platform ||
        "windows";

      device.appVersion =
        appVersion ||
        device.appVersion ||
        "1.0.0";

      device.lastSeen = new Date();

      /*
       * IMPORTANT:
       *
       * DO NOT modify:
       *
       * device.isApproved
       * device.approvedBy
       * device.approvedAt
       * device.approvalNote
       *
       * Registration must never approve itself.
       */

      await device.save();

      return res.json({
        success: true,

        deviceToken:
          device.token,

        deviceId:
          device.deviceId,

        employeeCode:
          device.employeeCode,

        isApproved:
          device.isApproved === true,

        deviceStatus:
          device.isApproved === true
            ? "approved"
            : "pending",

        message:
          device.isApproved === true
            ? "Device registered and approved."
            : "Device registered. Waiting for admin approval.",
      });
    }

    // =====================================================
    // NEW / UNKNOWN DEVICE
    // =====================================================

    const token =
      crypto.randomBytes(32).toString("hex");

    /*
     * SECURITY:
     *
     * Every NEW device starts UNAPPROVED.
     *
     * Installing the Windows agent must NOT automatically
     * make a computer trusted.
     */

    device = await AgentDevice.create({
      deviceId,

      employeeCode:
        normalizedEmployeeCode,

      pcName:
        pcName || "",

      deviceName:
        deviceName ||
        pcName ||
        "",

      platform:
        platform ||
        "windows",

      appVersion:
        appVersion ||
        "1.0.0",

      token,

      lastSeen:
        new Date(),

      isActive:
        true,

      // NEW DEVICE IS NEVER AUTO-APPROVED
      isApproved:
        false,

      approvedBy:
        null,

      approvedAt:
        null,

      approvalNote:
        "",
    });

    return res.status(201).json({
      success: true,

      deviceToken:
        device.token,

      deviceId:
        device.deviceId,

      employeeCode:
        device.employeeCode,

      isApproved:
        false,

      deviceStatus:
        "pending",

      message:
        "New device registered. Waiting for admin approval.",
    });
  } catch (error) {
    console.error(
      "Agent registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Registration failed.",
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

      if (diffSeconds <= 180) {
        status = "Working";
      } else if (diffSeconds <= 360) {
        status = "Idle";
      }

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
const AttendanceV2 =
  mongoose.models.AttendanceV2;

app.post(
  "/api/agent/heartbeat",
  authenticateAgent,
  async (req, res) => {
  try {
 const {
  pcName,
  status,
  application,
  task,
  timestamp,
} = req.body;

// Employee identity comes from authenticated device,
// never from request body.
const employeeCode =
  req.agentDevice.employeeCode;

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
    
// =====================================================
// WORKDAY SAFETY GUARD
// =====================================================

const today =
  getISTDateString(now);

const todayAttendance =
  AttendanceV2
    ? await AttendanceV2.findOne({
        employeeId:
          employee._id,

        date:
          today,

        isDeleted: {
          $ne: true,
        },
      }).lean()
    : null;

/*
 * Heartbeat is useful only while today's
 * workday is open.
 *
 * Normal CRM logout does NOT set attendance
 * logoutTime, so tracking continues normally.
 *
 * End Workday DOES set logoutTime, therefore
 * subsequent heartbeats cannot bring the
 * employee back to Working/Free.
 */

if (
  !todayAttendance ||
  !todayAttendance.loginTime ||
  todayAttendance.logoutTime
) {
  employee.status =
    "Offline";

  employee.lastActivityAt =
    now;

  await employee.save();

  await AgentDevice.updateOne(
    {
      employeeCode:
        employee.employeeCode,

      pcName,
    },
    {
      $set: {
        lastSeen:
          now,

        updatedAt:
          now,

        isActive:
          true,

        application:
          application || "",

        status:
          "Offline",
      },
    }
  );

  console.log(
    `[AGENT GUARD] ${employee.employeeCode} heartbeat ignored — workday is not active`
  );

  return res.json({
    success: true,

    workdayActive:
      false,

    message:
      "Workday is not active. Heartbeat ignored.",

    serverTime:
      now,

    currentTask:
      null,
  });
}

    // Recalculate status from actual work
    const Task = mongoose.models.Task;
    const SupportTicket = mongoose.models.SupportTicket;

    const hasActiveTask = await Task.exists({
      assignedEmployeeId: employee._id,
      isDeleted: false,
      status: { $in: ["Assigned", "In Progress", "Paused", "Testing"] },
    });

    const hasActiveTicket = await SupportTicket.exists({
      assignedEmployeeId: employee._id,
      isDeleted: false,
      status: { $in: ["New", "Assigned", "In Progress"] },
    });

    if (status === "Offline") {
      employee.status = "Offline";
    } else if (status === "Break") {
      employee.status = "Break";
    } else {
      employee.status = hasActiveTask || hasActiveTicket ? "Working" : "Free";
    }

    employee.lastActivityAt = now;

    if (task) {
      employee.currentTask = task;
    } else if (employee.status === "Free") {
      employee.currentTask = "Available for assignment";
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

    let currentTaskData = null;

    if (employee.currentTaskId) {
      const currentTaskRecord = await Task.findById(
        employee.currentTaskId
      ).lean();

      if (currentTaskRecord) {
        currentTaskData = currentTaskRecord;
      }
    }

    return res.json({
      success: true,
      serverTime: now,
      currentTask: currentTaskData,
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