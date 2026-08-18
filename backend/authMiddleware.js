const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const AuthSession = require("./models/AuthSession");

/* =========================================================
   AUTHENTICATE USER

   Supports:
   1. Existing legacy JWT tokens
   2. New session-based JWT tokens containing `sid`

   This backward compatibility is intentional so Stage 1
   does NOT break users who already have an existing token.
========================================================= */

async function authenticateUser(req, res, next) {
  try {
    /* =====================================================
       1. READ AUTHORIZATION HEADER
    ===================================================== */

    const authHeader =
      req.headers.authorization || "";

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication required.",
      });
    }

    const token = authHeader
      .slice(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication required.",
      });
    }

    /* =====================================================
       2. VERIFY JWT
    ===================================================== */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid authentication token.",
      });
    }

    /* =====================================================
       3. GET USER MODEL

       auth.js registers the User mongoose model.
    ===================================================== */

    const User =
      mongoose.models.User;

    if (!User) {
      console.error(
        "Authentication error: User model is not initialized."
      );

      return res.status(500).json({
        success: false,
        code: "AUTH_CONFIGURATION_ERROR",
        message:
          "Authentication service is unavailable.",
      });
    }

    /* =====================================================
       4. LOAD CURRENT USER

       Never trust role/status information only from JWT.
       MongoDB remains the source of truth.
    ===================================================== */

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message:
          "Your account no longer exists.",
      });
    }

    /* =====================================================
       5. VERIFY ACCOUNT STATUS

       Previously, a Blocked or Inactive user could keep
       using an already-issued JWT until its expiry.
    ===================================================== */

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message:
          user.status === "Blocked"
            ? "Your account has been blocked. Please contact the administrator."
            : "Your account is inactive. Please contact the administrator.",
      });
    }

    /* =====================================================
       6. PASSWORD CHANGE INVALIDATION

       Existing JWTs contain `iat` automatically.

       If the password was changed AFTER this JWT was issued,
       reject this token.
    ===================================================== */

    if (
      user.passwordChangedAt &&
      decoded.iat
    ) {
      const passwordChangedAt =
        new Date(
          user.passwordChangedAt
        ).getTime();

      const tokenIssuedAt =
        Number(decoded.iat) *
        1000;

      /*
       A small one-second tolerance prevents accidental
       rejection from timestamp precision differences.
      */
      if (
        tokenIssuedAt <
        passwordChangedAt - 1000
      ) {
        return res.status(401).json({
          success: false,
          code: "PASSWORD_CHANGED",
          message:
            "Your password has changed. Please sign in again.",
        });
      }
    }

    /* =====================================================
       7. SESSION VALIDATION

       IMPORTANT FOR MIGRATION:

       Old JWT:
       {
         userId,
         role,
         ...
       }

       New JWT (Stage 2):
       {
         userId,
         role,
         sid,
         ...
       }

       We check MongoDB session ONLY when `sid` exists.

       Therefore your CURRENT LOGIN keeps working during
       Stage 1.
    ===================================================== */

    if (decoded.sid) {
      const session =
        await AuthSession.findOne({
          sessionId:
            String(decoded.sid),

          userId:
            user._id,
        }).lean();

      if (!session) {
        return res.status(401).json({
          success: false,
          code: "SESSION_NOT_FOUND",
          message:
            "Your session is no longer valid. Please sign in again.",
        });
      }

      if (session.revokedAt) {
        return res.status(401).json({
          success: false,
          code: "SESSION_REVOKED",
          message:
            "Your session has ended. Please sign in again.",
        });
      }

      if (
        !session.expiresAt ||
        new Date(
          session.expiresAt
        ).getTime() <= Date.now()
      ) {
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message:
            "Your session has expired. Please sign in again.",
        });
      }

      /*
       Make session data available to APIs such as logout.
      */
      req.authSession =
        session;
    } else {
      /*
       Legacy token.

       This exists ONLY so current users keep working while
       we migrate the project to the new session system.
      */
      req.authSession =
        null;
    }

    /* =====================================================
       8. ATTACH AUTHENTICATED DATA
    ===================================================== */

    req.user =
      user;

    req.auth = {
      userId:
        String(user._id),

      role:
        user.role,

      sessionId:
        decoded.sid || null,

      tokenIssuedAt:
        decoded.iat || null,

      tokenExpiresAt:
        decoded.exp || null,

      legacyToken:
        !decoded.sid,
    };

    return next();
  } catch (error) {
    /* =====================================================
       JWT EXPIRED
    ===================================================== */

    if (
      error?.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message:
          "Your authentication token has expired.",
      });
    }

    /* =====================================================
       INVALID JWT
    ===================================================== */

    if (
      error?.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message:
          "Invalid authentication token.",
      });
    }

    if (
      error?.name ===
      "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_NOT_ACTIVE",
        message:
          "Authentication token is not active yet.",
      });
    }

    console.error(
      "Authentication middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "AUTH_ERROR",
      message:
        "Unable to verify authentication.",
    });
  }
}

module.exports =
  authenticateUser;