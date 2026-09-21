---
name: SmartRide
description: Real-time community carpooling and ride-sharing platform
colors:
  primary: "#047857"
  primary-hover: "#065f46"
  primary-light: "#ecfdf5"
  secondary: "#c2410c"
  secondary-hover: "#9a3412"
  secondary-light: "#fff7ed"
  canvas: "#f6f8f7"
  card-bg: "#ffffff"
  recessed-bg: "#f8fafc"
  text-primary: "#0f172a"
  text-secondary: "#475569"
  text-muted: "#64748b"
  border-default: "#e2e8f0"
  border-subtle: "#cbd5e1"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-primary:
    backgroundColor: "{colors.card-bg}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: SmartRide

## Overview

**Creative North Star: "The Living Commute"**

SmartRide is built around the ethos of safe, vibrant, and human transit. Moving away from cold, clinical utility interfaces and generic AI dark-mode clichés, SmartRide embraces an airy, high-contrast daylight aesthetic anchored by an earthy Forest Emerald (#047857) and warm Sunrise Amber (#C2410C). The visual tone conveys unshakeable trust, verifiable safety, and everyday commuter convenience.

The interface organizes high-density trip telemetry, GPS maps, and multi-user interactions into a crisp, tactile 3-tier elevation model. Every screen is designed for high ambient light readability, rapid scannability on mobile viewports, and unmistakable feedback.

**Key Characteristics:**
- **Warm Daylight Canvas:** Clean, off-white surface (#F6F8F7) that eliminates harsh glare while maintaining deep contrast against Slate-900 typography.
- **Dual-Accent Hierarchy:** Forest Emerald acts as the reassuring anchor for verified identities, safe confirmations, and primary actions, while Sunrise Amber signals dynamic transit urgency, departure times, and live telemetry.
- **True 3-Tier Elevation:** Clear physical distinction between the base canvas, elevated white action cards, and recessed slate utility panels.
- **Legible, Human Typography:** Bold, geometrical Plus Jakarta Sans headings paired with the functional clarity of Inter for dense tabular metrics.

## Colors

The SmartRide palette is grounded in natural daylight tones, balancing high contrast and rich saturation with zero visual noise.

### Primary
- **Forest Emerald** (#047857 / #059669): The core brand identity color. Represents environmental sustainability, verified rider trust, safety confirmations, and primary workflow progression.
- **Emerald Mint Tint** (#ECFDF5): Soft container fill for active ride chips, verified driver badges, and positive eco-impact indicators.

### Secondary
- **Sunrise Amber** (#C2410C / #F97316): The dynamic transit accent. Reserved for active ride departure times, seat availability counters, urgent alerts, and secondary action highlights.
- **Warm Amber Tint** (#FFF7ED): Subtle background fill for live tracking badges, route warnings, and pending trip invitations.

### Neutral
- **Slate Carbon** (#0F172A): Primary high-contrast text color, ensuring deep readability across all cards and canvases.
- **Slate Muted** (#475569 / #64748B): Secondary and caption text, form labels, and subtle metadata.
- **Canvas Base** (#F6F8F7): The foundational page background.
- **Card Surface** (#FFFFFF): Pure white surface for primary interactive cards.
- **Recessed Panel** (#F8FAFC): Subtle slate-tinted surface for nested metadata sections, stats bars, and secondary filters.
- **Border Crisp** (#E2E8F0 / #CBD5E1): Deliberate 1px architectural containment for cards and interactive inputs.

### Named Rules
**The Dual Anchor Rule.** Emerald guides the user forward into confirmed trust; Amber draws attention to temporal urgency and live changes. Never use Amber for non-urgent decorative accents.
**The No-Mud Rule.** Never place washed-out gray text on colored backgrounds (e.g. text-slate-400 on bg-rose-50). On colored pill badges, text must be a high-contrast deep shade of that hue or crisp white.

## Typography

**Display Font:** Plus Jakarta Sans (with Inter, system-ui, sans-serif fallback)
**Body Font:** Inter (with Plus Jakarta Sans, system-ui, sans-serif fallback)
**Label/Mono Font:** Inter (with monospace fallback for numeric PINs and coordinates)

**Character:** Confident, structured, modern geometric sans-serif that remains razor-sharp at small sizes while projecting welcoming authority on titles.

### Hierarchy
- **Display** (Bold 700, clamp(2rem, 5vw, 3.25rem), 1.15 line-height): Hero headings, landing page statements, and major section intros.
- **Headline** (Bold 700, 1.75rem / 28px, 1.25 line-height): Page titles (Dashboard, Search Rides, Create Ride).
- **Title** (Semi-bold 600, 1.25rem / 20px, 1.35 line-height): Card headers, modal titles, and group names.
- **Body** (Regular 400, 1rem / 16px, 1.5 line-height): General descriptive copy, instructions, and list content. Max measure 65–75ch.
- **Label** (Medium 500, 0.875rem / 14px, 1.4 line-height): Form field labels, status pills, table headers, and secondary tags. Uses normal sentence casing rather than robotic all-caps.

### Named Rules
**The Sentence Case Rule.** Labels, badges, and headers must use Sentence case or Title Case. Never use ALL CAPS with heavy tracking for standard form labels or badge titles; reserve uppercase strictly for 3-4 letter acronyms (SOS, PIN, GPS, CO₂).

## Layout

SmartRide employs a responsive 12-column grid layout with fluid max-width constraints (max-w-7xl for main dashboards, max-w-4xl for single-column focus flows like Create Ride and Safety Settings).
- **Grid Gutters:** 16px (gap-4) on mobile viewports scaling to 24px (gap-6) and 32px (gap-8) on desktop displays.
- **Spatial Rhythm:** Consistent 8px spacing multiplier (8px, 16px, 24px, 32px, 48px). Section headers carry more whitespace above (32px) than below (16px) to maintain strong visual grouping with their associated content.
- **Touch Boundaries:** All interactive mobile buttons, filter chips, and map controls enforce a minimum touch target of 44x44px.

## Elevation & Depth

SmartRide uses physical tonal layering supported by subtle, high-diffusion ambient shadows. We refuse heavy, unnatural drop-shadows and generic artificial halos.

### Shadow Vocabulary
- **Surface Rest** (`box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`): Applied to all base glass cards and panels.
- **Card Hover** (`box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`): Interactive lift when a ride card or group card is hovered, accompanied by a -2px vertical translation.
- **Elevated Modal** (`box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`): Modals, dropdown flyouts, and floating map telemetry controls.

### Named Rules
**The 3-Tier Hierarchy Rule.** Level 0 is the muted canvas (`#F6F8F7`). Level 1 is the primary white card surface (`#FFFFFF`). Level 2 is the recessed utility panel (`#F8FAFC`). Never nest a pure white card inside another pure white card; use a recessed slate panel for internal grouping.

## Shapes

- **Base Radius:** 10px (`rounded-xl`) for form inputs, standard buttons, and filter chips.
- **Card Radius:** 16px (`rounded-2xl`) for primary containers, ride listings, and modal dialogs.
- **Pill Radius:** 9999px (`rounded-full`) for status indicators, avatar circles, and quick-filter tags.
- **Border Contours:** 1px solid `border-slate-200` framing all cards to ensure crisp physical boundaries on high-DPI displays.

## Components

### Buttons
- **Shape:** Rounded 10px (`rounded-xl`), font-weight 600.
- **Primary:** Forest Emerald background (`bg-brand-600 hover:bg-brand-700`), crisp white text (`text-white`), padding 10px 20px.
- **Secondary:** Clean white background (`bg-white hover:bg-slate-50`), subtle border (`border border-slate-200`), dark slate text (`text-slate-800`).
- **Accent (Transit):** Sunrise Amber (`bg-sunrise-600 hover:bg-sunrise-700`), white text (`text-white`).
- **Emergency SOS:** Rich crimson (`bg-rose-600 hover:bg-rose-700`), white text, bold emphasis.

### Chips
- **Style:** Compact pill (`rounded-full px-3 py-1 text-xs font-semibold`).
- **Verified Badge:** Emerald tint (`bg-emerald-50 text-emerald-800 border border-emerald-200`).
- **Live Status:** Amber tint (`bg-amber-50 text-amber-900 border border-amber-200`).
- **Neutral Tag:** Slate tint (`bg-slate-100 text-slate-700 border border-slate-200`).

### Cards / Containers
- **Corner Style:** 16px radius (`rounded-2xl`).
- **Background:** Pure White (`bg-white`).
- **Border:** 1px solid `border-slate-200/90`.
- **Internal Padding:** 20px to 24px (`p-5` to `p-6`).

### Inputs / Fields
- **Style:** White surface (`bg-white`), slate border (`border-slate-300 focus:border-brand-600`), 10px radius (`rounded-xl`), padding 10px 14px.
- **Focus:** Sharp emerald focus ring (`focus:ring-2 focus:ring-brand-500/20 focus:outline-none`).

### Navigation
- **Navbar:** Clean semi-translucent glass bar (`bg-white/90 backdrop-blur-md border-b border-slate-200`).
- **Links:** Slate-600 default (`hover:text-brand-700 font-medium transition-colors`).
- **Active State:** Emerald accent (`text-brand-700 font-semibold`).

### Signature Component
- **Ride Route Telemetry Card:** Features a vertical waypoint trail (green dot for origin, amber/red pin for destination, connected by a subtle dotted track), seat counter with avatar indicators, and instant booking CTA.

## Do's and Don'ts

### Do:
- **Do** maintain a strict 4.5:1 minimum contrast ratio for all secondary and metadata copy.
- **Do** use Sentence case for badges, button copy, and field labels.
- **Do** use the 3-tier elevation model (canvas -> card -> recessed panel) for complex information grouping.
- **Do** provide smooth transitions (`transition-all duration-200 ease-out`) on interactive hovers.
- **Do** preserve the dual-accent role: Emerald for verification/trust, Amber for departure/time/urgency.

### Don't:
- **Don't** use ALL CAPS for labels, table headers, or badges.
- **Don't** use pure gray text on colored badge backgrounds (e.g. `text-slate-400` on `bg-rose-50`).
- **Don't** use decorative gradient text (`bg-clip-text text-transparent`) on metrics or headings.
- **Don't** use heavy dark borders (`border-l-4`) or generic harsh drop shadows.
- **Don't** place white cards inside white cards without a recessed slate-50 boundary.
