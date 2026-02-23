# Repository Guidelines

## Project Structure & Module Organization
This repo is a Node.js workspace with two apps:
- `apps/web`: React + TypeScript (Vite) frontend.
- `apps/api`: Express + TypeScript backend.
- `docs/`: planning and process docs (`DEVELOPMENT_PLAN.md`, `WORKLOG.md`, `AGENT_RUNBOOK.md`, `AGENT_TASK_BOARD.md`).
- `agents/`: role definitions for orchestrator, frontend, backend, QA, and release workflows.
- `scripts/`: automation utilities (for example, task dispatch generation).

Keep feature code inside the owning app. Shared interfaces should live in clear, typed modules (for example, `apps/web/src/models`).

## Build, Test, and Development Commands
Run from repository root:
- `npm install`: install all workspace dependencies.
- `npm run dev:web`: start frontend dev server.
- `npm run dev:api`: start backend dev server.
- `npm run build:web`: production build for web.
- `npm run build:api`: compile backend to `apps/api/dist`.
- `npm run typecheck --workspaces`: TypeScript checks across all workspaces.
- `npm run agent:dispatch`: regenerate `docs/AGENT_TASK_BOARD.md` from `TODO.md`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode enabled).
- Indentation: 2 spaces; keep imports grouped and minimal.
- React components: `PascalCase`; hooks/variables/functions: `camelCase`.
- File naming: component files `PascalCase.tsx` or feature-oriented names; docs and agent files use `kebab-case`.
- Prefer small, focused changes; avoid unrelated refactors.

## Testing Guidelines
There is no full test suite yet. Current minimum quality gate:
1. `npm run typecheck --workspaces`
2. `npm run build:web`
3. `npm run build:api`

When adding tests, use `*.test.ts` / `*.test.tsx` naming and keep tests close to the module under test.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history (`feat:`, `chore:`, `fix:`).
- Keep each commit scoped to one logical change.
- PRs should include: purpose, key files changed, verification commands run, and UI screenshots for frontend changes.
- If task status changes, update `TODO.md`, append `docs/WORKLOG.md`, and regenerate the task board.

## Security & Configuration Tips
- Never commit secrets or `.env*` files.
- Keep local configuration in environment variables and document required keys in PR notes.
