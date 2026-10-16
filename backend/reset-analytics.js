// =================================================================
// backend/reset-analytics.js  —  Reset page_visits to 0
// =================================================================
const { createClient } = require("@libsql/client");
require("dotenv").config();

async function resetAnalytics() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:backend/omni.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Connecting to database:", process.env.TURSO_DATABASE_URL ? "Turso Cloud" : "Local SQLite");

  const before = await db.execute("SELECT COUNT(*) AS total FROM page_visits;");
  console.log(`Current records in page_visits: ${before.rows[0].total}`);

  await db.execute("DELETE FROM page_visits;");

  // Also reset sqlite auto-increment sequence if present
  try {
    await db.execute("DELETE FROM sqlite_sequence WHERE name = 'page_visits';");
  } catch (_) {}

  const after = await db.execute("SELECT COUNT(*) AS total FROM page_visits;");
  console.log(`✅ Page visits reset successfully. Records now: ${after.rows[0].total}`);
}

resetAnalytics()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Reset error:", err);
    process.exit(1);
  });
