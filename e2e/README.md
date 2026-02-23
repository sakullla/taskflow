# E2E Tests with Playwright

This directory contains end-to-end tests using Playwright.

## Running Tests

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/smoke.spec.ts

# Run tests with UI mode
npx playwright test --ui

# Run tests in debug mode
npx playwright test --debug
```

## Test Structure

- `smoke.spec.ts` - Basic smoke tests (API health, page loads)
- `tasks.spec.ts` - Task management tests (add, complete)
- `navigation.spec.ts` - Navigation tests (sidebar, routing)
- `task-detail.spec.ts` - Task detail panel tests
- `lists.spec.ts` - List management tests (create, delete)

## Configuration

Tests are configured in `playwright.config.ts` at the project root.

- Base URL: `http://localhost:5173`
- API URL: `http://localhost:4000`
- Browser: Chromium

## CI/CD

Tests automatically start the web server and API server before running.
