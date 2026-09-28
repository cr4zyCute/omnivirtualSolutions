---
name: responsive-design-mastery
description: Comprehensive playbook for responsive design across mobile phones, tablets, laptops, desktops, and foldables. Covers layout, container queries, fluid typography, images, touch targets, and cross-device testing.
---

# Responsive Design Mastery Skill

## Purpose
Use this skill whenever a site or component needs to work correctly across phones,
tablets, laptops, desktops, and foldables — which is effectively every build. It goes
deeper than the general design skill's "mobile-first" note: this is the full playbook
for layout, typography, images, navigation, touch, and testing across devices.

## When to trigger
- Any new page/component build (responsiveness isn't optional, so this applies by default)
- "make this work on mobile" / "it looks broken on my phone" / "fix the layout on tablet"
- Reviewing an existing site for cross-device issues

---

## 1. Core principle: mobile-first, content-first

Design and code for the smallest viewport first, then add complexity as space allows —
never the reverse. Unprefixed CSS/Tailwind classes = the base (smallest) case; add
`min-width` breakpoints upward. Removing/hiding content at small sizes is a last resort,
not a starting strategy — decide what's essential first, then layer in extras for bigger screens.

---

## 2. Two kinds of "responsive" — use both

| Technique | Responds to | Use for |
|---|---|---|
| **Media queries** | The browser viewport | Page-level layout: overall grid, nav pattern, section stacking |
| **Container queries** | The component's own parent | Reusable components (cards, widgets) that appear in different contexts — sidebar vs. full-width vs. grid cell |

Container queries reached wide browser support in 2025 and are safe to use in production
without polyfills. A card component should query its container so it looks right whether
it's dropped into a 3-column grid or a narrow sidebar, without needing a page-level media query.

```css
.card-grid { container-type: inline-size; }

@container (min-width: 400px) {
  .card { flex-direction: row; }
}
```

Rule of thumb: **media queries for page layout, container queries for components.**

---

## 3. Breakpoints (defaults — adjust to real content, not device names)

Don't design "for iPhone" or "for iPad" — design for ranges of available width, since
device sizes constantly change. Reasonable starting breakpoints:

- **< 480px** — small phones
- **480–767px** — large phones
- **768–1023px** — tablets / small laptops
- **1024–1279px** — laptops / desktops
- **1280px+** — large desktops

Add a breakpoint only when the *content* breaks, not preemptively for every device on the market.

---

## 4. Fluid layout techniques

- **Fluid grids**: percentages, `fr` units, `flex`, or CSS Grid — never fixed pixel widths for containers.
- **Fluid typography**: use `clamp(min, preferred, max)` so text scales smoothly between breakpoints instead of jumping:
  ```css
  font-size: clamp(1.75rem, 4vw + 1rem, 3.5rem);
  ```
- **Fluid spacing**: same `clamp()` approach for large paddings/margins that should shrink on small screens.
- **Intrinsic sizing**: prefer `min()`, `max()`, `clamp()` over a wall of breakpoint overrides for every spacing value.

---

## 5. Viewport units for mobile — use the right one

Mobile browser chrome (address bar, etc.) resizes as the user scrolls, so plain `100vh`
is unreliable for full-screen sections on phones. Use the dynamic/small/large variants:

- `100dvh` — dynamic viewport height, adjusts as browser UI shows/hides (best default for "full screen" sections)
- `100svh` — smallest possible viewport height (safe minimum, no jump)
- `100lvh` — largest possible viewport height

Combine with safe-area insets for notches/home indicators:
```css
padding-bottom: env(safe-area-inset-bottom, 0px);
```

---

## 6. Images & media

- Always set explicit `width`/`height` (or `aspect-ratio`) attributes to prevent layout shift while loading.
- `max-width: 100%; height: auto;` on images by default.
- Use `srcset`/`sizes` (or a modern `<picture>` element) to serve appropriately sized images per viewport rather than shipping one large image to every device.
- Lazy-load offscreen images (`loading="lazy"`), but never lazy-load the hero/LCP image.
- Prefer WebP/AVIF with a fallback.

---

## 7. Navigation patterns across sizes

- **Phone**: collapse to a hamburger/menu button or bottom tab bar; primary actions should be reachable with a thumb (bottom half of screen).
- **Tablet**: often a hybrid — condensed horizontal nav or a persistent sidebar, depending on content density.
- **Desktop**: full horizontal nav is fine; don't hide items behind a hamburger just because you can — desktop has room, use it.
- Never rely on hover-only interactions for anything essential — touchscreens have no hover state. Every hover effect needs a touch/tap equivalent.

---

## 8. Touch vs. pointer input

- Minimum touch target: **44×44px** (Apple HIG / WCAG 2.2 AA) with adequate spacing between targets to avoid mis-taps.
- Don't rely on tiny icon-only buttons at phone sizes without extra padding.
- Interactive elements need enough gap (~8px minimum) so adjacent targets aren't accidentally hit.
- Test tap, not just click — cursor-precision affordances (fine hover tooltips, drag handles) need a touch-friendly fallback.

---

## 9. Performance considerations specific to mobile

- Mobile networks are slower and less reliable — this makes performance part of responsiveness, not a separate concern.
- Ship less JS/CSS to mobile where possible; avoid loading desktop-only assets (large hero videos, heavy carousels) unconditionally.
- Test on throttled 4G / mid-tier device profiles, not just a fast desktop on wifi.
- Core Web Vitals thresholds (LCP < 2.5s, CLS < 0.1, INP < 200ms) are measured on real-world devices, skewed toward mobile — optimize with that in mind.

---

## 10. Testing checklist

- [ ] Test real breakpoints: ~375px (small phone), ~768px (tablet), ~1024px (small laptop), ~1440px+ (desktop) — not just resizing a desktop browser window
- [ ] Test in both portrait and landscape orientation on mobile/tablet
- [ ] Check for horizontal scroll/overflow at every width (should never happen unintentionally)
- [ ] Verify tap targets are ≥44×44px with adequate spacing
- [ ] Confirm no hover-only functionality exists without a touch equivalent
- [ ] Confirm text remains readable (no tiny fonts, no overflow) at the smallest supported width
- [ ] Full-screen sections use `dvh`, not bare `vh`, and respect safe-area insets
- [ ] Images don't cause layout shift and are appropriately sized per viewport (check `srcset`)
- [ ] Test on an actual phone/tablet if possible, not just browser dev-tools emulation — emulation misses real touch behavior and actual network conditions
- [ ] Run Lighthouse mobile audit — no major layout/performance regressions

---

## 11. Common mistakes to avoid

- Designing desktop-first, then cramming it into mobile as an afterthought
- Fixed pixel widths on containers/cards that don't shrink
- Hiding critical content/actions on mobile "to reduce clutter" instead of redesigning the hierarchy
- Using `100vh` for mobile full-screen sections (causes jumpy layout as browser chrome shows/hides)
- Tiny tap targets crammed close together
- Hover-dependent menus/tooltips with no tap equivalent
- One giant image served at full desktop resolution to every device
- Testing only by resizing a desktop browser window and never on a real device

---

## 12. Reference resources
- MDN: Responsive Design — https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design
- MDN: CSS Container Queries — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries
- web.dev: Responsive images — https://web.dev/learn/design/responsive-images
- web.dev: Core Web Vitals — https://web.dev/articles/vitals
- WCAG 2.2 target size guidance — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
