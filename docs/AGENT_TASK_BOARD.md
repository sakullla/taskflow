# Agent Task Board

Generated: 2026-02-23T12:20:46.312Z

## Dispatch Rules
- Source of truth: `TODO.md` unchecked tasks
- Assignment logic: section default + keyword scoring
- Re-generate with: `npm run agent:dispatch`

## Queue by Agent

### frontend-builder
- [ ] (Product and UX) Finalize navigation labels and information architecture
- [ ] (Product and UX) Define list page interaction states: empty, loading, error
- [ ] (Product and UX) Draft "My Day" interaction rules and reset policy

### backend-builder
- [ ] (Backend (`apps/api`)) Add persistent storage (PostgreSQL or SQLite for local dev)
- [ ] (Backend (`apps/api`)) Implement REST endpoints for lists/tasks/steps/my-day
- [ ] (Backend (`apps/api`)) Add input validation and error shape conventions
- [ ] (Backend (`apps/api`)) Add auth stub and user scoping guard
- [ ] (Backend (`apps/api`)) Add unit tests for task/list services

### qa-reviewer
- [ ] (Cross-cutting) Add e2e smoke test for create/complete task flow
- [ ] (Release) QA checklist and bug bash

### release-devops
- [ ] (Cross-cutting) Define sync conflict rule (v1: last-write-wins)
- [ ] (Cross-cutting) Add telemetry hooks and request logging
- [ ] (Cross-cutting) Add CI pipeline: typecheck + test + build
- [ ] (Release) Production env template and secrets doc
- [ ] (Release) Build and deploy first MVP

## Snapshot
- Total tasks: 23
- Pending tasks: 15
