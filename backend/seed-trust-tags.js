require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { db } = require("./db");

async function seed() {
  const initialTags = JSON.stringify([
    { icon: "bi-book-half", text: "Publishing Packages" },
    { icon: "bi-journal-check", text: "Editorial Evaluation" },
    { icon: "bi-megaphone", text: "Book Marketing" }
  ]);

  const existing = await db.execute({
    sql: "SELECT id FROM content_blocks WHERE block_key = 'home.cta.trust_tags'",
    args: []
  });

  if (existing.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO content_blocks (block_key, block_type, label, value, updated_by) VALUES ('home.cta.trust_tags', 'json', 'CTA — Trust Highlights', ?, 'system')",
      args: [initialTags]
    });
    console.log("✅ Seeded home.cta.trust_tags");
  } else {
    console.log("ℹ️ home.cta.trust_tags already exists");
  }
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
