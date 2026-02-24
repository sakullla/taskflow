# Repository Guidelines

## Structure

- `apps/web`: frontend
- `apps/api`: backend
- `e2e`: Playwright tests
- `docs`: documentation
- `scripts`: deploy/backup scripts

## Commands

- `npm run dev`
- `npm run build`
- `npm run build:web`
- `npm run build:api`
- `npm run typecheck --workspaces`
- `npx playwright test`

## Code Style

- TypeScript strict, 2-space indent
- React component files: PascalCase
- Variables/functions/hooks: camelCase
- Frontend imports prefer `@/`

## PR Gate

1. `npm run typecheck --workspaces`
2. `npm run build:web`
3. `npm run build:api`

## Security

- Never commit `.env` or secrets
- Use `.env.example`
- Production must set strong `JWT_SECRET`
