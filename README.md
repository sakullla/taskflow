# TaskFlow

Todo app with React + Fastify + Prisma.

## Stack

- Web: React, TypeScript, Vite, Tailwind, Zustand, React Query
- API: Fastify, TypeScript, Prisma, SQLite
- i18n: i18next (`apps/web/src/locales/en`, `apps/web/src/locales/zh-CN`)
- Test: Playwright (E2E)
- Deploy: `sakullla/taskflow` + root `docker-compose.yml`

## Run (dev)

```bash
npm install
cp .env.example .env
npm run dev
```

Or manually with concurrently:

```bash
npx concurrently "cd apps/api && npx tsx src/server.ts" "cd apps/web && npm run dev"
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000`

**Default login (dev):**
- Email: `demo@example.com`
- Password: `password123`

## Common Commands

```bash
npm run dev
npm run build
npm run build:web
npm run build:api
npm run typecheck --workspaces
npx playwright test
```

## Testing & i18n Rules

- User-facing features must include/update E2E tests in `e2e/*.spec.ts`.
- Text changes must update both locale files:
  - `apps/web/src/locales/en/*.json`
  - `apps/web/src/locales/zh-CN/*.json`

## Deploy (prod)

```bash
cp .env.example .env
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d
```

## Timezone

- API supports `TZ` (IANA), default `Asia/Shanghai`.
- Example: `TZ=Asia/Shanghai` or `TZ=America/New_York`.
- It affects "today" checks for due/reminder notifications.

More details: `docs/DEPLOYMENT.md`
