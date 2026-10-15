const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const authenticateUser = require("./authMiddleware");

const router = express.Router();

/* =========================================================
   AUTHENTICATION REQUIRED FOR ALL UPLOADS
   Supports:
   1. Standard `Authorization: Bearer <token>` header
   2. URL query parameter `?token=<token>` or `?auth_token=<token>`
      (Essential for browser direct links, PDFs in new tabs, and <img> tags)
========================================================= */
router.use(authenticateUser);

const uploadsRoot = path.resolve(__dirname, "uploads");

router.use(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }
  try {
    /* =====================================================
       1. PATH NORMALIZATION & TRAVERSAL PREVENTION
    ===================================================== */
    let decodedPath = req.path;
    try {
      // Decode iteratively (up to 3 passes) to prevent nested/double URL encoding bypasses
      for (let i = 0; i < 3; i++) {
        const next = decodeURIComponent(decodedPath);
        if (next === decodedPath) break;
        decodedPath = next;
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: "Malformed URL encoding.",
      });
    }

    // Reject null bytes or other dangerous control characters
    if (decodedPath.includes("\0")) {
      return res.status(403).json({
        success: false,
        code: "ACCESS_DENIED",
        message: "Null byte detected.",
      });
    }

    const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, "");
    const absolutePath = path.resolve(uploadsRoot, "." + safePath);

    const relativeFromUploads = path.relative(uploadsRoot, absolutePath);

    // Verify absolutePath is strictly contained inside uploadsRoot and not uploadsRoot itself
    if (
      !absolutePath.startsWith(uploadsRoot) ||
      relativeFromUploads.startsWith("..") ||
      path.isAbsolute(relativeFromUploads) ||
      absolutePath === uploadsRoot
    ) {
      return res.status(403).json({
        success: false,
        code: "ACCESS_DENIED",
        message: "Path traversal detected.",
      });
    }

    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
      return res.status(404).json({
        success: false,
        code: "FILE_NOT_FOUND",
        message: "Requested file not found.",
      });
    }

    /* =====================================================
       2. CANONICAL PATH MAPPING & STRUCTURE VALIDATION
    ===================================================== */
    const segments = relativeFromUploads.split(path.sep).filter(Boolean);
    if (segments.length !== 2) {
      return res.status(403).json({
        success: false,
        code: "ACCESS_DENIED",
        message: "Direct file access outside upload categories is not permitted.",
      });
    }

    const [folder, filename] = segments;
    const canonicalRelative = `${folder}/${filename}`;

    // Exact candidate relative path variants that represent this physical file
    const candidatePaths = [
      `/uploads/${canonicalRelative}`,
      `uploads/${canonicalRelative}`,
      `/${canonicalRelative}`,
      canonicalRelative,
      `uploads\\${folder}\\${filename}`,
      `${folder}\\${filename}`,
      `\\uploads\\${folder}\\${filename}`,
      filename,
    ];

    /* =====================================================
       3. ROLE & OWNERSHIP AUTHORIZATION (EXACT MATCHING)
    ===================================================== */
    const user = req.user;
    let isAuthorized = false;

    // Admin has full authorized access to all uploaded files
    if (user.role === "admin") {
      isAuthorized = true;
    } else if (user.role === "employee") {
      // Employees have access to task files and support ticket files
      if (folder === "tasks" || folder === "tickets") {
        isAuthorized = true;
      } else {
        // For AMC, documents, or quotations: allow if employee is active staff
        isAuthorized = true;
      }
    } else if (user.role === "client") {
      // Clients may ONLY access files belonging to their clientId or clientCode
      const clientId = user.clientId || user._id;
      const clientFilter = {
        $or: [
          { clientId: clientId },
          ...(user.clientCode ? [{ clientCode: user.clientCode }] : []),
        ],
      };

      if (folder === "tickets") {
        const SupportTicket = mongoose.models.SupportTicket;
        if (SupportTicket) {
          const ticket = await SupportTicket.findOne({
            ...clientFilter,
            isDeleted: { $ne: true },
            "attachments.fileUrl": { $in: candidatePaths },
          }).lean();
          if (ticket) isAuthorized = true;
        }
      } else if (folder === "documents") {
        const ClientDocument = mongoose.models.ClientDocument;
        if (ClientDocument) {
          const doc = await ClientDocument.findOne({
            ...clientFilter,
            isDeleted: { $ne: true },
            fileUrl: { $in: candidatePaths },
          }).lean();
          if (doc) isAuthorized = true;
        }
      } else if (folder === "amc") {
        const AmcContract = mongoose.models.AmcContract;
        if (AmcContract) {
          const contract = await AmcContract.findOne({
            clientId: clientId,
            isDeleted: { $ne: true },
            $or: [
              { "documents.relativePath": { $in: candidatePaths } },
              { "documents.storedFileName": filename },
            ],
          }).lean();
          if (contract) isAuthorized = true;
        }
      } else if (folder === "quotations") {
        const ClientAmcRequest = mongoose.models.ClientAmcRequest;
        if (ClientAmcRequest) {
          const reqDoc = await ClientAmcRequest.findOne({
            clientId: clientId,
            isDeleted: { $ne: true },
            "quotationDocument.fileUrl": { $in: candidatePaths },
          }).lean();
          if (reqDoc) isAuthorized = true;
        }
      } else if (folder === "tasks") {
        const Task = mongoose.models.Task;
        if (Task) {
          const task = await Task.findOne({
            clientId: clientId,
            isDeleted: { $ne: true },
            "attachments.fileUrl": { $in: candidatePaths },
          }).lean();
          if (task) isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You do not have permission to access this file.",
      });
    }

    /* =====================================================
       4. SECURITY HEADERS & FILE TRANSMISSION
    ===================================================== */
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-transform, max-age=3600");

    const disposition =
      req.query.download === "true" || req.query.download === "1"
        ? "attachment"
        : "inline";

    const safeDownloadName = String(filename).replace(/["\r\n]/g, "_");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${encodeURIComponent(safeDownloadName)}"`
    );

    return res.sendFile(absolutePath);
  } catch (error) {
    console.error("Secure file serve error:", error);
    return res.status(500).json({
      success: false,
      code: "FILE_ERROR",
      message: "Unable to serve requested file.",
    });
  }
});

module.exports = router;
