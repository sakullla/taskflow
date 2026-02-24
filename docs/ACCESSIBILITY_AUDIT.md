# Accessibility Audit (Week 8.6)

Date: 2026-02-24

## Scope

- Login page form semantics
- Header/sidebar icon actions
- Task item action controls
- Modal and toast accessibility semantics

## Findings and Actions

1. Form labels were not programmatically associated with inputs on login/register.
   - Action: added explicit `label + htmlFor` and input `id`.
   - Action: added password/email autocomplete hints.

2. Multiple icon-only buttons lacked accessible names/state.
   - Action: added `aria-label` and state attributes (`aria-pressed`, `aria-expanded`, `aria-haspopup`) for:
     - Header actions
     - Sidebar/mobile sidebar list actions
     - Notification actions
     - Task complete/important/batch selection buttons

3. Dialog/toast semantics were incomplete for assistive technologies.
   - Action: dialogs now include `role="dialog"`, `aria-modal`, labelled/description linkage.
   - Action: toast container now uses live region attributes, and toast items expose status/alert role.

4. Password policy alignment gap between frontend and backend.
   - Action: frontend validation updated to minimum 8 characters to match backend policy.
   - Action: both English and Chinese locale copy updated.

## Validation

- Added Playwright coverage in `e2e/accessibility.spec.ts`.
- Existing workspace tests/typecheck/build pass after changes.
