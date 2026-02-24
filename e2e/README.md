# E2E Testing Guide

This directory contains Playwright end-to-end tests for the Todo application.

## Test Structure

```
e2e/
├── smoke.spec.ts          # Basic smoke tests
├── navigation.spec.ts     # Navigation and routing tests
├── tasks.spec.ts          # Task management tests
├── task-detail.spec.ts    # Task detail panel tests
├── lists.spec.ts          # List management tests
├── search.spec.ts         # Search functionality tests
├── settings.spec.ts       # Settings page tests
└── mobile-responsive.spec.ts  # Mobile responsive design tests
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test search.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed
```

## Test Coverage

### Search Functionality (search.spec.ts)
- ✅ Navigate to search page
- ✅ Empty state display
- ✅ Search for tasks
- ✅ No results message

### Settings Page (settings.spec.ts)
- ✅ Navigate to settings page
- ✅ Display all sections (Appearance, Language, Notifications, Account)
- ✅ Switch theme (Light/Dark)
- ✅ Switch language (English/Chinese)
- ✅ Theme preference persistence in localStorage

### Mobile Responsive (mobile-responsive.spec.ts)
- ✅ Desktop sidebar visible on large viewport
- ✅ Mobile viewport hides desktop sidebar
- ✅ Mobile menu button opens sidebar
- ✅ Navigation to search page on mobile
- ✅ Responsive layout padding adjustment

### Existing Tests (14 tests)
- ✅ Smoke tests (page loads, sidebar visible)
- ✅ Navigation (sidebar navigation, lists display)
- ✅ Task management (add task, mark complete, view filters)
- ✅ Task detail (open detail, mark important, add steps)
- ✅ List management (create list, delete list, task reassignment)

## Total: 28 tests passing
