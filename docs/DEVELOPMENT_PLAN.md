# Development Plan

## Goal
Build a checklist/task-first application similar to Microsoft To Do with strong list management, "My Day", and multi-device readiness.

## Phase 0 - Initialization (Done)
- Define monorepo structure (`apps/web`, `apps/api`)
- Establish base scripts and documentation
- Create execution TODO and sub-agent implementation protocol

## Phase 1 - MVP foundation (Week 1)
- Web shell and core navigation: My Day, Important, Planned, Tasks, Lists
- API baseline: auth stub, list/task CRUD endpoints
- Data model v1: User, List, Task, Step, MyDayTask
- Local persistence + mock API fallback for frontend parallel build

## Phase 2 - Core feature completion (Week 2)
- Task details: note, due date, reminder, importance, priority
- Subtasks and completion flows
- Search and filter by date, status, list
- Planned and overdue views

## Phase 3 - Sync and reliability (Week 3)
- Real auth and token refresh
- Sync protocol and conflict strategy (last-write-wins v1)
- Offline cache strategy and background re-sync
- Add integration and E2E smoke tests

## Phase 4 - Quality and release (Week 4)
- Performance tuning and lazy loading
- Accessibility pass
- Telemetry and error tracking
- Release candidate checklist and deployment docs

## Milestones
- M1: User can create lists/tasks and complete tasks
- M2: User can plan day using My Day and date views
- M3: User can sync across sessions and recover offline edits
- M4: Release-ready MVP with baseline tests

## Risks and mitigations
- Scope creep: freeze MVP boundaries in TODO.md
- Sync complexity: start with deterministic conflict rule
- Reminder platform differences: abstract reminder adapter layer
