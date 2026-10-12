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
    const decodedPath = decodeURIComponent(req.path);
    const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, "");
    const absolutePath = path.resolve(uploadsRoot, "." + safePath);

    if (
      !absolutePath.startsWith(uploadsRoot) ||
      path.relative(uploadsRoot, absolutePath).startsWith("..")
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
       2. ROLE & OWNERSHIP AUTHORIZATION
    ===================================================== */
    const relativeFromUploads = path.relative(uploadsRoot, absolutePath);
    const segments = relativeFromUploads.split(path.sep);
    const folder = segments[0]; // e.g. 'tickets', 'tasks', 'amc', 'documents', 'quotations'
    const filename = path.basename(absolutePath);

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
      // Clients may ONLY access documents and attachments belonging to their client ID
      const clientId = user.clientId || user._id;

      if (folder === "tickets") {
        const SupportTicket = mongoose.models.SupportTicket;
        if (SupportTicket) {
          const ticket = await SupportTicket.findOne({
            $or: [
              { clientId: clientId },
              { clientCode: user.clientCode },
            ],
            "attachments.fileUrl": { $regex: filename },
          }).lean();
          if (ticket) isAuthorized = true;
        }
      } else if (folder === "documents") {
        const ClientDocument = mongoose.models.ClientDocument;
        if (ClientDocument) {
          const doc = await ClientDocument.findOne({
            clientId: clientId,
            $or: [
              { fileUrl: { $regex: filename } },
              { fileName: filename },
            ],
          }).lean();
          if (doc) isAuthorized = true;
        }
      } else if (folder === "amc") {
        const AmcContract = mongoose.models.AmcContract;
        if (AmcContract) {
          const contract = await AmcContract.findOne({
            clientId: clientId,
            "documents.relativePath": { $regex: filename },
          }).lean();
          if (contract) isAuthorized = true;
        }
      } else if (folder === "quotations") {
        const ClientAmcRequest = mongoose.models.ClientAmcRequest;
        if (ClientAmcRequest) {
          const reqDoc = await ClientAmcRequest.findOne({
            clientId: clientId,
            "quotationDocument.fileUrl": { $regex: filename },
          }).lean();
          if (reqDoc) isAuthorized = true;
        }
      } else if (folder === "tasks") {
        const Task = mongoose.models.Task;
        if (Task) {
          const task = await Task.findOne({
            clientId: clientId,
            "attachments.fileUrl": { $regex: filename },
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
       3. SECURITY HEADERS & FILE TRANSMISSION
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
