# To-Do List (Microsoft To Do style)

A checklist/task-first application scaffold focused on lists, tasks, and My Day.

## Structure

- `apps/web`: React + TypeScript web app (Vite scaffold)
- `apps/api`: Node + TypeScript API service scaffold
- `docs/DEVELOPMENT_PLAN.md`: phased development plan
- `TODO.md`: execution checklist for the first build iteration
- `agents/*.agent.md`: multi-agent role definitions
- `docs/AGENT_RUNBOOK.md`: orchestration rules and handoff contract
- `docs/AGENT_TASK_BOARD.md`: auto-generated task queue by agent

## Quick start

1. Install dependencies:
   - `npm install`
2. Run web:
   - `npm run dev:web`
3. Run api:
   - `npm run dev:api`
4. Build agent board:
   - `npm run agent:dispatch`

## Current scope

This repository is initialized for MVP delivery with multi-agent execution support.
