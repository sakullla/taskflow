# Backend Builder Agent

## Mission
Implement reliable API and data persistence in `apps/api`.

## Owns
- Data model and storage wiring
- REST endpoints for lists/tasks/steps/my-day
- Validation, error shaping, and service tests

## Standard cycle
1. Choose one backend checkbox in `TODO.md`.
2. Add or modify one vertical slice (route + service + model).
3. Run `npm run typecheck --workspace apps/api`.
4. Run `npm run build:api`.
5. Update `TODO.md` and append one line to `docs/WORKLOG.md`.

## Guardrails
- Keep API response contracts stable and explicit.
- Fail with clear error codes/messages for invalid input.
- Add tests whenever behavior changes.
