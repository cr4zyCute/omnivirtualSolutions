// =================================================================
// backend/middleware/auth.js  —  JWT authentication middleware
// =================================================================
// Attach this to any route that requires an authenticated admin.
// Usage: router.patch("/...", requireAuth, handler)
// =================================================================

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "omni-cms-secret-change-in-production";

// ── Verify JWT from Authorization: Bearer <token> header ──────────
function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required. Provide a Bearer token." }
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload; // { id, username, role, iat, exp }
    next();
  } catch (err) {
    const code = err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
    return res.status(401).json({
      error: { code, message: err.name === "TokenExpiredError" ? "Session expired. Please log in again." : "Invalid token." }
    });
  }
}

// ── Sign a new token ──────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

module.exports = { requireAuth, signToken };
