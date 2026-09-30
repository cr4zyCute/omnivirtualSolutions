---
name: admin-cms-live-editing
description: >-
  Use whenever the task is: build an admin panel that mirrors the public
  site's actual pages, lets an editor change text/images in place, saves to the
  database, and pushes those changes to anyone currently viewing the public site
  instantly, with no page reload. This is a self-built lightweight CMS pattern,
  not a form-based "admin dashboard" — the admin view IS the site, just editable.
---

# Admin CMS with Live-Editing & Real-Time Sync Skill

## Purpose
Use this skill whenever the task is: build an admin panel that mirrors the public
site's actual pages, lets an editor change text/images in place, saves to the
database, and pushes those changes to anyone currently viewing the public site
instantly, with no page reload. This is a self-built lightweight CMS pattern,
not a form-based "admin dashboard" — the admin view IS the site, just editable.

## When to trigger
- "let me edit the website content from an admin page"
- "changes should show up live on the site"
- "build a CMS" / "editable homepage/services page"
- Any request layering content-editing onto an existing DB-backed site (Express +
  SQL/libsql/Turso, or similar stack)

---

## 1. Architecture overview

The DB is the single source of truth. Both the admin page and the public page
render from it. The admin page reuses the exact same templates/components as the
live site, just rendered in an editable mode — it is not a separate abstraction
bolted on top.

Flow for one edit:
1. Editor clicks into a text field or image on the admin page and edits in place.
2. On save (blur, or explicit Save button), the admin page sends a PATCH request to
   an authenticated API route.
3. The server validates the input and writes it to the DB.
4. The server broadcasts a small event describing the change over SSE/WebSocket to
   every connected client.
5. Any open public page listening for that key updates the DOM directly — no reload.

This builds directly on the backend you already have (services.js and site.js
reading from the DB, seed.js having populated it) — this skill adds the write path
and the live-push layer on top of that foundation.

---

## 2. Data model: generic content blocks (don't hardcode a column per field)

Hardcoding a DB column for every editable piece of text doesn't scale, especially
with 131 service pages. Use a generic key-value content table alongside your
existing structured tables for freeform editable fields:

    CREATE TABLE content_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_key TEXT UNIQUE NOT NULL,
      block_type TEXT NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    );

block_key is a stable, human-readable identifier your templates reference, e.g.
home.hero.title, home.hero.image, service.basic.description. Design these keys
before writing any editing UI.

For content that already has a proper structured home — services with price,
features, slug, in your existing services table — keep editing those real columns
directly through PATCH /api/v1/services/:slug rather than duplicating that data
into the generic block table. Use content_blocks for loose page copy that doesn't
have a natural column already: hero headlines, about text, homepage sections.

---

## 3. Making the public template "block-aware"

Every editable spot on the public page gets a data-block-key marker (or similar
attribute), so both the initial server-side render and the live-update script know
what to target:

    <h1 data-block-key="home.hero.title">Welcome to Omni</h1>
    <img data-block-key="home.hero.image" src="/images/hero.jpg" alt="Hero" />

The server-side render pulls current values by key from the DB and injects them, so
the page always loads with correct current content. Live-push only updates an
already-open tab without a reload — it is not the only path to correctness.

---

## 4. Admin page: edit-in-place, not a separate form UI

- Render the exact same page template as the public site, behind an /admin/... route
  (or an admin flag) that reuses the same partials/components.
- Make elements with a data-block-key editable directly: contenteditable="true" on
  text elements is the simplest approach; an inline textarea overlay positioned on
  click gives more control over save timing if needed.
- For images, clicking opens a small picker (see section 6) rather than making the
  img tag itself editable.
- Save triggers: on blur for text (debounced ~500ms after the last keystroke rather
  than firing per keystroke), immediately on selection for images.
- Show a small saving/saved indicator near the field so editors have confidence the
  change actually persisted, since there is no separate "Save page" step.
- Auth-gate the entire admin route — this page can write to the database, so it must
  never be reachable by an unauthenticated visitor (see section 7).

---

## 5. Real-time push: Server-Sent Events (SSE)

For this use case — the server broadcasts content changes to viewers, and viewers
never need to send data back over that same channel — Server-Sent Events (SSE) is
simpler than a full WebSocket and is sufficient.

---

## 6. Image editing: upload AND pick existing

Support both through one small media picker component.

---

## 7. Authentication & authorization (critical — do not skip)

This admin panel writes directly to your live database and broadcasts to every
visitor, so it must be properly gated with JWT or session-based authentication.

---

## 8. Optional but recommended: a simple revision safety net

    CREATE TABLE content_block_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_key TEXT NOT NULL,
      value TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      changed_by TEXT
    );

---

## 9. Notes specific to your current stack

Based on your existing build — Express, @libsql/client on Turso, backend/db.js,
backend/routes/, and a seeded services table:

- Add content_blocks, content_block_revisions, and admin_users through a new migration.
- Add backend/routes/live.js for the SSE endpoint and its broadcast() export.
- Add backend/routes/auth.js for login/token management.
- Add backend/middleware/auth.js for JWT verification.
- Add backend/routes/cms.js for authenticated PATCH/upload handlers.
- Since the site is currently served as static HTML, use a client script that fetches
  current values on load and then listens for live SSE updates.
