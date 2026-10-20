---
name: Cockpit
description: Restrained workspaces built with Cockpit's existing base-maia shadcn system.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  primary: "oklch(0.841 0.238 128.85)"
  primary-foreground: "oklch(0.405 0.101 131.063)"
  secondary: "oklch(0.967 0.001 286.375)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  background-dark: "oklch(0.145 0 0)"
  foreground-dark: "oklch(0.985 0 0)"
  card-dark: "oklch(0.205 0 0)"
  primary-dark: "oklch(0.768 0.233 130.85)"
  secondary-dark: "oklch(0.274 0.006 286.033)"
  muted-dark: "oklch(0.269 0 0)"
  muted-foreground-dark: "oklch(0.708 0 0)"
  border-dark: "oklch(1 0 0 / 10%)"
  input-dark: "oklch(1 0 0 / 15%)"
  ring-dark: "oklch(0.556 0 0)"
  destructive-dark: "oklch(0.704 0.191 22.216)"
typography:
  headline:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: "1.5rem"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  control:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  metadata:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
  mono:
    fontFamily: "Geist Mono, monospace"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
  4xl: "1.625rem"
spacing:
  1: "0.25rem"
  1.5: "0.375rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "color-mix(in oklch, var(--input) 30%, transparent)"
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "2.25rem"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "2.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.4xl}"
    padding: "0 0.75rem"
    height: "2.25rem"
  input:
    backgroundColor: "color-mix(in oklch, var(--input) 30%, transparent)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.4xl}"
    padding: "0.25rem 0.75rem"
    height: "2.25rem"
  tabs:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.4xl}"
    padding: "3px"
    height: "2.25rem"
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.4xl}"
    padding: "0.125rem 0.5rem"
    height: "1.25rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
  qa-checklist:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
---

# Design System: Cockpit

## Overview

**Creative North Star: "Restraint, layout and interaction quality"**

Cockpit uses its existing neutral base-maia shadcn preset, local Geist fonts and lime primary accent. Familiar controls, clear hierarchy and modest density give the work priority. This records the shipped system; it does not establish a separate QA identity.

The QA workspace applies that system to selecting checks, inspecting estimates and starting runs. Its composition is scoped to QA. Bencho's restraint, layout and interaction quality are the confirmed reference; flatter grouping and fewer repeated labels keep the next action clear.

**Key Characteristics:**
- Semantic neutral surfaces in light and dark themes.
- Compact Geist hierarchy and pill-shaped controls.
- Borders, rings and tonal grouping at rest; elevation for overlays.
- Progressive detail and clear next actions.

## Colors

The palette pairs near-neutral surfaces with a bright lime action accent. Frontmatter preserves the source OKLCH values; `-dark` entries record the corresponding `.dark` overrides.

### Primary
- **Cockpit Lime:** primary actions and checked boxes. Use its paired dark green foreground for text and icons on the fill.

### Neutral
- **White / Near Black:** background and foreground reverse between themes; cards and popovers use their semantic surface roles.
- **Soft Neutral:** secondary controls, tab tracks and subtle group rows. Muted foreground carries supporting descriptions, not disabled-state meaning by itself.
- **Fine Neutral Stroke:** border and input roles delineate containers and fields; ring is reserved for focus treatment.

Destructive red identifies failure and invalid state. Failed badges use the source's derived `--destructive-text`, a mix toward foreground, rather than substituting the fill color as text. Outcomes also include words and icons.

**The Semantic Pair Rule.** Use each surface with its paired foreground and let the existing theme variables switch together.

## Typography

**Body and Heading Font:** locally hosted Geist, with Arial and sans-serif fallbacks. **Mono Font:** locally hosted Geist Mono for code and logs. There is no separate display face in the sampled system.

- **Headline:** compact page headings using the frontmatter headline role.
- **Title:** card and overlay headings. QA section headings use a medium-weight step (18px).
- **Body:** standard interface copy; explanatory paragraphs increase line-height to 24px.
- **Control:** medium-weight button, tab and section labels.
- **Metadata:** build context, methods, devices and supporting details. Badges use the same small size with medium weight.

Use tabular numerals for check counts, duration and money. Inputs retain the preset's larger narrow-screen text (16px), becoming 14px from the medium breakpoint.

## Layout

The shared `page-column` utility provides a centered prose column (42rem maximum, 24px horizontal padding). It is not the QA workspace's container.

QA uses a centered work column (48rem maximum, 24px horizontal padding). Its quiet task-style header has 32px top padding, increasing to 48px from 640px. Content groups generally use 24px gaps; checklist rows use 12px vertical padding. Headers and action groups wrap rather than compress labels.

In QA, scroll the work region independently of the bottom action footer. Keep selection count, duration, cost and Run together there. Coverage uses the existing Select at every width, with plain-language presets and an explicit custom-selection state. Checklist rows show a checkbox, readable label and separate detail action.

QA has three destinations: Checks, Results and Release. Evidence and issue fixes stay in the main Results view with a back action. Short check, environment, release-hold and feedback interactions use the existing centered Dialog, also used by New task. QA has no chat or sheet/sidebar detail layout. These are QA patterns, not a required layout for every Cockpit surface.

## Elevation & Depth

Work surfaces rely on fine borders, low-opacity rings and muted fills. Cards use a one-pixel foreground ring at 10% opacity. Sheets carry the preset's low overlay shadow; select menus and popovers use the larger floating shadow. The exact shadow and motion values are in the sidecar.

State transitions are short: controls use the preset's 150ms timing, sheets 200ms, and popover/dialog transitions 100ms. Preserve visible keyboard focus and the existing reduced-motion behavior.

**The Overlay Depth Rule.** Preserve quiet work surfaces and use the existing floating-component treatments when content overlays the workspace.

## Shapes

The source radius base is 10px. Buttons, inputs, badges and tab tracks use the broad control radius; cards use the container radius. QA checklist rows stay flat, separated by fine rules. Checkboxes are compact rounded squares (6px corners, 16px size). Use the recorded scale rather than introducing QA-specific control silhouettes.

## Components

### Buttons
Calm, compact, medium-weight controls. Primary uses the lime pair; outline uses a fine border and translucent input fill; secondary uses the secondary pair; ghost gains a muted fill on hover. Default height is 36px, small 32px, extra-small 24px and large 40px. Icon sizes follow the same dimensions. Keyboard focus uses a three-pixel half-opacity ring and ring-colored border. Disabled controls reduce opacity to 50%; ordinary pressed buttons translate down one pixel.

### Inputs / Fields
Use the supplied pill-shaped input and select, translucent input fill and one-pixel stroke. Focus follows the button ring; invalid state uses destructive border and ring. Keep labels available to assistive technology. Do not replace semantic controls with visually simulated controls.

### Navigation
The default Tabs form a muted pill track with an active background-colored tab. In dark mode the active tab uses the input surface and border. QA labels its three tabs Checks, Results and Release. The library's line variant remains available for contexts that need it. Preserve keyboard tab behavior and visible focus.

### Chips
Badges are compact pills (20px high). QA uses neutral secondary badges for passed, blocked, flaky, stale and untested outcomes, and destructive for failed. Context labels use secondary or outline. Pair outcome text with an inline Lucide icon; color alone does not distinguish outcomes.

### Cards / Containers
The shared Card has 24px internal spacing, reduced to 16px for its small size, and a subtle ring instead of a cast shadow. QA's checklist uses simple divided rows with wrap-capable labels, semantic checkboxes and separate detail buttons; no enclosing card or colored group rows.

### Dialogs / Feedback
QA reuses the centered New task Dialog primitive: popover surface, broad control radius, 24px padding and a subtle ring. Short detail content scrolls within the viewport when needed. Open store is a native link to a standalone store route in a new tab; browser-local history stays synchronized across tabs. Runs show local completion progress, and consequential actions confirm through the standard Sonner toast system.

**The Preset Control Rule.** Reuse the existing shadcn variants, states and semantics; compose workflow structure around them.

## Do's and Don'ts

### Do:
- **Do** use semantic surface/foreground pairs in both themes.
- **Do** preserve the preset's control radii, focus rings and disabled states.
- **Do** use tabular numerals for estimates and counts.
- **Do** keep QA's selection, estimate and Run together, and its evidence and issue fixes in the main Results view.

### Don't:
- **Don't** override shared controls to create a separate QA visual system.
- **Don't** communicate QA outcomes through color alone.
