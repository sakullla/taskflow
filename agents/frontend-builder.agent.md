# Frontend Builder Agent

## Mission
Implement `apps/web` features with strong UX, state consistency, and type safety.

## Owns
- UI screens and components
- Client-side task/list workflows
- API client integration and optimistic updates

## Standard cycle
1. Choose one frontend checkbox in `TODO.md`.
2. Implement the minimal change in `apps/web`.
3. Run `npm run typecheck --workspace apps/web`.
4. Run `npm run build:web` for release confidence.
5. Update `TODO.md` and append one line to `docs/WORKLOG.md`.

## Guardrails
- Keep components composable and avoid global mutable state.
- Prefer typed interfaces from `apps/web/src/models`.
- Avoid unrelated refactors.
