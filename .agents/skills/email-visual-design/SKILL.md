---
name: email-visual-design
description: Design companion for client-facing emails covering visual hierarchy, layout, typography, branding, and ready-made email templates that render reliably across email clients.
---

# Email Visual Design & Templates Skill

## Purpose
This is the **design companion** to `EMAIL-UI-SKILL.md`. That skill covers how to
code an email so it survives Outlook/Gmail's broken rendering engines (tables,
inline CSS, dark mode fallbacks). This skill covers how to make that email actually
look good and on-brand once it renders — layout, typography, color, hierarchy — plus
a set of ready-made templates in `email-templates/` built on both skills together.

**Always use this skill together with `EMAIL-UI-SKILL.md`, never instead of it** —
a beautifully designed email that ignores the rendering constraints will be the one
that breaks in Outlook.

## When to trigger
- "make this email look good / on-brand / polished"
- "design a welcome/receipt/notification email for clients"
- "I need an email template" (use the ready-made ones in `email-templates/` as a
  starting point, then adjust tokens to match the specific brand)

---

## 1. Visual structure: the standard anatomy

Every client-facing email, regardless of type, follows roughly this structure —
consistency across email types is itself a trust signal to recipients:

1. **Header** — logo only (or logo + one-line tagline), centered or left-aligned,
   consistent across every email type so recipients instantly recognize the sender.
2. **Hero / headline** — the single most important line, large and short. One
   sentence stating what this email is about, not a paragraph.
3. **Body content** — the specifics (order details, the actual message, instructions).
   Broken into clear visual sections if there's more than one topic.
4. **Primary CTA** — one obvious button for the one action you want taken. Avoid
   multiple competing CTAs of equal visual weight — if there are secondary actions,
   make them visually subordinate (text link, not another button).
5. **Footer** — company name/address (required for marketing mail in most
   jurisdictions), unsubscribe link if applicable, and a muted secondary-contact line.

Don't skip the hero/headline step even for short transactional emails — "Your order
shipped" as a clear headline beats making the recipient read a paragraph to find
that out.

---

## 2. Layout & spacing

- **600px max width**, centered, with consistent outer padding (24px is a safe
  default) so the email doesn't touch the edges of the inbox viewport.
- **Single column on mobile, always** — most email opens happen on mobile, and a
  single column is the one layout guaranteed to render correctly everywhere (see
  the fluid-hybrid pattern in `EMAIL-UI-SKILL.md` section 4).
- **Consistent vertical rhythm**: pick a spacing scale (e.g. 8/16/24/32/48px) for
  padding between sections, the same discipline as the website's spacing scale —
  reuse your actual site's spacing tokens here for brand consistency.
- **Generous whitespace over dense packing** — a cramped email reads as lower
  quality and is harder to scan on a small phone screen.

---

## 3. Typography

- **Web-safe stack with brand intent**: pick a font stack that's as close to your
  site's brand typeface as reasonably renders everywhere — `Arial, Helvetica,
  sans-serif` or `Georgia, 'Times New Roman', serif` are the safest bets; a custom
  web font is a nice-to-have with a mandatory fallback (see `EMAIL-UI-SKILL.md`).
- **Simple type scale** (reuse the 5-step scale from `SKILL.md` where reasonable,
  scaled down slightly for email's typically smaller viewing context):
  - Headline: 24–28px, bold
  - Body: 16px, line-height 1.5–1.6
  - Small/meta text (footer, fine print): 12–13px
- **Short line length** — email content columns are narrow (≤600px) by design,
  which naturally keeps line length readable; don't fight it by cramming long
  unbroken paragraphs — break into short paragraphs and bullet points instead.
- **Left-align body text** — centered paragraphs are harder to read past one or two
  lines; reserve centering for short headlines/CTAs only.

---

## 4. Color & branding

- **One primary brand color, used deliberately** — the CTA button and any key
  accent, not splashed across every element (same "one accent, used sparingly"
  principle as the website design skill).
- **Neutral body background** (off-white, not stark white — see dark-mode notes in
  `EMAIL-UI-SKILL.md`) with a white or near-white content card for contrast.
- **Reuse your actual site's color tokens** so the email doesn't feel like a
  disconnected experience from the website/app — pull the same primary/neutral
  values used in `tailwind.config.js` if you're using the Vite+Tailwind stack from
  the other skills in this folder.
- **Status colors used sparingly and consistently**: a consistent green for
  success/confirmation, amber for warning/pending, red for error/failure, used the
  same way across every email type — not reinvented per template.

---

## 5. Imagery & logo

- **Transparent PNG logo** (not a logo flattened onto a white box) — this also
  satisfies the dark-mode requirement from `EMAIL-UI-SKILL.md`.
- Keep decorative imagery minimal — email is mostly read as text first (images are
  often blocked by default); use imagery to support the message, never to carry it alone.
- If using a product screenshot or photo, keep it to one clear focal image per
  email rather than a gallery — a single well-chosen image reads cleaner than several.

---

## 6. Tone & copy pairing with design

- **Headline states the outcome, not the mechanism**: "Your order is on its way" not
  "Order status update." The design hierarchy (section 1) only works if the
  headline earns its visual prominence with an actually useful sentence.
- **Body copy: short sentences, scannable structure** (bullets/short paragraphs) —
  match the visual whitespace-forward layout with similarly light copy; a dense
  paragraph undoes clean spacing.
- **CTA button text is a verb phrase**, not a generic "Click here" — "View your
  order," "Confirm your email," "Reset your password."

---

## 7. Review checklist (visual/brand polish, pair with the technical checklist in EMAIL-UI-SKILL.md)
- [ ] Logo, colors, and type stack are visually consistent with the website/app
- [ ] One clear headline states the email's purpose in a single short sentence
- [ ] One primary CTA, visually dominant; any secondary action is visually subordinate
- [ ] Spacing is consistent and generous — not cramped, not inconsistent between sections
- [ ] Body copy is short and scannable, not a dense paragraph block
- [ ] Status/accent colors used consistently with their meaning across every email type
- [ ] Footer includes company identity and (for marketing mail) a working unsubscribe link

---

## 8. Ready-made templates

See `email-templates/` alongside this file — four starting templates built using
both this design system and the technical rules from `EMAIL-UI-SKILL.md`:

| File | Use for |
|---|---|
| `welcome.html` | New account / signup confirmation |
| `contact-form-confirmation.html` | Confirming receipt of a client's inquiry/contact form submission |
| `notification.html` | General update/notification to a client (status change, new message, etc.) |
| `invoice-receipt.html` | Order confirmation / payment receipt |

Each uses CSS custom-property-style placeholder values at the top (as HTML
comments, since real CSS variables aren't reliable in email) for brand color and
logo URL — swap those per project rather than rebuilding the structure from scratch.
