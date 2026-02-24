# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaskFlow is a Todo application built as an npm workspace monorepo with a React frontend and Fastify backend.

- `apps/web`: React + TypeScript + Vite frontend
- `apps/api`: Fastify + TypeScript + Prisma backend
- `e2e/`: Playwright end-to-end tests

## Development Commands

```bash
# Setup
npm install
cp .env.example .env

# Development (runs both API and web)
npm run dev              # API on :4000, web on :5173
npm run dev:web          # Web only
npm run dev:api          # API only

# Building
npm run build            # Build both
npm run build:web        # Web only
npm run build:api        # API only

# Testing & Quality
npm run typecheck --workspaces
npm run lint --workspaces
npm run test --workspaces
npx playwright test      # E2E tests
npx playwright test e2e/tasks.spec.ts  # Single test file

# Database (API workspace)
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
npm run db:studio        # Open Prisma Studio
```

## Architecture

### Backend (apps/api)

**Module Pattern**: Each feature lives in `src/modules/{feature}/` with:
- `routes.ts` - Fastify route handlers
- `service.ts` - Business logic
- `schemas.ts` - Zod validation schemas

**Authentication**: JWT-based via `@fastify/jwt`. The `authenticate` decorator is applied to protected routes. Token payload validated against `tokenPayloadSchema`.

**Database**: Prisma ORM with multi-database support (SQLite default, PostgreSQL/MySQL via env). Schema in `prisma/schema.prisma`.

**Environment**: Validated via Zod in `config/env.ts`. Key vars:
- `JWT_SECRET` - min 32 chars in production
- `TZ` - IANA timezone (default `Asia/Shanghai`), affects due/reminder date logic
- `ALLOW_REGISTRATION` - controls public signup
- `DB_TYPE` - sqlite | postgresql | mysql

**Notification System**: Background task checks reminders/due dates every minute via `setInterval` in `app.ts`.

**Static Serving**: In production, the API serves the built web app from `../web/dist` with SPA fallback for non-API routes.

### Frontend (apps/web)

**Routing**: React Router v6 with lazy-loaded pages. Protected/Public route wrappers handle auth redirects.

**State Management**:
- Zustand for client state (auth, notifications, UI)
- TanStack Query for server state (default staleTime: 5min)

**Data Fetching**: Axios with interceptors for JWT tokens. API client in `lib/api/client.ts`.

**i18n**: i18next with two locales: `en` and `zh-CN`. Translation files in `src/locales/{lang}/`.

**Styling**: Tailwind CSS v4 with `tailwindcss-animate` for animations.

## Requirements for Changes

- **E2E Tests**: User-facing features must include tests in `e2e/*.spec.ts`
- **i18n**: User-visible text must update both `apps/web/src/locales/en/*.json` and `apps/web/src/locales/zh-CN/*.json`

## PR Gate

1. `npm run typecheck --workspaces`
2. `npm run build:web`
3. `npm run build:api`
