# CockpitOS

A frontend-only prototype of **CockpitOS**: a chat-first work cockpit that reads across Slack, Asana, email, meetings, Figma and code, builds your daily checklist, and prepares drafts, research, safe code changes and live prototypes for you to review.

Everything runs on local demo data. There is no backend, no database and no secrets, and nothing you "send" leaves the browser.

## What's in the prototype

| Flow | Where | What to try |
| --- | --- | --- |
| Daily briefing | `/` | Greeting, main prompt box, playable audio summary (browser speech), five-task checklist with task-specific states, "View all". |
| All tasks | `/tasks` | Filter, search, empty state. |
| Task workspace | `/tasks/[id]` | Resizable chat + prepared work. Mobile gets Chat / Prepared work tabs. |
| Autonomy controls | Header → "Autonomy" | Proactivity level, offline work, per-action permissions. |
| Live prototype | `/preview/3-strands` | The frontend-only dashboard that the 3 Strands task iterates on. Also embedded in its workspace. |

### The five tasks

1. **Reply to Glenn about Supabase RLS** (Slack): editable reply draft with inline `[n]` citations (hover for the quote), a sources panel, the original thread and a migration sketch. Ask it to shorten, change tone, add SQL or explain sources. Send posts to a simulated thread and completes the task.
2. **Email Alyssa on custom quotes in Wix** (email): feasibility matrix, sources, the original email, two decisions that regenerate the draft (deposit, tone). Manual edits are never overwritten without asking.
3. **Model 6D self-service form + reply** (code): three-file diff with syntax highlighting, checks, the original request, an approval gate for pushing the branch, and a reply to Dana. Try "make phone required".
4. **Recall translation screens** (Figma): three draft frames, preview language and original-text behaviour, frame approval, canvas comments. Try "add an error state", "show it in Japanese", "add SRT export".
5. **3 Strands dashboard PRD + prototype**: the chat on the left, the live prototype or editable PRD on the right. Try "make it compact", "dark theme", "use a line chart", "only delivery", "revert to v1", or "add a requirement for CSV export to the PRD". Each change is a new version, the iframe updates live over `postMessage`, and "Open live" opens a shareable URL.

From the home prompt, anything mentioning a task (for example "make Glenn's reply shorter") opens that workspace and runs the prompt. Anything else opens a general "Ask CockpitOS" workspace.

### Demo hooks

- `/?demo=error` shows the briefing error state with Retry.
- Type `/error` in any workspace chat to see the message error state.
- `/preview/3-strands?fail=1` shows the prototype's own error state.

## Stack

- Next.js (App Router) · TypeScript · Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com) on Base UI primitives
- [AI Elements](https://elements.ai-sdk.dev): prompt input, suggestions, confirmation, checkpoint, artifact, web preview, code block, inline citation
- [assistant-ui](https://www.assistant-ui.com): thread, composer, message actions, branching, suggestions (driven by a local scripted runtime)
- zustand for demo state, recharts (via shadcn chart) for the prototype dashboard
- Vitest + Testing Library

## Run locally

```bash
npm install
npm run dev        # http://localhost:47831
```

```bash
npm run lint
npm run typecheck
npm test
npm run build && npm start
```

## Deploying

The app has no environment variables and needs no server-side services, so it deploys to Vercel as-is: import the repo and keep the defaults.

## Code map

- `src/lib/demo/`: demo data (tasks, drafts, sources, diffs, PRD)
- `src/lib/store.ts`: zustand store for every flow
- `src/lib/chat/`: scripted chat adapter and per-task responders
- `src/components/home/`: briefing, audio summary, checklist
- `src/components/workspace/`: workspace shell, chat pane, inline tool cards, task panes
- `src/components/prototype/dashboard.tsx`: the previewed prototype
- `src/components/{ui,ai-elements,assistant-ui}/`: vendored registry components (excluded from lint)

## Design notes

Motion follows [Emil Kowalski's design-engineering guidance](https://emilkowal.ski/skill): custom ease-out curves, press feedback on buttons, specific transition properties, short staggered list entrances, no animation on keyboard-driven actions, and `prefers-reduced-motion` respected. Accessibility and interface details follow the Vercel Web Interface Guidelines and the WCAG-focused skills listed on [ui-skills.com](https://www.ui-skills.com/skills): visible focus, labelled controls, semantic landmarks, a skip link, `aria-live` for async status, tabular numerals, and loading, empty and error states.
