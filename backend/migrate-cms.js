// =================================================================
// backend/migrate-cms.js  —  Add CMS tables to existing DB
// =================================================================
// Run: node backend/migrate-cms.js
// Adds: content_blocks, content_block_revisions, admin_users
// Seeds the default admin account and all homepage content blocks.
// =================================================================

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const { db } = require("./db");

const CMS_TABLES = [
  // ── Generic content blocks (hero text, about text, CTA copy, etc.)
  `CREATE TABLE IF NOT EXISTS content_blocks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    block_key   TEXT UNIQUE NOT NULL,
    block_type  TEXT NOT NULL DEFAULT 'text',
    value       TEXT,
    label       TEXT,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by  TEXT
  )`,

  // ── Revision history — one row inserted before every overwrite
  `CREATE TABLE IF NOT EXISTS content_block_revisions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    block_key   TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by  TEXT
  )`,

  // ── Admin users — hashed passwords, never plaintext
  `CREATE TABLE IF NOT EXISTS admin_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'editor',
    is_active     INTEGER DEFAULT 1,
    last_login    DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_blocks_key    ON content_blocks(block_key)`,
  `CREATE INDEX IF NOT EXISTS idx_revisions_key ON content_block_revisions(block_key)`,
  `CREATE INDEX IF NOT EXISTS idx_revisions_at  ON content_block_revisions(changed_at)`,
];

// ── All homepage editable content blocks ─────────────────────────
const CONTENT_BLOCKS = [
  // Hero
  { key: "home.hero.title",        type: "text",  label: "Hero — Main Title",       value: "Empowering Individuals\nand Businesses" },
  { key: "home.hero.subtitle",     type: "text",  label: "Hero — Subtitle",          value: "Balancing employee autonomy with expert oversight — providing qualified virtual specialists to power your sustainability and industry superiority." },
  { key: "home.hero.watermark",    type: "text",  label: "Hero — Watermark Text",    value: "OMNI VIRTUAL SOLUTIONS" },
  { key: "home.hero.cta_label",    type: "text",  label: "Hero — CTA Button Label",  value: "Get Started" },

  // About
  { key: "home.about.badge",       type: "text",  label: "About — Pill Badge",       value: "✦ WHO WE ARE & WHAT WE BELIEVE" },
  { key: "home.about.heading",     type: "text",  label: "About — Section Heading",  value: "About Us" },
  { key: "home.about.lead",        type: "text",  label: "About — Lead Paragraph",   value: "We at Omni Virtual Solutions believe in employee autonomy as a pivotal component of corporate success. On the other hand, delicately balancing it w/ proper oversight w/o crossing over to the realm of micro management is something that every business needs to consider." },
  { key: "home.about.callout_tag", type: "text",  label: "About — Callout Tag",      value: "That's where we come in." },
  { key: "home.about.callout",     type: "text",  label: "About — Callout Body",     value: "We hire only the most qualified Virtual specialists to get the job done for you so you can focus on the essentials that contribute to your organization's sustainability and industry superiority." },
  { key: "home.about.point1",      type: "text",  label: "About — Point 1",          value: "We're staffed with the most experienced and competent managers and supervisors who take care in monitoring the performance, attendance, and general demeanor of your virtual specialists on-site." },
  { key: "home.about.point2",      type: "text",  label: "About — Point 2",          value: "From Sales (from Lead generation to Closer) to Customer Service (phone, chat, email) and everything else in between, we got your operational needs covered 24/7." },
  { key: "home.about.image",       type: "image", label: "About — Team Photo",       value: "assets/img/about_team.jpg" },
  { key: "home.about.badge_stat",  type: "text",  label: "About — Floating Badge",   value: "Balanced" },
  { key: "home.about.badge_lbl",   type: "text",  label: "About — Floating Label",   value: "Autonomy & Oversight" },

  // Services
  { key: "home.services.badge",    type: "text",  label: "Services — Pill Badge",    value: "✦ WHAT WE OFFER" },
  { key: "home.services.heading",  type: "text",  label: "Services — Heading",       value: "Our Services" },

  // CTA
  { key: "home.cta.badge",         type: "text",  label: "CTA — Pill Badge",         value: "✦ ELEVATE YOUR WORKFORCE" },
  { key: "home.cta.heading",       type: "text",  label: "CTA — Heading",            value: "Unlock Seamless Virtual Solutions" },
  { key: "home.cta.desc",          type: "text",  label: "CTA — Description",        value: "Experience top-tier virtual specialists who enhance efficiency while maintaining autonomy and oversight. Let's scale your business together." },
  { key: "home.cta.btn_label",     type: "text",  label: "CTA — Button Label",       value: "Services" },

  // Footer / Contact
  { key: "footer.hq.image",        type: "image", label: "Footer — HQ Photo",        value: "assets/img/footer-image.jpg" },
  { key: "footer.hq.caption",      type: "text",  label: "Footer — HQ Caption",      value: "New York, NY" },
  { key: "footer.address",         type: "text",  label: "Footer — Address",         value: "1350 Ave of the Americas, Fl 2 -1100 New York, NY 10019" },
  { key: "footer.email",           type: "text",  label: "Footer — Email",           value: "admin@omnivirtualsolution.com" },
  { key: "footer.phone",           type: "text",  label: "Footer — Phone",           value: "+1 315-915-4799" },
];

async function migrateCms() {
  console.log("\n🔧 Running CMS migration...\n");

  for (const sql of CMS_TABLES) {
    const label = sql.match(/(TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
    try {
      await db.execute(sql);
      if (label) console.log(`  ✅ ${label[1].toLowerCase()}: ${label[2]}`);
    } catch (err) {
      console.error("❌ Error:", err.message, "\nSQL:", sql.substring(0, 80));
      process.exit(1);
    }
  }

  // ── Seed content blocks (INSERT OR IGNORE — never overwrite existing edits)
  console.log("\n📝 Seeding content blocks...");
  for (const block of CONTENT_BLOCKS) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO content_blocks (block_key, block_type, label, value) VALUES (?,?,?,?)`,
      args: [block.key, block.type, block.label, block.value],
    });
  }
  console.log(`  ✅ ${CONTENT_BLOCKS.length} content blocks ready.`);

  // ── Create default admin user (if none exists) ──────────────────
  const existing = await db.execute("SELECT id FROM admin_users LIMIT 1");
  if (existing.rows.length === 0) {
    const defaultPassword = "omni-admin-2024";
    const hash = await bcrypt.hash(defaultPassword, 12);
    await db.execute({
      sql: `INSERT INTO admin_users (username, email, password_hash, role)
            VALUES (?,?,?,?)`,
      args: ["admin", "admin@omnivirtualsolution.com", hash, "admin"],
    });
    console.log("\n🔐 Default admin account created:");
    console.log("   Username: admin");
    console.log("   Password: omni-admin-2024");
    console.log("   ⚠️  Change this password after first login!\n");
  } else {
    console.log("\n  ✅ Admin user already exists — skipped.\n");
  }

  console.log("✅ CMS migration complete.\n");
  process.exit(0);
}

migrateCms().catch((err) => {
  console.error("❌ CMS migration failed:", err);
  process.exit(1);
});
