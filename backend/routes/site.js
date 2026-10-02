// =================================================================
// backend/routes/site.js  —  /api/v1/site-meta
// =================================================================
// Returns company profile, stats, media assets, and showcase books
// in one response — powers the homepage without multiple round-trips.
// =================================================================

const express = require("express");
const router  = express.Router();
const { db }  = require("../db");

// GET /api/v1/site-meta
// Returns everything the homepage needs: company info, stats, books, hero images
router.get("/", async (req, res) => {
  try {
    const [companyResult, statsResult, booksResult, assetsResult, blocksResult, emailSettingResult] = await Promise.all([
      db.execute("SELECT * FROM company_profile ORDER BY id DESC LIMIT 1"),
      db.execute("SELECT stat_key, stat_value, stat_label FROM company_stats ORDER BY display_order"),
      db.execute(`
        SELECT sb.id, sb.title, sb.author, sb.display_order, sb.is_active,
               ma.file_path AS image_path, ma.alt_text AS image_alt
        FROM showcase_books sb
        LEFT JOIN media_assets ma ON sb.image_asset_id = ma.id
        WHERE sb.is_active = 1
        ORDER BY sb.display_order
      `),
      db.execute("SELECT asset_key, file_path, alt_text, category FROM media_assets ORDER BY category"),
      db.execute("SELECT block_key, block_type, value FROM content_blocks"),
      db.execute("SELECT setting_value FROM email_settings WHERE setting_key = 'recipient_email' LIMIT 1").catch(() => ({ rows: [] })),
    ]);

    const blockMap = {};
    for (const b of blocksResult.rows) {
      blockMap[b.block_key] = b.value;
    }

    const company = companyResult.rows[0] ? { ...companyResult.rows[0] } : {};
    const configuredEmail = emailSettingResult.rows[0]?.setting_value?.trim();
    const activeEmail = configuredEmail || company.email || blockMap['services.cta.email'] || blockMap['footer.email'];
    if (activeEmail) {
      company.recipient_email = activeEmail;
      company.email = activeEmail;
      if (!blockMap['services.cta.email']) blockMap['services.cta.email'] = activeEmail;
      if (!blockMap['footer.email']) blockMap['footer.email'] = activeEmail;
    }

    res.json({
      company,
      recipient_email: configuredEmail || company.email || null,
      stats:          statsResult.rows,
      showcase_books:  booksResult.rows,
      media_assets:   assetsResult.rows,
      blocks:         blocksResult.rows,
      blockMap,
    });
  } catch (err) {
    console.error("[site-meta] Error:", err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load site meta." } });
  }
});

module.exports = router;
