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
  { key: "home.about.badge",        type: "text",  label: "About — Pill Badge",       value: "Who We Are" },
  { key: "home.about.heading",      type: "text",  label: "About — Section Heading",  value: "Built on Trust, Driven by Excellence." },
  { key: "home.about.lead",         type: "text",  label: "About — Lead Paragraph",   value: "Omni Virtual Solutions pairs world-class virtual talent with robust management systems — so your business runs smoothly while you stay focused on growth." },
  { key: "home.about.image",        type: "image", label: "About — Team Photo",       value: "assets/img/about_team.jpg" },
  { key: "home.about.float_title",  type: "text",  label: "About — Floating Title",   value: "Balanced" },
  { key: "home.about.float_sub",    type: "text",  label: "About — Floating Subtitle",value: "Autonomy & Oversight" },
  { key: "home.about.corner_val",   type: "text",  label: "About — Corner Value",     value: "24 / 7" },
  { key: "home.about.corner_lbl",   type: "text",  label: "About — Corner Label",     value: "Operations" },
  { key: "home.about.pillar1.title",type: "text",  label: "About — Pillar 1 Title",   value: "Autonomy with Oversight" },
  { key: "home.about.pillar1.body", type: "text",  label: "About — Pillar 1 Body",    value: "We believe in employee autonomy as a pivotal component of corporate success — carefully balanced with the right level of oversight, without crossing into micro-management." },
  { key: "home.about.pillar2.title",type: "text",  label: "About — Pillar 2 Title",   value: "Elite Virtual Specialists" },
  { key: "home.about.pillar2.body", type: "text",  label: "About — Pillar 2 Body",    value: "We hire only the most qualified virtual professionals so you can focus on what matters — the essentials that drive your organization's sustainability and industry superiority." },
  { key: "home.about.pillar3.title",type: "text",  label: "About — Pillar 3 Title",   value: "Full-Spectrum Coverage" },
  { key: "home.about.pillar3.body", type: "text",  label: "About — Pillar 3 Body",    value: "From lead generation to customer service — phone, chat, and email — we cover every operational touchpoint, 24 hours a day, 7 days a week." },
  { key: "home.about.stat1.val",    type: "text",  label: "About — Stat 1 Value",     value: "200+" },
  { key: "home.about.stat1.lbl",    type: "text",  label: "About — Stat 1 Label",     value: "Clients Served" },
  { key: "home.about.stat2.val",    type: "text",  label: "About — Stat 2 Value",     value: "24/7" },
  { key: "home.about.stat2.lbl",    type: "text",  label: "About — Stat 2 Label",     value: "Operations" },
  { key: "home.about.stat3.val",    type: "text",  label: "About — Stat 3 Value",     value: "5★" },
  { key: "home.about.stat3.lbl",    type: "text",  label: "About — Stat 3 Label",     value: "Satisfaction Rate" },
  { key: "home.about.stat4.val",    type: "text",  label: "About — Stat 4 Value",     value: "10+" },
  { key: "home.about.stat4.lbl",    type: "text",  label: "About — Stat 4 Label",     value: "Industries Served" },

  // Services
  { key: "home.services.badge",    type: "text",  label: "Services — Pill Badge",    value: "✦ WHAT WE OFFER" },
  { key: "home.services.heading",  type: "text",  label: "Services — Heading",       value: "Our Services" },

  // CTA
  { key: "home.cta.badge",         type: "text",  label: "CTA — Pill Badge",         value: "✦ ELEVATE YOUR WORKFORCE" },
  { key: "home.cta.heading",       type: "text",  label: "CTA — Heading",            value: "Unlock Seamless Virtual Solutions" },
  { key: "home.cta.desc",          type: "text",  label: "CTA — Description",        value: "Experience top-tier virtual specialists who enhance efficiency while maintaining autonomy and oversight. Let's scale your business together." },
  { key: "home.cta.btn_label",     type: "text",  label: "CTA — Button Label",       value: "Services" },

  // Contact Section
  { key: "home.contact.badge",       type: "text",  label: "Contact — Pill Badge",            value: "✦ GET IN TOUCH" },
  { key: "home.contact.heading",     type: "text",  label: "Contact — Section Heading",       value: "Contact Our Team" },
  { key: "home.contact.hq_title",    type: "text",  label: "Contact — HQ Card Title",         value: "Our Headquarters" },
  { key: "home.contact.email_title", type: "text",  label: "Contact — Email Card Title",      value: "Email Inquiries" },
  { key: "home.contact.phone_title", type: "text",  label: "Contact — Phone Card Title",      value: "Phone Support" },
  { key: "home.contact.hours_title", type: "text",  label: "Contact — Hours Card Title",      value: "Operating Hours" },
  { key: "home.contact.hours_text",  type: "text",  label: "Contact — Operating Hours",       value: "Monday – Friday: 9:00 AM – 6:00 PM EST\n24/7 Virtual Specialist Operations" },
  { key: "home.contact.lbl_name",    type: "text",  label: "Contact — Form Label: Name",      value: "Your Name" },
  { key: "home.contact.lbl_email",   type: "text",  label: "Contact — Form Label: Email",     value: "Your Email" },
  { key: "home.contact.lbl_phone",   type: "text",  label: "Contact — Form Label: Phone",     value: "Phone Number" },
  { key: "home.contact.lbl_service", type: "text",  label: "Contact — Form Label: Service",   value: "Service of Interest" },
  { key: "home.contact.lbl_subject", type: "text",  label: "Contact — Form Label: Subject",   value: "Subject" },
  { key: "home.contact.lbl_message", type: "text",  label: "Contact — Form Label: Message",   value: "Message" },
  { key: "home.contact.submit_label",type: "text",  label: "Contact — Submit Button",         value: "Send Message" },

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
