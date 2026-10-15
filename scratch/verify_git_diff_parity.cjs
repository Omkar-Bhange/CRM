const { execSync } = require('child_process');
const fs = require('fs');

const parentAdmin = execSync('git show cb205ed:backend/admin.js', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const newModel = fs.readFileSync('backend/models/ProductSale.js', 'utf8');

const lines = parentAdmin.split(/\r?\n/);
const origChunk = lines.slice(1430, 2326).join('\n');

function normalize(str) {
  return str
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const origNorm = normalize(origChunk);
const newNorm = normalize(newModel.replace('"use strict";', '').replace('const mongoose = require("mongoose");', '').replace('module.exports = ProductSale;', ''));

console.log("=== COMPARING ORIGINAL ADMIN.JS (from commit cb205ed) WITH BACKEND/MODELS/PRODUCTSALE.JS ===");
console.log("Original normalized length:", origNorm.length);
console.log("New model normalized length:", newNorm.length);

const itemFields = [
  "productId", "productCode", "productName", "version", "clientProductId",
  "licenceType", "licensedUsers", "quantity", "rate", "grossAmount",
  "discountAmount", "taxableAmount", "gstRate", "cgstAmount", "sgstAmount",
  "igstAmount", "totalAmount", "purchaseDate", "installationDate",
  "warrantyMonths", "warrantyStartDate", "warrantyEndDate", "supportType",
  "installationStatus", "amcApplicable", "proposedAmcAmount", "notes"
];

let itemAllMatch = true;
for (const f of itemFields) {
  const origHas = origNorm.includes(f);
  const newHas = newNorm.includes(f);
  if (!origHas || !newHas) {
    console.log(`Mismatch in item field: ${f}`);
    itemAllMatch = false;
  }
}
console.log("Item fields all present in both:", itemAllMatch);

const mainFields = [
  "saleCode", "saleNumber", "invoiceNo", "saleDate", "invoiceDate", "dueDate",
  "clientId", "clientCode", "clientName", "contactPerson", "mobile", "email",
  "gstNo", "state", "billingAddress", "items", "grossAmount", "discountAmount",
  "taxableAmount", "cgstAmount", "sgstAmount", "igstAmount", "roundOff",
  "totalAmount", "paidAmount", "pendingAmount", "paymentStatus", "status",
  "notes", "paymentVersion", "createdBy", "createdByName", "updatedBy",
  "updatedByName", "isDeleted", "deletedAt", "deletedBy", "deletedByName"
];

let mainAllMatch = true;
for (const f of mainFields) {
  const origHas = origNorm.includes(f);
  const newHas = newNorm.includes(f);
  if (!origHas || !newHas) {
    console.log(`Mismatch in main field: ${f}`);
    mainAllMatch = false;
  }
}
console.log("Main fields all present in both:", mainAllMatch);

console.log("Text index present in both:", (origNorm.includes('items.productName": "text"') || origNorm.includes('"items.productName" : "text"')) && (newNorm.includes('items.productName": "text"') || newNorm.includes('"items.productName" : "text"')));
console.log("Compound index { clientId: 1, saleDate: -1 } in both:", (origNorm.includes('clientId: 1') && origNorm.includes('saleDate: -1')) && (newNorm.includes('clientId: 1') && newNorm.includes('saleDate: -1')));
console.log("Collection name 'productsales' in both:", origNorm.includes('"productsales"') && newNorm.includes('"productsales"'));
console.log("timestamps: true in both:", origNorm.includes('timestamps: true') && newNorm.includes('timestamps: true'));
console.log("Registration guard in both:", origNorm.includes('mongoose.models.ProductSale ||') && newNorm.includes('mongoose.models.ProductSale ||'));

