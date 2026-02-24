# TaskFlow

Todo app with React + Fastify + Prisma.

## Stack

- Web: React, TypeScript, Vite, Tailwind, Zustand, React Query
- API: Fastify, TypeScript, Prisma, SQLite
- Test: Playwright (E2E)
- Deploy: `sakullla/taskflow` + root `docker-compose.yml`

## Run (dev)

```bash
npm install
cp .env.example .env
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000`

## Common Commands

```bash
npm run dev
npm run build
npm run build:web
npm run build:api
npm run typecheck --workspaces
npx playwright test
```

## Deploy (prod)

```bash
cp .env.example .env
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d
```

More details: `docs/DEPLOYMENT.md`
