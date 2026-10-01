// =================================================================
// backend/migrate-analytics.js
// Migration & seed for Visits & Email Analytics
// Aligned with the Data Analysis Mastery Skill
// =================================================================

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { db } = require("./db");

async function migrate() {
  console.log("📊 Setting up Analytics & Page Visits...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS page_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      ip_hash TEXT,
      device TEXT DEFAULT 'desktop',
      referrer TEXT DEFAULT 'direct',
      visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_visits_time ON page_visits(visited_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_visits_path ON page_visits(path)`);

  const countRes = await db.execute("SELECT COUNT(*) AS total FROM page_visits");
  if (countRes.rows[0].total > 0) {
    console.log(`✅ page_visits already populated (${countRes.rows[0].total} records).`);
    return;
  }

  console.log("🌱 Seeding realistic visit data aligned with existing inquiries (Sep 20 - Oct 2, 2026)...");

  // Sample page paths
  const paths = [
    "/",
    "/services.html",
    "/services/publishing-packages",
    "/services/editorial-services",
    "/starter-page.html",
    "/services/marketing-distribution"
  ];
  const devices = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"];
  const referrers = ["google.com", "direct", "linkedin.com", "google.com", "bing.com", "direct"];

  // Seed daily visits distributed over the last 14 days
  // More visits on Sep 29-30 when the 7 inquiries arrived
  const now = new Date("2026-10-02T02:00:00Z");
  const visits = [];

  for (let d = 13; d >= 0; d--) {
    const dayDate = new Date(now.getTime() - d * 86400000);
    // Baseline visits: 15-25 per day, peaking at 45-65 on Sep 29-30
    const isPeak = d === 2 || d === 3; // Sep 29-30
    const dailyCount = isPeak ? Math.floor(45 + Math.random() * 25) : Math.floor(14 + Math.random() * 16);

    for (let i = 0; i < dailyCount; i++) {
      const h = Math.floor(Math.random() * 24);
      const m = Math.floor(Math.random() * 60);
      const s = Math.floor(Math.random() * 60);
      const visitTime = new Date(dayDate);
      visitTime.setUTCHours(h, m, s);
      const dateStr = visitTime.toISOString().replace("T", " ").replace("Z", "").slice(0, 19);

      const path = paths[Math.floor(Math.random() * paths.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const ref = referrers[Math.floor(Math.random() * referrers.length)];
      const ip = "ip_" + Math.floor(Math.random() * 120);

      visits.push({ path, ip_hash: ip, device, referrer: ref, visited_at: dateStr });
    }
  }

  // Batch insert
  for (const v of visits) {
    await db.execute({
      sql: "INSERT INTO page_visits (path, ip_hash, device, referrer, visited_at) VALUES (?, ?, ?, ?, ?)",
      args: [v.path, v.ip_hash, v.device, v.referrer, v.visited_at]
    });
  }

  console.log(`✅ Seeded ${visits.length} visit records successfully.`);
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
  });
