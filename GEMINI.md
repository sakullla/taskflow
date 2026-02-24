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

## Testing & i18n Requirements

- Any user-visible feature change must include E2E coverage in `e2e/*.spec.ts`.
- Any user-visible copy change must update both locales:
  - `apps/web/src/locales/en/*.json`
  - `apps/web/src/locales/zh-CN/*.json`

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
- Set `TZ` (IANA, e.g. `Asia/Shanghai`) to align due/reminder date logic
