# Product UX Spec

## Navigation and Information Architecture
Primary system views:
- `My Day`: tasks explicitly added for today's focus.
- `Important`: tasks where `isImportant = true`.
- `Planned`: tasks with `dueDate != null`.
- `All Tasks`: global list across all user lists.

Custom list area sits under system views in sidebar. List routes use `/lists/:listId` and preserve selected task context.

## List Page Interaction States
Each task view must support:
- **Loading**: show skeleton rows (3-5 placeholders) while bootstrap API is in flight.
- **Empty**: show contextual empty copy (for example, "No tasks in My Day yet.").
- **Error/Sync Warning**: show non-blocking banner and continue with local/cache state.
- **Populated**: task rows sorted as incomplete first, completed last.

Task row behaviors:
- Row click selects details panel.
- Checkbox toggles completion.
- Selected row has visible focus/active border.

## My Day Rules and Reset Policy
- "Add to My Day" can be toggled from task details.
- `MyDayTask` keeps date-scoped membership (`taskId + date + userId`).
- Day view query defaults to local date (`YYYY-MM-DD`).
- Midnight rollover policy (v1):
  1. My Day is effectively reset by querying current date only.
  2. Task entity remains unchanged and is never deleted by rollover.
  3. If a task has no active My Day entry for today, it is excluded from today's view.

## Copy and Labels
Use concise labels:
- Sidebar: `My Day`, `Important`, `Planned`, `All Tasks`, `Lists`
- Buttons: `Add`, `Rename`, `Delete`, `Save`, `Cancel`, `Close`
- Empty state tone: short, action-oriented, non-technical
