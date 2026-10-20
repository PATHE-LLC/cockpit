---
version: 1
slug: "src-components-qa-qa-workspace-tsx"
primary_target: "src/components/qa/qa-workspace.tsx"
related_targets: ["src/components/qa/qa-panels.tsx","src/components/qa/qa-chat.tsx"]
---

# QA workspace

Mode: Operate. Scope: /qa and the Forme QA task. This is a workflow redesign inside Cockpit's confirmed shadcn visual system. The user selected one workspace rather than a wizard.

## Direction contract

THESIS: Selecting checks and starting a run is the task. Eliminate the detached composer, duplicate introductions and permanent run-summary card.

OWN-WORLD: Inherit the base-maia shadcn controls, Geist, semantic neutral surfaces and Cockpit primary accent. No local CSS overrides of Button, Checkbox, Select or Tabs.

STORY: Choose a coverage preset, adjust checks, inspect expected behavior where needed, read the estimate, run. Results expose findings and the next action; issues retain evidence through fix and retest; release remains a human decision.

FIRST VIEWPORT: Compact project header and standard navigation. One check-selection surface, with the selected scope and its reason above a compact checklist. Selection count, duration, cost and Run sit together below the checklist. Setup and omitted coverage remain explicit. No hero, eyebrow or chat overlay over the work.

FORM: User-pinned single workspace, not a new visual identity. Progressive detail panels for check evidence and an optional assistant opened from the header, using existing shadcn and AI Elements primitives.

FINISH: Verify selection-to-release with local history, keyboard and narrow-width layouts. Inspect the built screens, remove design-system drift, and document the patterns that actually ship.
