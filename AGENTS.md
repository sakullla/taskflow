# Repository Guidelines

## Project Structure & Module Organization
This monorepo uses npm workspaces with two apps under `apps/`:
- `apps/web`: React + TypeScript frontend (Vite, Tailwind, Zustand, React Query).
- `apps/api`: Fastify + TypeScript backend (Prisma + SQLite, Zod validation).

Shared and operational folders:
- `e2e/` Playwright end-to-end tests.
- `docs/` project and process documentation.
- `docker/` deployment and reverse-proxy config.
- `scripts/` automation scripts (deploy, backup).
- `agents/` multi-agent role definitions and workflows.

## Build, Test, and Development Commands
Run from repository root:
- `npm run dev` starts web (`5173`) and API (`4000`) together.
- `npm run dev:web` / `npm run dev:api` starts one app.
- `npm run build` builds both apps (`build:web`, `build:api` also available).
- `npm run typecheck --workspaces` runs strict TS checks across workspaces.
- `npx playwright test` runs E2E suite.
- `npm run db:migrate`, `npm run db:generate`, `npm run db:seed` manage Prisma DB.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode), 2-space indentation, LF endings.
- React components: PascalCase filenames (e.g., `TaskItem.tsx`).
- Functions/variables/hooks: camelCase.
- Frontend imports should prefer `@/` alias when available.
- Backend modules follow `routes.ts`, `service.ts`, `schemas.ts` structure.

## Testing Guidelines
- Framework: Playwright for E2E (`e2e/*.spec.ts`).
- Unit tests should use `*.test.ts` near implementation.
- Minimum quality gate before PR/merge:
  1. `npm run typecheck --workspaces`
  2. `npm run build:web`
  3. `npm run build:api`

## Commit & Pull Request Guidelines
- Follow Conventional Commits, as used in history (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- Keep commits scoped to one logical change.
- PRs should include: clear description, linked issue/task, test evidence (command output or screenshots for UI changes), and notes on DB/env changes.

## Security & Configuration Tips
- Do not commit `.env` or secrets; use `.env.example` as template.
- Required env values include `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, `VITE_API_BASE_URL`.
- Auth is currently demo-mode; validate production security settings before release.
