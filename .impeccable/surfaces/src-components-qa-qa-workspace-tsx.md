---
version: 1
slug: "src-components-qa-qa-workspace-tsx"
primary_target: "src/components/qa/qa-workspace.tsx"
related_targets: ["src/components/qa/qa-panels.tsx","src/components/qa/qa-plan.tsx","src/components/qa/qa-results.tsx","src/components/qa/qa-issues.tsx","src/components/qa/qa-release.tsx","src/components/qa/contact-preview.tsx"]
---

# QA workspace

Mode: Operate. Scope: /qa and the Forme QA task. This is a workflow redesign inside Cockpit's confirmed shadcn visual system. The user selected one workspace rather than a wizard.

## Direction contract

THESIS: Selecting checks and starting a run is the task. One clear next action on each screen. Apply quieter through fewer controls, repeated labels, colored statuses and surface layers.

OWN-WORLD: Inherit the base-maia shadcn controls, Geist, semantic neutral surfaces and Cockpit primary accent. No local CSS overrides of Button, Checkbox, Select or Tabs.

STORY: Choose a coverage preset, adjust checks, inspect expected behavior where needed, read the estimate, run. Results expose findings and the next action; issues retain evidence through fix and retest; release remains a human decision.

FIRST VIEWPORT: A centered title and work column following Home and Tasks. Three destinations: Checks, Results, Release. Plain-language coverage presets and simple checkbox rows. Selection count, duration, cost and Run sit together below the checklist. Setup and omitted coverage remain explicit. No extra header bar, local-demo label or duplicate counters.

FORM: User-pinned single workspace in the existing visual identity. No AI chat and no sheet/sidebar layout. Short check and environment details use the same centered Dialog as New task. Evidence and issue fixes remain in the main Results view with an explicit back action. The store opens as a standalone page in a new tab. Loading shows actual simulation progress; consequential actions confirm through the existing toast system.

FINISH: Verify selection-to-release with local history, keyboard and narrow-width layouts. Inspect the built screens, remove design-system drift, and document the patterns that actually ship.
