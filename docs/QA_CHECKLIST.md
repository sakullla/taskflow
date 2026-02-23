# QA Checklist and Bug Bash

## Scope
Validate web task workflows and API sync behavior before each release candidate.

## Core smoke flows
- [ ] Create list, rename list, delete list, confirm task reassignment to `Tasks`.
- [ ] Create task from `My Day`, `Important`, `Planned`, and custom list views.
- [ ] Toggle task complete/incomplete and verify order updates.
- [ ] Edit task details: title, note, due date, reminder, priority.
- [ ] Add/remove task from My Day and verify `/my-day` response.

## Sync and reliability
- [ ] Stop API, perform local edits, confirm sync warning appears.
- [ ] Restart API, reload app, verify data consistency and cache fallback behavior.
- [ ] Validate optimistic rollback on forced API error (bad payload).

## API checks
- [ ] `GET /health` returns status ok.
- [ ] Validation errors return `error.code` and `error.message`.
- [ ] User scoping works with `x-user-id`.

## Bug bash process
1. Timebox to 45 minutes.
2. Capture issues with severity: `P0`, `P1`, `P2`.
3. For each issue include route, repro steps, expected vs actual, and screenshot/log.
4. Re-run smoke flows after fixes.
