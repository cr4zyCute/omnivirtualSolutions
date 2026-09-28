---
name: website-creation-design
description: >-
  Use whenever the task is to design, build, redesign, or review a website —
  landing pages, marketing sites, portfolios, dashboards, or full multi-page builds.
  Covers visual/UX design decisions, HTML/CSS/JS implementation, responsiveness,
  accessibility, performance, and pre-launch QA.
---

# Website Creation & Design Skill

## Purpose
Use this skill whenever the task is to design, build, redesign, or review a website —
landing pages, marketing sites, portfolios, dashboards, or full multi-page builds.
It covers the full pipeline: visual/UX design decisions, HTML/CSS/JS implementation,
responsiveness, accessibility, performance, and pre-launch QA.

## When to trigger
- "build me a website / landing page / portfolio site"
- "redesign this site" / "make this page look more modern"
- "review my site's design/UX/performance"
- any request that will produce `.html`, `.css`, or a frontend component meant to be *looked at*

---

## 1. Workflow

1. **Clarify intent (one question max, then proceed with assumptions stated inline)**
   - Who is this for, and what's the one action a visitor should take?
   - Brand tone: e.g. minimal/corporate, bold/playful, editorial, technical.
   - Any existing brand colors/logo/fonts to respect?
2. **Information architecture** — list pages/sections before any visual work. Cap primary nav at ~7 items.
3. **Layout & wireframe (text-first)** — decide grid, section order, content hierarchy before styling.
4. **Visual design** — apply the design system below (palette, type scale, spacing, components).
5. **Build** — semantic HTML, mobile-first CSS, minimal JS. One reused layout/component pattern rather than one-off styling per section.
6. **QA pass** — run the checklist in section 5 before delivering.

Don't skip straight to code with no IA/wireframe step — that's how sites end up unbalanced and hard to edit later.

---

## 2. Design system defaults

### Typography
- Max 2 typefaces: one for headings, one for body (or one family, two weights).
- Base body size 16–18px, line-height 1.5–1.65, measure (line length) 60–75 characters.
- Type scale: use a ratio (1.25–1.5) across ~5 steps (e.g. 14/16/20/28/40/56px) rather than arbitrary sizes.
- Never rely on font weight/size alone for hierarchy — pair with spacing and color.

### Color
- One dominant neutral (background/text), one primary brand color, one accent used sparingly (CTAs, highlights only — not decoration everywhere).
- Check contrast: body text ≥ 4.5:1, large text/UI ≥ 3:1 (WCAG 2.2 AA). The WebAIM Million audit found the majority of scanned sites still fail contrast checks — always verify, don't eyeball it.
- Support light/dark via CSS custom properties (`:root` tokens), not hard-coded hex scattered through the file.

### Layout & spacing
- Mobile-first: design the small screen first, then expand.
- Use a consistent spacing scale (e.g. 4/8/16/24/32/48/64px) — no arbitrary margins.
- Fluid grids/flexbox/CSS grid with relative units (%, rem, fr) over fixed pixel widths.
- Generous whitespace over dense packing; whitespace is a design element, not empty space to fill.

### Components
- Reuse one card / button / section pattern across the whole site rather than inventing new styles per page.
- Buttons: clear primary vs secondary distinction, obvious hover/focus states, min 44×44px touch target.
- Forms: visible labels (not placeholder-only), inline validation, clear error text.

---

## 3. Technical standards

**HTML**
- Semantic elements (`header`, `nav`, `main`, `section`, `article`, `footer`) over div soup.
- One `h1` per page, logical heading order (no skipped levels).
- `<meta name="viewport" content="width=device-width, initial-scale=1">` always.

**CSS**
- Mobile-first media queries (`min-width` breakpoints).
- CSS custom properties for color/spacing/type tokens.
- Avoid `!important` and deep specificity fights; prefer a flat, component-scoped structure.

**Performance**
- Compress/lazy-load images; prefer WebP/AVIF; set explicit width/height to avoid layout shift.
- Minify CSS/JS; avoid unnecessary third-party scripts; self-host or CDN-cache fonts.
- Target Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms.

**Accessibility (WCAG 2.2 AA baseline)**
- Keyboard-navigable, visible focus states, alt text on meaningful images, sufficient contrast (see above), form labels, ARIA only when semantics can't do the job.

**Security & trust**
- HTTPS everywhere, secure form handling, no exposed secrets/API keys in client code, keep any CMS/plugins updated.

**SEO basics**
- Unique `<title>` and meta description per page, descriptive URLs, structured content (proper headings), sitemap for multi-page sites.

---

## 4. Stack: Vite + Tailwind

This is the default toolchain for this project. Rules specific to it:

- **Tokens live in `tailwind.config.js`, not in the markup.** The type scale, spacing
  scale, and color palette from section 2 are already wired into `theme.fontSize`,
  `theme.spacing`, and `theme.extend.colors` in the starter config. Extend that config
  rather than reaching for arbitrary values (`text-[19px]`, `mt-[13px]`) — arbitrary
  values are a signal the token scale is missing something, so add it to the config
  instead of one-off overriding it in a class.
- **One component pattern, reused via classes, not duplicated markup.** If a card/button
  pattern repeats more than twice, extract it into a small component (React/Vue) or a
  `@layer components` class in `style.css` — don't keep pasting the same utility string.
- **Mobile-first** is Tailwind's default behavior (unprefixed = mobile, `sm:`/`md:`/`lg:`
  add up from there) — write the no-prefix classes for the smallest screen first.
- **`@apply` sparingly** — only to name a genuinely reusable pattern (`.btn-primary`),
  not to avoid writing utility classes in markup.
- Run `npm install` then `npm run dev` in the starter to boot it; `npm run build` for
  a production build in `dist/`.

If the project instead needs a CMS-backed content site, prefer a static site generator
(Astro/Eleventy/Next.js) over a heavy legacy CMS for performance — but Vite + Tailwind
is the default for anything else.

---

## 5. Pre-delivery checklist
- [ ] Works and looks correct at 375px, 768px, 1280px+ widths
- [ ] Lighthouse/PageSpeed: no major performance or accessibility flags
- [ ] Color contrast checked, not assumed
- [ ] All interactive elements reachable and operable by keyboard
- [ ] Images have alt text; decorative images marked `alt=""`
- [ ] No layout shift on load (images/ads/fonts sized)
- [ ] Meta title/description present on every page
- [ ] Forms have real labels and validation feedback
- [ ] Cross-browser sanity check (Chrome + Safari minimum)

---

## 6. Curated reference library (free, no paywall)

**Foundational / whole-book guides**
- *Resilient Web Design* — Jeremy Keith — https://resilientwebdesign.com/ (history + principles of durable web design)
- *Designing for the Web* — Mark Boulton — free e-book covering layout, typography, color, UX
- *Taking Your Talent to the Web* — Jeffrey Zeldman — https://zeldman.com/2009/04/16/taking-your-talent-to-the-web-is-now-a-free-downloadable-book-from-zeldmancom/

**Typography**
- *Practical Typography* — Matthew Butterick — https://practicaltypography.com/
- *On Web Typography* — Jason Santa Maria
- *Web Typography* (Richard Rutter) — https://github.com/clagnut/webtypography
- *UI Typography* — https://imperavi.com/books/ui-typography/

**Curated ebook lists (jumping-off points, updated regularly)**
- Speckyboy: "50+ Free eBooks for Web Designers & Developers" — https://speckyboy.com/free-web-design-ebooks/
- Hongkiat: "50 Free Ebooks for Web Designers and Developers" — https://www.hongkiat.com/blog/ebooks-for-web-designers/

**Standards & technical references**
- MDN Web Docs (HTML/CSS/JS/accessibility reference) — https://developer.mozilla.org/
- WCAG 2.2 guidelines — https://www.w3.org/WAI/WCAG22/quickref/
- web.dev (Google, Core Web Vitals & performance) — https://web.dev/

Use these as background knowledge, not as content to copy — always produce original layouts, copy, and code tailored to the specific project.
