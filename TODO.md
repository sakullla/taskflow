# TODO - MVP Build Checklist

## 1) Product and UX
- [ ] Finalize navigation labels and information architecture
- [ ] Define list page interaction states: empty, loading, error
- [x] Define task details drawer fields and edit flows
- [ ] Draft "My Day" interaction rules and reset policy

## 2) Frontend (`apps/web`)
- [x] Create domain models (`List`, `Task`, `Step`, `MyDayTask`)
- [x] Implement list sidebar with custom list CRUD
- [x] Implement task list with quick-add and complete toggle
- [x] Implement task detail panel (due date, reminder, note, priority)
- [x] Integrate API client layer and optimistic updates
- [ ] Add local cache (IndexedDB/localStorage fallback)

## 3) Backend (`apps/api`)
- [ ] Add persistent storage (PostgreSQL or SQLite for local dev)
- [ ] Implement REST endpoints for lists/tasks/steps/my-day
- [ ] Add input validation and error shape conventions
- [ ] Add auth stub and user scoping guard
- [ ] Add unit tests for task/list services

## 4) Cross-cutting
- [x] Setup multi-agent execution framework and dispatch board
- [ ] Define sync conflict rule (v1: last-write-wins)
- [ ] Add telemetry hooks and request logging
- [ ] Add CI pipeline: typecheck + test + build
- [ ] Add e2e smoke test for create/complete task flow

## 5) Release
- [ ] QA checklist and bug bash
- [ ] Production env template and secrets doc
- [ ] Build and deploy first MVP
