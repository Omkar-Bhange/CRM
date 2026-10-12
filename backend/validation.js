const { z } = require("zod");
const mongoose = require("mongoose");

/**
 * Standardized validation error response generator.
 */
function createValidationErrorResponse(res, issues) {
  const errors = (issues || []).map((err) => ({
    field: err.path ? err.path.join(".") : "field",
    message: err.message,
  }));

  const primaryMessage = errors.length > 0 ? errors[0].message : "Validation failed.";

  return res.status(400).json({
    success: false,
    code: "VALIDATION_ERROR",
    message: primaryMessage,
    errors,
  });
}

/**
 * Recursive check for MongoDB query operators ($) and prototype pollution keys.
 * Returns true if any prohibited key is detected.
 */
function hasForbiddenKeys(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (hasForbiddenKeys(value[i])) {
        return true;
      }
    }
    return false;
  }

  for (const key of Object.keys(value)) {
    // Block MongoDB operators ($gt, $ne, $where, etc.)
    if (key.startsWith("$")) {
      return true;
    }
    // Block Prototype Pollution
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return true;
    }
    // Check nested values
    if (hasForbiddenKeys(value[key])) {
      return true;
    }
  }

  return false;
}

/**
 * Global or route-level middleware to reject MongoDB operator injection ($)
 * and prototype pollution in request bodies, queries, and params.
 */
function mongoSanitizeMiddleware(req, res, next) {
  const rawUrl = req.originalUrl || req.url || "";
  try {
    const decodedUrl = decodeURIComponent(rawUrl);
    if (
      decodedUrl.includes("$") ||
      decodedUrl.includes("__proto__") ||
      decodedUrl.includes("constructor")
    ) {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        message: "Input contains forbidden characters or query operators.",
      });
    }
  } catch (e) {
    // Malformed URI sequence
    return res.status(400).json({
      success: false,
      code: "INVALID_INPUT",
      message: "Malformed URL encoding detected.",
    });
  }

  if (
    hasForbiddenKeys(req.body) ||
    hasForbiddenKeys(req.query) ||
    hasForbiddenKeys(req.params)
  ) {
    return res.status(400).json({
      success: false,
      code: "INVALID_INPUT",
      message: "Input contains forbidden characters or query operators.",
    });
  }
  next();
}

/**
 * Express middleware generator for Zod schemas.
 * Supports:
 * - validate(schema, 'body')
 * - validate(schema, 'query')
 * - validate(schema, 'params')
 * - validate({ body: schema, query: schema, params: schema })
 */
function validate(schemaOrMap, defaultSource = "body") {
  return (req, res, next) => {
    try {
      if (typeof schemaOrMap?.parse === "function") {
        // Single schema targeting defaultSource
        const result = schemaOrMap.safeParse(req[defaultSource] || {});
        if (!result.success) {
          return createValidationErrorResponse(res, result.error.issues);
        }
        // Assign parsed values back to req[defaultSource] while keeping any passthrough fields
        req[defaultSource] = result.data;
        return next();
      }

      if (typeof schemaOrMap === "object") {
        const sources = ["params", "query", "body"];
        for (const source of sources) {
          if (schemaOrMap[source]) {
            const result = schemaOrMap[source].safeParse(req[source] || {});
            if (!result.success) {
              return createValidationErrorResponse(res, result.error.issues);
            }
            req[source] = result.data;
          }
        }
        return next();
      }

      next();
    } catch (err) {
      console.error("Validation execution error:", err);
      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message: "An internal validation error occurred.",
      });
    }
  };
}

/* =========================================================
   COMMON REUSABLE PRIMITIVES
========================================================= */

const zodObjectId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid ID format." }
);

const zodNonEmptyString = z.string().trim().min(1, "Field is required.");

const zodCurrency = z.coerce
  .number({ invalid_type_error: "Must be a valid number." })
  .finite("Must be a finite number.")
  .nonnegative("Must be a non-negative number.");

const zodPositiveCurrency = z.coerce
  .number({ invalid_type_error: "Must be a valid number." })
  .finite("Must be a finite number.")
  .positive("Must be greater than zero.");

const zodDateString = z.string().refine(
  (val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getFullYear() >= 1970 && d.getFullYear() <= 2100;
  },
  { message: "Invalid date format." }
);

/* =========================================================
   AUTH SCHEMAS
========================================================= */

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z
    .string({ required_error: "Password is required." })
    .min(1, "Password is required."),
  role: z.enum(["admin", "employee", "client"], {
    errorMap: () => ({ message: "Please select a valid role." }),
  }),
}).passthrough();

const registerAdminSchema = z.object({
  name: z
    .string({ required_error: "Name is required." })
    .trim()
    .min(1, "Name is required."),
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z
    .string({ required_error: "Password is required." })
    .min(6, "Password must contain at least 6 characters."),
}).passthrough();

const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token is required." })
    .trim()
    .min(1, "Refresh token is required."),
}).passthrough();

const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required." })
    .min(1, "Current password is required."),
  newPassword: z
    .string({ required_error: "New password is required." })
    .min(6, "New password must contain at least 6 characters."),
}).passthrough();

/* =========================================================
   CRM SCHEMAS (CLIENT, TASK, TICKET)
========================================================= */

const clientCreateSchema = z.object({
  clientCode: z
    .string({ required_error: "Client code is required." })
    .trim()
    .min(1, "Client code is required."),
  companyName: z
    .string({ required_error: "Company name is required." })
    .trim()
    .min(1, "Company name is required."),
  contactPerson: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email address.").optional().or(z.literal("")),
  mobile: z.string().trim().optional(),
  city: z.string().trim().optional(),
}).passthrough();

const taskCreateSchema = z.object({
  title: z
    .string({ required_error: "Task title is required." })
    .trim()
    .min(1, "Task title is required."),
  description: z.string().optional(),
  workType: z.string().optional(),
  taskFor: z.string().optional(),
  priority: z.string().trim().optional(),
  status: z.string().trim().optional(),
  dueDate: zodDateString.optional().nullable(),
  estimatedMinutes: z.coerce.number().finite().nonnegative().optional().nullable(),
}).passthrough();

const ticketCreateSchema = z.object({
  title: z
    .string({ required_error: "Ticket title is required." })
    .trim()
    .min(1, "Ticket title is required."),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  category: z.string().optional(),
  source: z.string().optional(),
}).passthrough();

/* =========================================================
   FINANCIAL & AMC SCHEMAS
========================================================= */

const amcPaymentSchema = z.object({
  amcInvoiceId: z.string().optional(),
  amcContractId: z.string().optional(),
  amount: zodPositiveCurrency,
  paymentDate: zodDateString,
  mode: z.string().trim().optional(),
  referenceNo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
}).passthrough();

const productSalePaymentSchema = z.object({
  amount: zodPositiveCurrency,
  paymentDate: zodDateString,
  mode: z.string().trim().optional(),
  referenceNo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
}).passthrough();

const amcContractCreateSchema = z.object({
  clientId: z.string({ required_error: "Please select a client." }).min(1, "Please select a client."),
  clientProductId: z.string({ required_error: "Please select a client product." }).min(1, "Please select a client product."),
  startDate: zodDateString,
  expiryDate: zodDateString,
  dueDate: zodDateString,
  taxableAmount: zodCurrency.optional(),
}).passthrough();

const amcRenewSchema = z.object({
  startDate: zodDateString.optional(),
  expiryDate: zodDateString.optional(),
  dueDate: zodDateString.optional(),
  taxableAmount: zodCurrency.optional(),
  gstRate: z.coerce.number().finite().nonnegative().optional(),
  gstApplicable: z.enum(["YES", "NO", "yes", "no"]).optional(),
}).passthrough();

module.exports = {
  validate,
  mongoSanitizeMiddleware,
  createValidationErrorResponse,
  zodObjectId,
  zodNonEmptyString,
  zodCurrency,
  zodPositiveCurrency,
  zodDateString,
  // Auth schemas
  loginSchema,
  registerAdminSchema,
  refreshSchema,
  changePasswordSchema,
  // CRM schemas
  clientCreateSchema,
  taskCreateSchema,
  ticketCreateSchema,
  // Financial schemas
  amcPaymentSchema,
  amcPaymentZodSchema: amcPaymentSchema,
  productSalePaymentSchema,
  productSalePaymentZodSchema: productSalePaymentSchema,
  amcContractCreateSchema,
  amcContractCreateZodSchema: amcContractCreateSchema,
  amcRenewSchema,
  amcRenewZodSchema: amcRenewSchema,
};
