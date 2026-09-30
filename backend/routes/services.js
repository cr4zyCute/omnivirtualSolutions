// =================================================================
// backend/routes/services.js  —  /api/v1/services
// =================================================================
// Powers the services catalog — categories, subcategories, individual
// service detail pages. Replaces the 131 static HTML files with
// a single dynamic data source.
// =================================================================

const express = require("express");
const router  = express.Router();
const { db }  = require("../db");

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/services
// Returns all categories with nested subcategories and services.
// Used to power the full services.html sidebar + catalog.
// ─────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const categoriesResult = await db.execute(
      "SELECT * FROM service_categories ORDER BY display_order"
    );
    const subcatsResult = await db.execute(
      "SELECT * FROM service_subcategories ORDER BY category_id, display_order"
    );
    const servicesResult = await db.execute(
      `SELECT id, subcategory_id, slug, title, price_display, lead_paragraph, is_featured, display_order
       FROM services ORDER BY subcategory_id, display_order`
    );

    // Build nested structure: categories → subcategories → services
    const subcatMap = {};
    for (const sub of subcatsResult.rows) {
      if (!subcatMap[sub.category_id]) subcatMap[sub.category_id] = [];
      subcatMap[sub.category_id].push({ ...sub, services: [] });
    }

    for (const svc of servicesResult.rows) {
      for (const catSubs of Object.values(subcatMap)) {
        const sub = catSubs.find((s) => s.id === svc.subcategory_id);
        if (sub) { sub.services.push(svc); break; }
      }
    }

    const catalog = categoriesResult.rows.map((cat) => ({
      ...cat,
      subcategories: subcatMap[cat.id] || [],
    }));

    res.json({ catalog });
  } catch (err) {
    console.error("[services] Error:", err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load services catalog." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/services/categories
// Returns flat list of categories only (for nav menus / dropdowns)
// ─────────────────────────────────────────────────────────────────
router.get("/categories", async (req, res) => {
  try {
    const result = await db.execute(
      "SELECT id, slug, title, icon_class, tagline FROM service_categories ORDER BY display_order"
    );
    res.json({ categories: result.rows });
  } catch (err) {
    console.error("[services/categories] Error:", err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load categories." } });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/services/:slug
// Returns one service with full description + all feature bullets.
// Powers individual service detail pages (replaces 131 static files).
// ─────────────────────────────────────────────────────────────────
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const svcResult = await db.execute({
      sql: `SELECT s.*, sc.title AS category_title, sc.slug AS category_slug,
                   sub.title AS subcategory_title, sub.slug AS subcategory_slug
            FROM services s
            JOIN service_subcategories sub ON s.subcategory_id = sub.id
            JOIN service_categories sc    ON sub.category_id   = sc.id
            WHERE s.slug = ?
            LIMIT 1`,
      args: [slug],
    });

    if (svcResult.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: `No service found with slug: ${slug}` }
      });
    }

    const service = svcResult.rows[0];

    const featuresResult = await db.execute({
      sql: "SELECT feature_text, display_order FROM service_features WHERE service_id = ? ORDER BY display_order",
      args: [service.id],
    });

    res.json({
      service: {
        ...service,
        features: featuresResult.rows.map((f) => f.feature_text),
      }
    });
  } catch (err) {
    console.error(`[services/:slug] Error for slug "${slug}":`, err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load service." } });
  }
});

module.exports = router;
