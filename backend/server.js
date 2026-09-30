// =================================================================
// backend/server.js  —  Main Express application entry point
// =================================================================
// Omni Virtual Solutions — full API + CMS + SSE live-push server
//
// Public API:
//   GET  /api/v1/site-meta
//   GET  /api/v1/services, /api/v1/services/:slug
//   POST /api/v1/contact
//   GET  /api/v1/live            ← SSE real-time stream
//   GET  /api/v1/health
//
// Admin (requires JWT):
//   POST /api/v1/auth/login
//   GET  /api/v1/auth/me
//   GET  /api/v1/cms/blocks, PATCH /api/v1/cms/blocks/:key
//   GET  /api/v1/cms/blocks/:key/history
//   PATCH /api/v1/cms/services/:slug
//   POST  /api/v1/cms/upload
//   GET   /api/v1/cms/submissions, PATCH /api/v1/cms/submissions/:id
//   GET   /api/v1/cms/stats
// =================================================================

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors    = require("cors");
const path    = require("path");

// ── Route modules ─────────────────────────────────────────────────
const siteRoutes       = require("./routes/site");
const servicesRoutes   = require("./routes/services");
const contactRoutes    = require("./routes/contact");
const authRoutes       = require("./routes/auth");
const cmsRoutes        = require("./routes/cms");
const { router: liveRouter } = require("./routes/live");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      undefined,
      "null",
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    ];
    const ok = !origin || allowed.some((p) => (p instanceof RegExp ? p.test(origin) : p === origin));
    cb(null, ok);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ── Serve React Vite frontend if built ────────────────────────────
const fs = require("fs");
const frontendDist = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// ── Serve all static files (HTML, CSS, JS, images, uploads) ──────
app.use(express.static(path.resolve(__dirname, "..")));

// ─────────────────────────────────────────────────────────────────
// Public API Routes
// ─────────────────────────────────────────────────────────────────
app.use("/api/v1/site-meta", siteRoutes);
app.use("/api/v1/services",  servicesRoutes);
app.use("/api/v1/contact",   contactRoutes);
app.use("/api/v1/live",      liveRouter);

// ─────────────────────────────────────────────────────────────────
// Admin Routes (auth + CMS)
// ─────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cms",  cmsRoutes);

// ─────────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({
    status:    "ok",
    service:   "Omni Virtual Solutions API",
    version:   "2.0.0",
    timestamp: new Date().toISOString(),
    database:  process.env.TURSO_DATABASE_URL ? "turso-cloud" : "sqlite-local",
  });
});

// ─────────────────────────────────────────────────────────────────
// 404 for unknown /api routes
// ─────────────────────────────────────────────────────────────────
app.use("/api", (req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route not found: ${req.method} ${req.originalUrl}` }
  });
});

// ─────────────────────────────────────────────────────────────────
// SPA Fallback for React frontend
// ─────────────────────────────────────────────────────────────────
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/admin")) return next();
  const indexFile = path.resolve(__dirname, "../frontend/dist/index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  next();
});

// ─────────────────────────────────────────────────────────────────
// Global error handler — never leak stack traces to clients
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("[unhandled]", err.message || err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
});

// ─────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(62));
  console.log("  🚀 Omni Virtual Solutions API v2.0");
  console.log("=".repeat(62));
  console.log(`  Website:  http://localhost:${PORT}/index.html`);
  console.log(`  Admin:    http://localhost:${PORT}/admin/`);
  console.log(`  Health:   http://localhost:${PORT}/api/v1/health`);
  console.log(`  Live SSE: http://localhost:${PORT}/api/v1/live`);
  console.log("=".repeat(62));
  console.log(`  Database: ${process.env.TURSO_DATABASE_URL ? "☁️  Turso Cloud" : "💾 Local SQLite (data/omni.db)"}`);
  console.log("=".repeat(62) + "\n");
});

module.exports = app;
