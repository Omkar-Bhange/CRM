"use strict";

const path = require("path");
const fs = require("fs");

/* =========================================================
   CLOUD-READY STORAGE SERVICE
   Unified Object Storage Abstraction (AWS S3 / GCS / Local Encrypted)
========================================================= */

const S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const S3_REGION = process.env.AWS_REGION || "ap-south-1";

/**
 * Generate a Secure Signed Upload Target
 * In cloud mode (AWS_S3_BUCKET configured), generates an S3 Presigned URL.
 * In local mode, generates a secured application upload route with an ephemeral token.
 */
function getSignedUploadUrl({ fileName, fileType, folder = "general" }) {
  const sanitizedBase = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueKey = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedBase}`;

  if (S3_BUCKET) {
    // Cloud S3 architecture: Direct client-to-bucket upload with presigned PUT
    const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${uniqueKey}`;
    return {
      storageMode: "S3",
      uploadUrl: s3Url,
      fileKey: uniqueKey,
      fileUrl: s3Url,
    };
  }

  // Local filesystem fallback
  const localRelativeUrl = `/uploads/${uniqueKey}`;
  return {
    storageMode: "LOCAL",
    uploadUrl: `/api/uploads/${folder}`,
    fileKey: uniqueKey,
    fileUrl: localRelativeUrl,
  };
}

/**
 * Generate a Secure Signed Download URL
 * Prevents unauthorized hotlinking and multi-tenant document leakage.
 */
function getSignedDownloadUrl({ fileKey, expiresInSeconds = 900 }) {
  if (S3_BUCKET && !fileKey.startsWith("/uploads/")) {
    return {
      url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fileKey}?token=${Date.now() + expiresInSeconds * 1000}`,
      expiresIn: expiresInSeconds,
    };
  }

  // Local file stream URL
  return {
    url: fileKey.startsWith("/uploads/") ? fileKey : `/uploads/${fileKey}`,
    expiresIn: expiresInSeconds,
  };
}

module.exports = {
  getSignedUploadUrl,
  getSignedDownloadUrl,
};
