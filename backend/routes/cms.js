// =================================================================
// backend/routes/cms.js  —  Authenticated CMS write API
// =================================================================
// All routes require a valid admin JWT via requireAuth middleware.
//
// GET    /api/v1/cms/blocks              → all content blocks
// GET    /api/v1/cms/blocks/:key         → single block by key
// PATCH  /api/v1/cms/blocks/:key         → update a block value
// GET    /api/v1/cms/blocks/:key/history → revision history for a block
//
// PATCH  /api/v1/cms/services/:slug      → update service price/description
// GET    /api/v1/cms/submissions         → view contact leads (alias)
// PATCH  /api/v1/cms/submissions/:id     → update submission status
//
// POST   /api/v1/cms/upload              → upload an image asset
// GET    /api/v1/cms/stats               → DB-level site stats (admin)
// =================================================================

const express  = require("express");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const router   = express.Router();
const { db }   = require("../db");
const { requireAuth }  = require("../middleware/auth");
const { broadcast }    = require("./live");

// ── Image upload config (multer) ──────────────────────────────────
const UPLOADS_DIR = path.resolve(__dirname, "../../assets/uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ts  = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload_${ts}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    // Validate by actual mimetype allowlist, not client-claimed extension
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Accepted: ${ALLOWED_TYPES.join(", ")}`));
    }
  },
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/cms/blocks
// Returns all content blocks grouped by page section
// ─────────────────────────────────────────────────────────────────
router.get("/blocks", requireAuth, async (req, res) => {
  try {
    const result = await db.execute(
      "SELECT id, block_key, block_type, label, value, updated_at, updated_by FROM content_blocks ORDER BY block_key"
    );
    res.json({ blocks: result.rows, total: result.rows.length });
  } catch (err) {
    console.error("[cms/blocks] GET Error:", err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load content blocks." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/cms/blocks/:key
// Returns one content block
// ─────────────────────────────────────────────────────────────────
router.get("/blocks/:key", requireAuth, async (req, res) => {
  const key = req.params.key;
  try {
    const result = await db.execute({
      sql: "SELECT * FROM content_blocks WHERE block_key = ? LIMIT 1",
      args: [key],
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Block not found: ${key}` } });
    }
    res.json({ block: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load block." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/v1/cms/blocks/:key
// Update a content block — saves to DB, writes revision, broadcasts live
// Body: { value: "new content" }
// ─────────────────────────────────────────────────────────────────
router.patch("/blocks/:key", requireAuth, async (req, res) => {
  const key   = req.params.key;
  const { value } = req.body;

  if (value === undefined || value === null) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "value is required." } });
  }

  try {
    // Fetch the existing block
    const existing = await db.execute({
      sql: "SELECT * FROM content_blocks WHERE block_key = ? LIMIT 1",
      args: [key],
    });

    const newValue = String(value).trim();
    const editor   = req.admin.username;

    if (existing.rows.length === 0) {
      // Auto-create block if it does not exist yet
      await db.execute({
        sql: "INSERT INTO content_blocks (block_key, block_type, label, value, updated_by) VALUES (?, 'text', ?, ?, ?)",
        args: [key, key, newValue, editor],
      });
      await db.execute({
        sql: "INSERT INTO content_block_revisions (block_key, old_value, new_value, changed_by) VALUES (?, '', ?, ?)",
        args: [key, newValue, editor],
      });

      console.log(`[cms] ${editor} created new block: ${key}`);
      broadcast({ key, value: newValue, blockType: 'text', updatedBy: editor, table: "content_blocks" });
      return res.json({ success: true, block: { block_key: key, value: newValue, block_type: 'text', updated_by: editor } });
    }

    const block    = existing.rows[0];
    const oldValue = block.value;

    // Write revision before overwriting
    await db.execute({
      sql: "INSERT INTO content_block_revisions (block_key, old_value, new_value, changed_by) VALUES (?,?,?,?)",
      args: [key, oldValue, newValue, editor],
    });

    // Update the block
    await db.execute({
      sql: "UPDATE content_blocks SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE block_key = ?",
      args: [newValue, editor, key],
    });

    console.log(`[cms] ${editor} updated block: ${key}`);

    // Broadcast live to all open tabs
    broadcast({ key, value: newValue, blockType: block.block_type, updatedBy: editor, table: "content_blocks" });

    res.json({ success: true, block: { block_key: key, value: newValue, block_type: block.block_type, updated_by: editor } });
  } catch (err) {
    console.error("[cms/blocks PATCH] Error:", err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update block." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/cms/blocks/:key/history
// Returns last 20 revisions for a given block key
// ─────────────────────────────────────────────────────────────────
router.get("/blocks/:key/history", requireAuth, async (req, res) => {
  const key = req.params.key;
  try {
    const result = await db.execute({
      sql: "SELECT * FROM content_block_revisions WHERE block_key = ? ORDER BY changed_at DESC LIMIT 20",
      args: [key],
    });
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load history." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/v1/cms/services/:slug
// Update a service's price, description, or lead paragraph
// Body: { price_display?, price_cents?, lead_paragraph?, full_description? }
// ─────────────────────────────────────────────────────────────────
router.patch("/services/:slug", requireAuth, async (req, res) => {
  const { slug } = req.params;
  const { price_display, price_cents, lead_paragraph, full_description } = req.body;
  const editor = req.admin.username;

  const updates  = [];
  const args     = [];

  if (price_display !== undefined) { updates.push("price_display = ?"); args.push(String(price_display).trim()); }
  if (price_cents   !== undefined) { updates.push("price_cents = ?");   args.push(parseInt(price_cents, 10) || null); }
  if (lead_paragraph !== undefined) { updates.push("lead_paragraph = ?"); args.push(String(lead_paragraph).trim()); }
  if (full_description !== undefined) { updates.push("full_description = ?"); args.push(String(full_description).trim()); }

  if (updates.length === 0) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "No fields to update." } });
  }

  args.push(slug);

  try {
    const existing = await db.execute({ sql: "SELECT id, title FROM services WHERE slug = ? LIMIT 1", args: [slug] });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: `Service not found: ${slug}` } });
    }

    await db.execute({ sql: `UPDATE services SET ${updates.join(", ")} WHERE slug = ?`, args });

    console.log(`[cms] ${editor} updated service: ${slug} (${updates.join(", ")})`);

    // Broadcast so any open service page refreshes its price/desc live
    broadcast({ key: `service.${slug}`, value: { price_display, lead_paragraph }, blockType: "service", updatedBy: editor, table: "services" });

    res.json({ success: true, slug, updatedFields: updates.map((u) => u.split(" ")[0]) });
  } catch (err) {
    console.error("[cms/services PATCH] Error:", err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update service." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/v1/cms/submissions/:id
// Update status of a contact submission
// Body: { status: "in_review" | "contacted" | "closed" | "new" }
// ─────────────────────────────────────────────────────────────────
router.patch("/submissions/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const VALID_STATUSES = ["new", "in_review", "contacted", "closed"];

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `status must be one of: ${VALID_STATUSES.join(", ")}` }
    });
  }

  try {
    await db.execute({ sql: "UPDATE contact_submissions SET status = ? WHERE id = ?", args: [status, parseInt(id, 10)] });
    res.json({ success: true, id: parseInt(id, 10), status });
  } catch (err) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update submission." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/cms/upload
// Upload an image → saves to assets/uploads/ → returns URL
// Optional body param: block_key — auto-updates the block after upload
// ─────────────────────────────────────────────────────────────────
router.post("/upload", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "No image file provided." } });
  }

  const relativePath = `assets/uploads/${req.file.filename}`;
  const editor       = req.admin.username;

  // Register in media_assets table
  try {
    await db.execute({
      sql: `INSERT OR IGNORE INTO media_assets (asset_key, file_path, alt_text, category)
            VALUES (?, ?, ?, 'upload')`,
      args: [`upload_${Date.now()}`, relativePath, req.file.originalname],
    });
  } catch (_) { /* non-critical */ }

  // If a block_key was supplied, auto-update that block with the new image path
  const blockKey = req.body.block_key;
  if (blockKey) {
    try {
      await db.execute({
        sql: "UPDATE content_blocks SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE block_key = ?",
        args: [relativePath, editor, blockKey],
      });
      broadcast({ key: blockKey, value: relativePath, blockType: "image", updatedBy: editor, table: "content_blocks" });
    } catch (_) { /* non-critical if block doesn't exist */ }
  }

  console.log(`[cms/upload] ${editor} uploaded: ${relativePath}`);

  res.status(201).json({
    success: true,
    url: `/${relativePath}`,
    path: relativePath,
    filename: req.file.filename,
    block_key: blockKey || null,
  });
});

// ─────────────────────────────────────────────────────────────────
// Multer error handler
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, _next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: { code: "FILE_TOO_LARGE", message: "Image must be under 5 MB." } });
  }
  if (err) {
    return res.status(400).json({ error: { code: "UPLOAD_ERROR", message: err.message } });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/cms/stats  — admin overview stats
// ─────────────────────────────────────────────────────────────────
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const [services, blocks, contacts, newLeads] = await Promise.all([
      db.execute("SELECT COUNT(*) AS total FROM services"),
      db.execute("SELECT COUNT(*) AS total FROM content_blocks"),
      db.execute("SELECT COUNT(*) AS total FROM contact_submissions"),
      db.execute("SELECT COUNT(*) AS total FROM contact_submissions WHERE status = 'new'"),
    ]);
    res.json({
      totalServices: services.rows[0].total,
      totalBlocks:   blocks.rows[0].total,
      totalContacts: contacts.rows[0].total,
      newLeads:      newLeads.rows[0].total,
    });
  } catch (err) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load stats." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/cms/submissions  — list all contact leads (admin alias)
// ─────────────────────────────────────────────────────────────────
router.get("/submissions", requireAuth, async (req, res) => {
  const { status } = req.query;
  try {
    const whereClause = status ? `WHERE cs.status = '${status}'` : "";
    const result = await db.execute(
      `SELECT cs.id, cs.full_name, cs.email, cs.subject, cs.message,
              cs.status, cs.created_at,
              s.title AS service_interest_title
       FROM contact_submissions cs
       LEFT JOIN services s ON cs.service_interest_id = s.id
       ${whereClause}
       ORDER BY cs.created_at DESC`
    );
    res.json({ submissions: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load submissions." } });
  }
});

module.exports = router;
