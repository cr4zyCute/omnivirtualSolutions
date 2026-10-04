#!/usr/bin/env node
// =================================================================
// backend/change-password.js  —  CLI Admin Password Updater
// =================================================================
// Usage:
//   node backend/change-password.js <username> <new-password>
//   node backend/change-password.js admin "MyNewSecurePassword123!"
// =================================================================

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const { db } = require("./db");

async function main() {
  const args = process.argv.slice(2);
  const username = args[0] ? args[0].trim().toLowerCase() : "admin";
  const newPassword = args[1];

  if (!newPassword) {
    console.log("\n🔑 Omni Virtual Solutions — Admin Password Tool\n");
    console.log("Usage:");
    console.log("  node backend/change-password.js <username> <new-password>");
    console.log("\nExample:");
    console.log('  node backend/change-password.js admin "MyStrongNewPassword2026!"\n');
    process.exit(1);
  }

  if (newPassword.length < 10) {
    console.error("❌ Error: Password must be at least 10 characters long.");
    process.exit(1);
  }

  if (newPassword === "omni-admin-2024") {
    console.error("❌ Error: Cannot use the sample default password.");
    process.exit(1);
  }

  try {
    const existing = await db.execute({
      sql: "SELECT id, username, email FROM admin_users WHERE username = ? OR email = ? LIMIT 1",
      args: [username, username],
    });

    if (existing.rows.length === 0) {
      console.error(`❌ Error: No admin user found matching "${username}".`);
      process.exit(1);
    }

    const admin = existing.rows[0];
    const newHash = await bcrypt.hash(newPassword, 12);

    await db.execute({
      sql: "UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [newHash, admin.id],
    });

    console.log(`\n✅ Password successfully updated for admin "${admin.username}" (ID: ${admin.id})!`);
    console.log("   The old default password has been replaced.\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating password:", err.message);
    process.exit(1);
  }
}

main();
