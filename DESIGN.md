---
name: Departamento Psicopedagógico — Colegio Lord Byron
description: Internal case/incident/appointment tracker for a school's psychology department; institutional, evidence-first, quiet by default.
colors:
  primary: "#166c52"
  primary-foreground: "#ffffff"
  background: "#f5f6fa"
  foreground: "#1a2b23"
  card: "#ffffff"
  border: "#e1e3ea"
  muted-foreground: "#5e6c72"
  badge-stock: "oklch(0.99 0.006 100)"
  good: "#0d7a44"
  good-soft: "#dff8ec"
  warn: "#a8611c"
  warn-soft: "#fbeadb"
  critical: "#c62e46"
  critical-soft: "#fce1e5"
  info: "#005f8a"
  info-soft: "#dcedf5"
  purple: "#7a3bb0"
  purple-soft: "#f2e6fa"
typography:
  heading:
    fontFamily: "Poppins, ui-sans-serif, system-ui"
    fontWeight: 600
    letterSpacing: "0.025em"
  body:
    fontFamily: "Poppins, ui-sans-serif, system-ui"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
rounded:
  sm: "0.45rem"
  md: "0.6rem"
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
  3xl: "1.65rem"
  4xl: "1.95rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.xl}"
    padding: "14px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.xl}"
  badge-card:
    backgroundColor: "{colors.badge-stock}"
    rounded: "{rounded.4xl}"
    padding: "40px 20px 32px"
  alert-critical:
    backgroundColor: "{colors.critical-soft}"
    textColor: "{colors.critical}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  status-icon-well:
    backgroundColor: "{colors.warn-soft}"
    textColor: "{colors.warn}"
    rounded: "{rounded.xl}"
    size: "48px"
---

# Design System: Departamento Psicopedagógico — Colegio Lord Byron

## Overview

**Creative North Star: "The Institutional ID Badge"**

This system has two layers, and they should not be confused with each other. Underneath everything is a quiet, utilitarian app-wide token set — institutional green, cool near-white surfaces, a monday.com-style solid-fill status-color family — that predates this pass and already runs through the dashboards, forms, and the `sin-acceso` gate screen. On top of that, the login gate is the project's first surface built from an actual direction contract, and it commits to a single object metaphor: the page is not a marketing split-screen and not a bare button on a void, it is one physical thing — an institutional ID badge / access-terminal card, centered on a quiet secured backdrop, that a staff member already knows they're allowed to hold.

The badge world earns its materiality honestly. Where the build's own finish review caught an invented device — a chrome/metal gradient standing in for a badge grommet — it was corrected to a flat ring built only from `--border` and `--background`; where a "dashed divider" read as a literal CSS dashed border, it shipped instead as a true row of perforation dots. Nothing in this system should look photoreal or use a fake-material gradient to sell a physical object; flat tone-on-tone shapes carry the metaphor instead.

**Key Characteristics:**
- One hero object per gate screen, not a hero-image-plus-form split.
- Institutional green (`--primary`) as ink and accent, never as a large background fill.
- Card-stock white (`--badge-stock`) reserved for the one surface meant to read as a held physical object; every other surface uses plain `--card` or `--background`.
- Elevation on that one object is tinted with the primary hue, not neutral black.
- Security/texture backdrops stay near-invisible (5% opacity) — texture, never pattern.
- State color communicates via a solid/soft pair (`--critical`/`--critical-soft`, etc.) reused identically across the gate and the rest of the app.

## Colors

The palette is a single institutional accent over a cool neutral base, plus a five-color solid/soft status family shared app-wide.

### Primary
- **Institutional Green** (`#166c52`, `oklch(47.5% 0.089 167.5)`): the school's ink color. Used for the badge card's heading text, the primary action's fill, focus rings, and — at 5% opacity — the diagonal hairline security backdrop. Never used as a large flat background.

### Neutral
- **App Background** (`#f5f6fa`): the page ground everywhere except the badge card itself.
- **Card White** (`#ffffff`): standard surface for ordinary cards, dialogs, and the `sin-acceso` panel.
- **Card Stock** (`oklch(0.99 0.006 100)`, token `--badge-stock`): a hair warmer than pure white, used only for the login badge card so it reads as held stock rather than a flat digital panel. Scoped to this one surface — do not substitute it for `--card` elsewhere.
- **Ink** (`#1a2b23`): body text.
- **Hairline** (`#e1e3ea`, token `--border`): dividers, card borders, the grommet ring, the perforation dots.
- **Muted Ink** (`#5e6c72`, token `--muted-foreground`): secondary copy (fine print, helper text).

### Status Family (solid / soft pairs, shared app-wide)
- **Good** (`#0d7a44` / soft `#dff8ec`)
- **Warn** (`#a8611c` / soft `#fbeadb`) — used for the `sin-acceso` pending-activation icon well.
- **Critical** (`#c62e46` / soft `#fce1e5`) — used for the login's auth-failure alert.
- **Info** (`#005f8a` / soft `#dcedf5`)
- **Purple** (`#7a3bb0` / soft `#f2e6fa`)

### Named Rules
**The Tinted Shadow Rule.** Elevation on a "physical object" surface (the badge card) is tinted with `--primary`, not neutral black (`rgba(22,108,82,…)`, not `rgba(0,0,0,…)`). Ordinary UI surfaces elsewhere do not carry this treatment — it marks the one object the system asks you to believe is a held thing.

**The One Accent Rule.** `--primary` is ink and action color, never a fill. If a screen needs a large green surface, that is a sidebar-scoped exception (`--sidebar`), not this rule.

## Typography

**Heading/Body Font:** Poppins (with `ui-sans-serif, system-ui` fallback) — weights 400/500/600/700 loaded app-wide.
**Label/Mono Font:** Geist Mono (with `ui-monospace` fallback).

**Character:** There is no display/body font pairing — `--font-heading` and `--font-sans` resolve to the same Poppins family. Hierarchy is carried by weight, size, and letter-spacing, not by switching typefaces. Geist Mono is reserved for one job: rendering literal institutional strings (a domain, a technical error) verbatim, signaling "this is copied data, not prose."

### Hierarchy
- **Title** (600, `text-lg`/18px, uppercase, `tracking-wide`): the badge card's institutional heading ("Departamento Psicopedagógico").
- **Body** (400, `text-sm`/14px): captions and helper copy (org name, fine print).
- **Label/Mono** (400, `text-xs`/12px, Geist Mono): verbatim institutional identifiers — the `@byron.edu.pe` domain, an auth error detail string.

### Named Rules
**The Verbatim-Mono Rule.** Any string that is copied data rather than authored copy (a domain suffix, an error code, a technical detail) renders in Geist Mono. Authored sentences around it stay in Poppins.

## Layout

Single-column, single-object composition: one card, centered, constrained to `max-w-[380px]`, on a full-bleed textured ground (`min-h-screen`, flex-centered). Card internal padding steps up at the `sm` breakpoint (640px): `px-5` on narrow viewports, `px-8` from `sm` up, with a fixed `pt-10 pb-8` vertical rhythm. This is a gate screen, not a dashboard grid — it carries no sidebar, no nav, no secondary content; "nothing else" from the direction contract is the layout rule, not just a description.

## Elevation & Depth

Two different elevation vocabularies coexist, and they are not interchangeable. Most of the app is flat, using the status solid/soft color pairs (e.g. the `sin-acceso` warn-icon well) rather than shadows to convey state. The login badge card is the one place the system lifts a surface off the page, and it does so with a three-layer, hue-tinted shadow rather than a generic drop shadow:

### Shadow Vocabulary
- **Badge Lift** (`inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(22,108,82,0.08), 0 24px 48px -16px rgba(22,108,82,0.28)`): the badge card's only shadow. Inner highlight simulates card stock catching light; the two outer layers are both tinted with the primary green, not black, so the object reads as belonging to this institution rather than as a generic floating panel.
- **Grommet Inset** (`inset 0 1px 2px rgba(0,0,0,0.1)`): the one neutral (untinted) shadow in the system, reserved for the small hardware detail (the grommet ring) where a tinted shadow would misread as colored plastic instead of a punched hole.

### Named Rules
**The Flat-Elsewhere Rule.** Outside the badge card, the system stays flat. Depth for ordinary state (warnings, pending states, errors) comes from the solid/soft color pair, not from a shadow.

## Shapes

Two radius tiers, deliberately not unified: containers get the largest radius the scale offers, controls inside them get a mid radius, and only true circles (the grommet) break the scale entirely.

- **Container radius — `rounded-4xl` (1.95rem):** the badge card itself. This is the largest step on the scale (`--radius` × 2.6) and is reserved for the one hero object per gate screen.
- **Control radius — `rounded-xl` (1.05rem):** the primary action button. Roughly half the container's radius — controls read as inset elements sitting inside the object, not as siblings of it.
- **Small-surface radius — `rounded-md` (0.6rem):** inline alerts (the critical auth-error box).
- **Circular hardware — `rounded-full`:** the grommet ring only; a flat ring built from `--border` (stroke) and `--background` (fill), 3px wide, straddling the card's top edge. No bevel, no metal gradient — the finish review rejected that as an imitation-material contradiction, and the flat ring is the corrected, shipped shape.
- **Perforation:** not a border style. It is a `radial-gradient(circle, var(--border) 1px, transparent 1.3px)` repeated at `8px 4px`, i.e. a literal row of punched dots, not `border-style: dashed`.

## Components

### Buttons
- **Shape:** `rounded-xl` (1.05rem), full width within its container.
- **Primary:** `--primary` fill, `--primary-foreground` text, `py-3.5` (14px) vertical padding, 500-weight label.
- **Hover / Focus:** background steps to `--primary`/90% opacity; focus-visible gets a 3px `--ring`/50% ring plus a `--ring`-colored border, no outline. `active:scale-[0.98]` on press. Transition timing is `--ease-out` (`cubic-bezier(0.23,1,0.32,1)`), 150ms for color/border/shadow.
- **Disabled:** `cursor-wait`, 60% opacity, while the OAuth redirect is in flight (spinner replaces the icon).

### Alerts
- **Style:** solid/soft status pair, `rounded-md`, left-aligned text inside a centered card. Technical detail (if present) renders in Geist Mono at `text-xs`.

### Icon Wells (from `sin-acceso`, corroborating the app-wide status pattern)
- **Style:** `size-12`, `rounded-xl`, centered icon, soft status background + solid status icon color (e.g. `bg-warn-soft text-warn`). Confirms the solid/soft status pair is a real system convention, not a login-only invention.

### Badge Card (signature component)
The login's one hero object. `rounded-4xl`, `--badge-stock` background, `--border` outline, Badge Lift shadow. Structure top to bottom: crest image (56px), uppercase title, caption, perforation divider, primary action, fine print. A grommet ring (flat, `--border`/`--background`) straddles the card's top-center edge, anchoring the "physical badge" read.

### Security Backdrop (signature component)
A full-bleed `aria-hidden` layer behind the card: `repeating-linear-gradient(135deg, var(--primary) 0px, var(--primary) 1px, transparent 1px, transparent 16px)` at 5% opacity. Diagonal hairlines at 16px pitch, tinted with the institutional green. Reads as security-paper texture, not as a visible pattern — opacity is load-bearing; do not raise it for "visibility."

### Holographic Sweep (signature micro-interaction, scoped to this one button)
A skewed gradient band (`transparent → sky-blue 0.4 → violet 0.4 → gold 0.35 → transparent` at 100deg) sits at `-left-1/3`, clipped inside the button, and translates to `400%` on hover over 700ms (`--ease-out`), disabled under `prefers-reduced-motion`. This is the one ornamented interaction in the whole system, tied specifically to the single verification action on the gate. See Do's and Don'ts — it is not a general button treatment.

## Do's and Don'ts

### Do:
- **Do** tint the badge card's shadow with `--primary`, not black — elevation on the one "physical" surface should read as belonging to the institution.
- **Do** build perforation/ticket-edge effects as a dotted `radial-gradient`, never `border-style: dashed`.
- **Do** render small hardware details (rings, grommets) as flat shapes using only `--border`/`--background` — never a fabricated chrome or bevel gradient standing in for a real material.
- **Do** keep security/texture backdrops at ~5% opacity so they read as paper texture, not as a visible motif.
- **Do** give a hero "object" component a larger radius (`rounded-4xl`) than the controls inside it (`rounded-xl`) — containers and controls should not share a radius tier.
- **Do** reuse the solid/soft status color pair for any state communication (warn, critical, good, info, purple) rather than inventing a new state palette per screen.

### Don't:
- **Don't** fabricate a metal/glass/chrome gradient to represent a real-world material — the build's own finish review rejected exactly this on the grommet ring, and it shipped flat instead.
- **Don't** apply the holographic hover-sweep to ordinary buttons app-wide. It is reserved for this one high-stakes verification action; putting it on every primary button would turn a signature moment into decoration.
- **Don't** reuse `--badge-stock` as a general card background. It exists to make one surface read as held card stock; using it elsewhere erases that distinction.
- **Don't** raise the security-hairline backdrop's opacity, or apply it to ordinary app screens (dashboards, forms) — it belongs to the gate's "secured terminal" story, not to the rest of the product.
