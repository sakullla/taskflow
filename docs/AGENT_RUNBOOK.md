# Agent Runbook

This project uses multiple role agents to execute TODO items in parallel-safe slices.

## Active agents
- `agents/orchestrator.agent.md`
- `agents/frontend-builder.agent.md`
- `agents/backend-builder.agent.md`
- `agents/qa-reviewer.agent.md`
- `agents/release-devops.agent.md`
- `agents/app-builder.agent.md` (generic single-task executor)

## Operating model
1. Orchestrator refreshes board with `npm run agent:dispatch`.
2. Each role agent takes one unchecked task from its queue.
3. Agent ships a small change and runs required checks.
4. Agent updates `TODO.md` and appends a line in `docs/WORKLOG.md`.
5. QA reviewer validates behavior and logs findings.

## Handoff contract
- Include changed files and exact verification commands.
- Mark blockers with impact and proposed workaround.
- Never edit unrelated task areas in the same cycle.

## Cadence
- Dispatch at least once per day, or after every 2 completed TODO items.
- Re-dispatch immediately after major TODO edits.
