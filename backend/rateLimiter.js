const { rateLimit } = require("express-rate-limit");

/**
 * Standardized JSON error response handler for rate limiting.
 * Returns HTTP 429 with standard headers and Retry-After value.
 */
function createRateLimitHandler(message, customCode = "TOO_MANY_REQUESTS") {
  return (req, res, next, options) => {
    let retryAfter = Math.ceil(options.windowMs / 1000);
    if (req.rateLimit && req.rateLimit.resetTime) {
      const diffSeconds = Math.ceil((new Date(req.rateLimit.resetTime).getTime() - Date.now()) / 1000);
      if (diffSeconds > 0) {
        retryAfter = diffSeconds;
      }
    }
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(options.statusCode || 429).json({
      success: false,
      code: customCode,
      message: message || options.message || "Too many requests. Please try again later.",
      retryAfter,
    });
  };
}

/**
 * Safely extract client IP address.
 * Relies on req.ip managed by Express trust proxy settings,
 * falling back to socket remoteAddress.
 */
function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
}

/**
 * Composite key: Client IP + normalized email/account.
 * Prevents account-locking denial of service across shared-office IPs.
 */
function getAccountIpKey(req) {
  const ip = getClientIp(req);
  const email = (req.body?.email || req.body?.username || "").toLowerCase().trim();
  return `${ip}::${email || "anonymous"}`;
}

// 1. Account-specific Login Limiter (Failed Attempts Only)
// Max 10 failed login attempts per 15 minutes for a specific account from this IP.
// Successful logins are NOT counted.
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => getAccountIpKey(req),
  skipSuccessfulRequests: true,
  validate: false,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: createRateLimitHandler(
    "Too many failed login attempts for this account. Please wait 15 minutes before trying again."
  ),
});

// 2. IP-level Login Flood Limiter (Failed Attempts Only)
// Max 50 failed login attempts per 15 minutes from an IP to block automated dictionary scanning.
// Successful logins are NOT counted.
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  keyGenerator: (req) => getClientIp(req),
  skipSuccessfulRequests: true,
  validate: false,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: createRateLimitHandler(
    "Too many failed login attempts from this network. Please wait 15 minutes before trying again."
  ),
});

// 3. Admin Registration Limiter
// Max 5 registration attempts per 60 minutes per IP.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => getClientIp(req),
  validate: false,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: createRateLimitHandler(
    "Too many registration attempts. Please try again later."
  ),
});

// 4. Password Change Limiter (Failed Attempts Only)
// Max 10 attempts per 15 minutes per authenticated user / IP.
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => (req.user?._id ? `user_${req.user._id}` : getClientIp(req)),
  skipSuccessfulRequests: true,
  validate: false,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: createRateLimitHandler(
    "Too many password change attempts. Please wait 15 minutes before trying again."
  ),
});

// 5. Session Refresh Limiter
// Max 60 refresh requests per 15 minutes per IP.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  keyGenerator: (req) => getClientIp(req),
  validate: false,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: createRateLimitHandler(
    "Too many session refresh requests. Please wait before trying again."
  ),
});

// 6. Agent Device Registration Limiter
// Max 20 device registration attempts per 15 minutes per IP.
const agentRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyGenerator: (req) => getClientIp(req),
  validate: false,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: createRateLimitHandler(
    "Too many device registration attempts. Please try again later."
  ),
});

module.exports = {
  loginAccountLimiter,
  loginIpLimiter,
  registerLimiter,
  changePasswordLimiter,
  refreshLimiter,
  agentRegisterLimiter,
};
