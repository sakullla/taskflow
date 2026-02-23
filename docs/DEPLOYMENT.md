# MVP Deployment (Local)

## Goal
Deploy a local production-like MVP with built frontend and backend services.

## Prerequisites
- Node.js 24+
- Dependencies installed (`npm install`)

## One-command local deploy
Run from repo root:

```bash
npm run deploy:mvp:local
```

This command:
1. Builds web assets (`apps/web/dist`)
2. Builds API output (`apps/api/dist`)
3. Starts API (`http://localhost:4000`)
4. Starts web preview (`http://localhost:4173`)

## Environment
Copy `.env.example` to `.env` and customize if needed.

Important vars:
- `PORT`
- `TODO_DB_PATH`
- `VITE_API_BASE_URL`

## Health checks
- API: `GET http://localhost:4000/health`
- Web: open `http://localhost:4173`
