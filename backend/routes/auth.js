// =================================================================
// backend/routes/auth.js  —  /api/v1/auth
// =================================================================
// POST /api/v1/auth/login   → returns JWT on valid credentials
// POST /api/v1/auth/logout  → client-side; just tells client to clear token
// GET  /api/v1/auth/me      → returns current admin info (requires auth)
// =================================================================

const express  = require("express");
const bcrypt   = require("bcryptjs");
const router   = express.Router();
const { db }   = require("../db");
const { requireAuth, signToken } = require("../middleware/auth");

// POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "username and password are required." }
    });
  }

  try {
    const result = await db.execute({
      sql: "SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1",
      args: [username.trim().toLowerCase(), username.trim().toLowerCase()],
    });

    if (result.rows.length === 0) {
      // Don't reveal whether user exists — same message either way
      return res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password." }
      });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password." }
      });
    }

    // Update last_login timestamp
    await db.execute({
      sql: "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      args: [user.id],
    });

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    console.log(`[auth] Login: ${user.username} (${user.role})`);

    res.json({
      token,
      admin: { id: user.id, username: user.username, email: user.email, role: user.role },
      expiresIn: "8h",
    });
  } catch (err) {
    console.error("[auth/login] Error:", err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Login failed." } });
  }
});

// GET /api/v1/auth/me — verify token and return current admin
router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT id, username, email, role, last_login FROM admin_users WHERE id = ?",
      args: [req.admin.id],
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Admin user not found." } });
    }
    res.json({ admin: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch admin." } });
  }
});

// POST /api/v1/auth/logout — informational; actual logout is client-side (clear token)
router.post("/logout", requireAuth, (req, res) => {
  console.log(`[auth] Logout: ${req.admin.username}`);
  res.json({ success: true, message: "Logged out. Clear your token on the client." });
});

module.exports = router;
