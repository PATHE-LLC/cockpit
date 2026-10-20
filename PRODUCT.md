# Cockpit QA prototype

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

People checking website changes before a release. The confirmed first task is to choose checks and start a test run. The user chose one workspace: select a coverage preset, edit the checks, see the estimate, and run.

## Operating context

QA is part of Cockpit, available from its primary rail and the Forme QA task. The demo follows a Forme ecommerce contact-form failure: a failed submission clears the message, feedback joins a linked issue, a fix creates build 13, and a retest verifies message retention before a human release decision.

## Capabilities and constraints

Preserve the supplied QA PRD: three coverage scopes; editable check selection; build, setup, device and account context; estimated duration and AI cost before execution; passed, failed, blocked, flaky and untested outcomes; expected and actual behavior; original evidence, logs and attempts; linked human feedback; issue fixes and retests; stale evidence after affected changes; named reviewer sign-offs and explicit release decisions. A fix alone cannot resolve an issue. A changed build alone cannot reopen a resolved issue.

All execution, captures, integrations, fixes, builds, usage and approvals are local simulations. Nothing is sent or deployed. Preserve browser-local workflow history.

## Confirmed design constraints

Use Cockpit's existing shadcn components and preset, including the centered dialog used by New task. Follow the home, tasks and project surfaces for hierarchy and interaction quality. QA has no AI chat and no sheet or sidebar detail layout. The store opens in a new tab; evidence stays in the main workspace. Remove unnecessary header chrome and repeated labels. Every screen must make its next action clear, with concise, plain-language copy, useful progress and confirmation toasts.

Apply Impeccable's quieter principle: fewer background accents, flatter grouping, less color and purposeful motion. Preserve readable contrast and clear control affordances. The user values Bencho's restraint, layout and interaction quality; references also include Recent, Designeer and Linear.

## Evidence

The user supplied qa-workflow-spec.md. Demo data and workflow rules live in src/lib/qa. Exact audience composition beyond people reviewing website changes remains unconfirmed.
