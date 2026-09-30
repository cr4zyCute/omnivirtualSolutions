// =================================================================
// backend/routes/live.js  —  SSE real-time broadcast channel
// =================================================================
// GET /api/v1/live  → public SSE stream (read-only, no auth needed)
//
// broadcast(event) is exported and called by CMS write routes after
// every successful DB write, pushing the change to all open tabs.
// =================================================================

const express = require("express");
const router  = express.Router();

// In-memory set of active SSE response streams.
// NOTE: Works fine for a single server process. If you scale to
// multiple processes, replace this Set with Redis pub/sub.
const clients = new Set();

// ── GET /api/v1/live — open an SSE connection ─────────────────────
router.get("/", (req, res) => {
  res.set({
    "Content-Type":  "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection":    "keep-alive",
    "X-Accel-Buffering": "no",  // Disable nginx buffering for SSE
  });
  res.flushHeaders();

  // Send a connection confirmation event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "ok", clients: clients.size + 1 })}\n\n`);

  clients.add(res);

  // Keep-alive ping every 25s (prevents proxy timeouts)
  const ping = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": ping\n\n");
    }
  }, 25000);

  // Cleanup when client disconnects
  req.on("close", () => {
    clearInterval(ping);
    clients.delete(res);
  });
});

// ── broadcast() — call from CMS write routes after every DB save ──
// event shape: { key, value, blockType, updatedBy, table }
function broadcast(event) {
  if (clients.size === 0) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  let dead = [];
  for (const res of clients) {
    if (res.writableEnded) {
      dead.push(res);
    } else {
      res.write(payload);
    }
  }
  // Clean up any dead connections found during broadcast
  dead.forEach((r) => clients.delete(r));
}

// ── GET /api/v1/live/status — how many clients are connected ──────
router.get("/status", (_req, res) => {
  res.json({ connectedClients: clients.size });
});

module.exports = { router, broadcast };
