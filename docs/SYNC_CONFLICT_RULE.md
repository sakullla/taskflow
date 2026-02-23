# Sync Conflict Rule (v1)

## Policy
Use **Last-Write-Wins (LWW)** for all task and list mutations.

## Conflict key
A conflict occurs when two writes target the same entity id (`list.id`, `task.id`, `step.id`) with overlapping fields.

## Resolution order
1. Higher `updatedAt`/server commit timestamp wins.
2. If timestamps are equal, later server arrival order wins.
3. If still tied, keep existing server value (no-op).

## Scope
- Applies to create/update/delete of lists, tasks, steps, and My Day entries.
- Deletes win over updates if delete is committed last.

## Client behavior
- Apply optimistic UI first.
- On server reject or conflicting final state, rollback local optimistic value and replace with server payload.
- Show non-blocking sync warning banner for failed optimistic sync.

## Future upgrades
- Add per-field merge strategy for note/title edits.
- Add vector-clock or operation log when collaborative real-time editing is introduced.
