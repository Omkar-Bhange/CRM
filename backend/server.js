const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

/* =========================================================
   ROUTES
========================================================= */

const authRoutes = require("./auth");
const adminRoutes = require("./admin");
const employeeRoutes = require("./employee");
const clientRoutes = require("./client");
const settingsRoutes = require("./settings");
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
  "/api/client",
  clientRoutes
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