const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      employeeCode: user.employeeCode || "",

      clientId:
        user.clientId || null,

      clientCode:
        user.clientCode || "",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

/* =========================================================
   AUTHENTICATION MIDDLEWARE
   ========================================================= */

async function authenticateUser(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const token = authorizationHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account was not found.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status.toLowerCase()}.`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your login session has expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    next(error);
  }
}

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

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
  id: user._id,
  name: user.name,
  email: user.email,
  employeeCode: user.employeeCode || "",
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
module.exports.authenticateUser = authenticateUser;
module.exports.User = User;