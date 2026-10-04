// =================================================================
// scripts/postbuild.js  —  Copy admin and static assets to frontend/dist
// =================================================================
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "frontend/dist");

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

// Copy Admin portal to dist/admin
const adminSrc = path.join(root, "admin");
const adminDest = path.join(dist, "admin");
if (fs.existsSync(adminSrc)) {
  fs.cpSync(adminSrc, adminDest, { recursive: true });
  console.log("  ✅ Admin portal copied to frontend/dist/admin");
}

// Copy static assets to dist/assets
const assetsSrc = path.join(root, "assets");
const assetsDest = path.join(dist, "assets");
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log("  ✅ Assets copied to frontend/dist/assets");
}

console.log("🚀 Postbuild finished successfully.\n");
