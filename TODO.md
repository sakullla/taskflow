# TODO - MVP Build Checklist

## 1) Product and UX
- [x] Finalize navigation labels and information architecture
- [x] Define list page interaction states: empty, loading, error
- [x] Define task details drawer fields and edit flows
- [x] Draft "My Day" interaction rules and reset policy

## 2) Frontend (`apps/web`)
- [x] Create domain models (`List`, `Task`, `Step`, `MyDayTask`)
- [x] Implement list sidebar with custom list CRUD
- [x] Implement task list with quick-add and complete toggle
- [x] Implement task detail panel (due date, reminder, note, priority)
- [x] Integrate API client layer and optimistic updates
- [x] Add local cache (IndexedDB/localStorage fallback)

## 3) Backend (`apps/api`)
- [x] Add persistent storage (PostgreSQL or SQLite for local dev)
- [x] Implement REST endpoints for lists/tasks/steps/my-day
- [x] Add input validation and error shape conventions
- [x] Add auth stub and user scoping guard
- [x] Add unit tests for task/list services

## 4) Cross-cutting
- [x] Setup multi-agent execution framework and dispatch board
- [x] Define sync conflict rule (v1: last-write-wins)
- [x] Add telemetry hooks and request logging
- [x] Add CI pipeline: typecheck + test + build
- [x] Add e2e smoke test for create/complete task flow

## 5) Release
- [x] QA checklist and bug bash
- [x] Production env template and secrets doc
- [x] Build and deploy first MVP
