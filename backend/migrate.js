// =================================================================
// backend/migrate.js  —  Run the schema SQL against the database
// =================================================================
// Usage: node backend/migrate.js
// Safe to run multiple times — all statements use IF NOT EXISTS.
// =================================================================

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs   = require("fs");
const path = require("path");
const { db } = require("./db");

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const raw = fs.readFileSync(schemaPath, "utf8");

  // Remove single-line comments and split on semicolons
  const statements = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))   // strip comment lines
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\n🔧 Running migration — ${statements.length} statements...\n`);

  for (const statement of statements) {
    const upper = statement.toUpperCase();
    // Skip PRAGMA in libsql — it doesn't need explicit toggling and can error
    if (upper.startsWith("PRAGMA")) {
      console.log(`  ⏭️  Skipped PRAGMA (handled by libsql): ${statement.substring(0, 40)}...`);
      continue;
    }
    try {
      await db.execute(statement);
      const label = statement.match(/(TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
      if (label) {
        console.log(`  ✅ ${label[1].toLowerCase()}: ${label[2]}`);
      }
    } catch (err) {
      console.error("❌ Error on statement:\n", statement, "\n", err.message);
      process.exit(1);
    }
  }

  console.log("\n✅ Migration complete — all tables and indexes created.\n");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
