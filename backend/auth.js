const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticateUser = require("./authMiddleware");
const crypto = require("crypto");
const AuthSession = require("./models/AuthSession");

const router = express.Router();

/* =========================================================
   USER SCHEMA
   Admin, Employee and Client use the same users collection
   ========================================================= */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    employeeCode: {
  type: String,
  default: "",
  trim: true,
  uppercase: true,
  index: true,
},

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "employee", "client"],
      required: true,
      lowercase: true,
    },
    clientId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Client",
  default: null,
  index: true,
},

clientCode: {
  type: String,
  default: "",
  trim: true,
  uppercase: true,
},

companyName: {
  type: String,
  default: "",
  trim: true,
},

mobile: {
  type: String,
  default: "",
  trim: true,
},

mustChangePassword: {
  type: Boolean,
  default: false,
},

passwordChangedAt: {
  type: Date,
  default: null,
},

    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked"],
      default: "Active",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

const User =
  mongoose.models.User || mongoose.model("User", userSchema);
 



/* =========================================================
   TOKEN GENERATOR
   ========================================================= */

/* =========================================================
   AUTH TOKEN + SESSION HELPERS
========================================================= */

const ACCESS_TOKEN_EXPIRES_IN = "30m";
const REFRESH_SESSION_DAYS = 7;

/*
  Kept only for backward compatibility with the
  first-admin registration API during this migration.

  Normal /login now uses session-based access tokens.
*/
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      employeeCode: user.employeeCode || "",
      clientId: user.clientId || null,
      clientCode: user.clientCode || "",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

/* =========================================================
   ACCESS TOKEN

   Short-lived JWT used for normal API requests.
========================================================= */

function generateAccessToken(
  user,
  sessionId
) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,

      employeeCode:
        user.employeeCode || "",

      clientId:
        user.clientId || null,

      clientCode:
        user.clientCode || "",

      /*
        sid connects this JWT with the MongoDB AuthSession.
      */
      sid: sessionId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        ACCESS_TOKEN_EXPIRES_IN,
    }
  );
}

/* =========================================================
   REFRESH TOKEN

   Refresh token is an opaque random secret.

   It is NOT a JWT and the raw value must never be stored
   in MongoDB.
========================================================= */

function generateRefreshToken() {
  return crypto
    .randomBytes(48)
    .toString("hex");
}

/* =========================================================
   REFRESH TOKEN HASH

   MongoDB stores only this hash.
========================================================= */

function hashRefreshToken(
  refreshToken
) {
  return crypto
    .createHash("sha256")
    .update(
      String(refreshToken)
    )
    .digest("hex");
}

/* =========================================================
   SESSION ID
========================================================= */

function generateSessionId() {
  return crypto.randomUUID();
}

/* =========================================================
   SESSION EXPIRY
========================================================= */

function createSessionExpiry() {
  return new Date(
    Date.now() +
      REFRESH_SESSION_DAYS *
        24 *
        60 *
        60 *
        1000
  );
}

/* =========================================================
   CLIENT IP
========================================================= */

function getRequestIp(req) {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded)
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    ""
  );
}

/* =========================================================
   CREATE AUTH SESSION
========================================================= */

async function createAuthSession(
  user,
  req
) {
  const sessionId =
    generateSessionId();

  const refreshToken =
    generateRefreshToken();

  const refreshTokenHash =
    hashRefreshToken(
      refreshToken
    );

  const expiresAt =
    createSessionExpiry();

  await AuthSession.create({
    userId:
      user._id,

    sessionId,

    refreshTokenHash,

    userAgent:
      String(
        req.headers[
          "user-agent"
        ] || ""
      ).slice(0, 500),

    ipAddress:
      getRequestIp(req),

    lastUsedAt:
      new Date(),

    expiresAt,
  });

  const accessToken =
    generateAccessToken(
      user,
      sessionId
    );

  return {
    sessionId,
    accessToken,
    refreshToken,
    expiresAt,
  };
}


/* =========================================================
   AUTHENTICATION MIDDLEWARE


/* =========================================================
   REGISTER FIRST ADMIN

   This API works only when no admin exists.
   POST /api/auth/register-admin
   ========================================================= */

router.post("/register-admin", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "An administrator already exists. New administrators must be created by an existing administrator.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      String(password),
      12
    );

    const admin = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
      status: "Active",
    });

    const token = generateToken(admin);

    return res.status(201).json({
      success: true,
      message: "Administrator created successfully.",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    next(error);
  }
});

/* =========================================================
   LOGIN

   POST /api/auth/login
   ========================================================= */

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required.",
      });
    }

    const normalizedRole = String(role)
      .trim()
      .toLowerCase();

    if (
      !["admin", "employee", "client"].includes(
        normalizedRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid role.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.role !== normalizedRole) {
      return res.status(403).json({
        success: false,
        message: `This account is registered as ${user.role}, not ${normalizedRole}.`,
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status.toLowerCase()}. Please contact the administrator.`,
      });
    }

   user.lastLoginAt =
  new Date();

await user.save();

/*
  Create one server-side session for this browser/device.
*/
const authSession =
  await createAuthSession(
    user,
    req
  );

/*
  Keep the variable name `token`
  because your CURRENT frontend expects result.token.

  token = short-lived access token.
*/
const token =
  authSession.accessToken;
  /*
=========================================================
RESOLVE EMPLOYEE CODE

Employee users may have their actual employeeCode
inside the employees collection rather than users.
=========================================================
*/

let loginEmployeeCode =
  user.employeeCode || "";

if (
  user.role === "employee"
) {
  const Employee =
    mongoose.models.Employee;

  if (Employee) {
    const employee =
      await Employee.findOne({
        userId: user._id,
      })
        .select(
          "employeeCode"
        )
        .lean();

    if (
      employee?.employeeCode
    ) {
      loginEmployeeCode =
        String(
          employee.employeeCode
        )
          .trim()
          .toUpperCase();
    }
  }
}
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      /*
  New explicit name used by Stage 3 frontend.
*/
accessToken:
  token,

refreshToken:
  authSession.refreshToken,

session: {
  id:
    authSession.sessionId,

  expiresAt:
    authSession.expiresAt,
},
      user: {
  id: user._id,
  name: user.name,
  email: user.email,
 employeeCode: loginEmployeeCode,
  role: user.role,
  status: user.status,

  clientId:
    user.clientId || null,

  clientCode:
    user.clientCode || "",

  companyName:
    user.companyName || "",

  mobile:
    user.mobile || "",

  mustChangePassword:
    Boolean(
      user.mustChangePassword
    ),

  lastLoginAt:
    user.lastLoginAt,
},
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   REFRESH ACCESS TOKEN

   POST /api/auth/refresh

   Body:
   {
     refreshToken
   }

   Refresh-token rotation is used:
   old refresh token -> invalid
   new refresh token -> saved
========================================================= */

router.post(
  "/refresh",
  async (req, res, next) => {
    try {
      const {
        refreshToken,
      } = req.body;

      if (!refreshToken) {
        return res
          .status(401)
          .json({
            success: false,
            code:
              "REFRESH_TOKEN_REQUIRED",
            message:
              "Refresh token is required.",
          });
      }

      const refreshTokenHash =
        hashRefreshToken(
          refreshToken
        );

      /*
        refreshTokenHash has select:false in the schema,
        so explicitly request it here.
      */
      const session =
        await AuthSession.findOne({
          refreshTokenHash,
        }).select(
          "+refreshTokenHash"
        );

      if (!session) {
        return res
          .status(401)
          .json({
            success: false,
            code:
              "INVALID_REFRESH_TOKEN",
            message:
              "Your session is invalid. Please sign in again.",
          });
      }

      if (
        session.revokedAt
      ) {
        return res
          .status(401)
          .json({
            success: false,
            code:
              "SESSION_REVOKED",
            message:
              "Your session has ended. Please sign in again.",
          });
      }

      if (
        !session.expiresAt ||
        session.expiresAt.getTime() <=
          Date.now()
      ) {
        return res
          .status(401)
          .json({
            success: false,
            code:
              "SESSION_EXPIRED",
            message:
              "Your session has expired. Please sign in again.",
          });
      }

      const user =
        await User.findById(
          session.userId
        );

      if (!user) {
        session.revokedAt =
          new Date();

        session.revokedReason =
          "User account not found";

        await session.save();

        return res
          .status(401)
          .json({
            success: false,
            code:
              "USER_NOT_FOUND",
            message:
              "Your account no longer exists.",
          });
      }

      if (
        user.status !==
        "Active"
      ) {
        session.revokedAt =
          new Date();

        session.revokedReason =
          `Account ${user.status}`;

        await session.save();

        return res
          .status(403)
          .json({
            success: false,
            code:
              "ACCOUNT_DISABLED",
            message:
              "Your account is not active. Please contact the administrator.",
          });
      }

      /*
        ROTATE REFRESH TOKEN

        The token presented by the browser becomes invalid
        immediately after successful refresh.
      */
      const newRefreshToken =
        generateRefreshToken();

      session.refreshTokenHash =
        hashRefreshToken(
          newRefreshToken
        );

      session.lastUsedAt =
        new Date();

      /*
        Do NOT extend expiresAt here.

        The session has a fixed seven-day maximum life
        measured from login.
      */
      await session.save();

      const accessToken =
        generateAccessToken(
          user,
          session.sessionId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Session refreshed successfully.",

          token:
            accessToken,

          accessToken,

          refreshToken:
            newRefreshToken,

          session: {
            id:
              session.sessionId,

            expiresAt:
              session.expiresAt,
          },
        });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   LOGOUT CURRENT SESSION

   POST /api/auth/logout

   Body:
   {
     refreshToken
   }

   This deliberately affects ONLY authentication.
   It does NOT end employee attendance/workday.
========================================================= */

router.post(
  "/logout",
  async (req, res, next) => {
    try {
      const {
        refreshToken,
      } = req.body || {};

      /*
        Logout should be idempotent.

        If the frontend has already lost the refresh token,
        we still return success because its local credentials
        can simply be cleared.
      */
      if (!refreshToken) {
        return res
          .status(200)
          .json({
            success: true,
            message:
              "Logged out successfully.",
          });
      }

      const refreshTokenHash =
        hashRefreshToken(
          refreshToken
        );

      await AuthSession.findOneAndUpdate(
        {
          refreshTokenHash,
          revokedAt: null,
        },
        {
          $set: {
            revokedAt:
              new Date(),

            revokedReason:
              "User logout",
          },
        }
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Logged out successfully.",
        });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   LOGOUT FROM ALL DEVICES

   POST /api/auth/logout-all
========================================================= */

router.post(
  "/logout-all",
  authenticateUser,
  async (req, res, next) => {
    try {
      await AuthSession.updateMany(
        {
          userId:
            req.user._id,

          revokedAt:
            null,
        },
        {
          $set: {
            revokedAt:
              new Date(),

            revokedReason:
              "Logout from all devices",
          },
        }
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "All sessions have been signed out successfully.",
        });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   CURRENT USER

   GET /api/auth/me
   ========================================================= */

router.get(
  "/me",
  authenticateUser,
  async (req, res) => {
    return res.status(200).json({
      success: true,

      user: {
        id:
          req.user._id,

        name:
          req.user.name,

        email:
          req.user.email,
          employeeCode: req.user.employeeCode || "",

        role:
          req.user.role,

        status:
          req.user.status,

        clientId:
          req.user.clientId ||
          null,

        clientCode:
          req.user.clientCode ||
          "",

        companyName:
          req.user.companyName ||
          "",

        mobile:
          req.user.mobile ||
          "",

        mustChangePassword:
          Boolean(
            req.user
              .mustChangePassword
          ),

        lastLoginAt:
          req.user.lastLoginAt,

        createdAt:
          req.user.createdAt,
      },
    });
  }
);

/* =========================================================
   CHANGE PASSWORD
   POST /api/auth/change-password
========================================================= */

router.post(
  "/change-password",
  authenticateUser,
  async (req, res, next) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Current password and new password are required.",
          });
      }

      if (
        String(newPassword).length <
        6
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "New password must contain at least 6 characters.",
          });
      }

      const user =
        await User.findById(
          req.user._id
        ).select("+password");

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "User account was not found.",
          });
      }

      const passwordMatches =
        await bcrypt.compare(
          String(
            currentPassword
          ),
          user.password
        );

      if (!passwordMatches) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Current password is incorrect.",
          });
      }

      const samePassword =
        await bcrypt.compare(
          String(newPassword),
          user.password
        );

      if (samePassword) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "New password must be different from the current password.",
          });
      }

      user.password =
        await bcrypt.hash(
          String(newPassword),
          12
        );

      user.mustChangePassword =
        false;

user.passwordChangedAt =
  new Date();

await user.save();

/*
  Security rule:

  Password change invalidates every active login session.

  User must sign in again using the new password.
*/
await AuthSession.updateMany(
  {
    userId:
      user._id,

    revokedAt:
      null,
  },
  {
    $set: {
      revokedAt:
        new Date(),

      revokedReason:
        "Password changed",
    },
  }
);

return res
        .status(200)
        .json({
          success: true,
          message:
            "Password changed successfully.",
        });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   TEST ROUTE
   ========================================================= */

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication API is working.",
  });
});
module.exports = router;
module.exports.User = User;
module.exports.authenticateUser = authenticateUser;