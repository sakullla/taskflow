# Agent Guidelines for Todo App

This document provides essential information for AI coding agents working on this project. The project is a Microsoft To Do-style checklist application with a monorepo structure.

---

## Project Overview

**Project Name**: To-Do List (Microsoft To Do style)
**Version**: 2.0.0
**Repository Structure**: npm workspace monorepo with two applications:
- `apps/web`: React + TypeScript frontend (Vite-based)
- `apps/api`: Fastify + TypeScript backend API

**Primary Language for Documentation**: English (though TODO.md and some docs contain Chinese content)

**Technology Stack**:
- **Frontend**: React 18, TypeScript 5, Vite, Tailwind CSS 4, shadcn/ui components, Zustand (state), React Query (data fetching), i18next (internationalization), Framer Motion (animations)
- **Backend**: Fastify 5, TypeScript 5, Prisma ORM, SQLite database, Zod (validation), JWT (authentication - currently disabled for demo)
- **Testing**: Playwright for E2E testing
- **Deployment**: Docker Compose with Nginx reverse proxy

---

## Project Structure

```
.
├── apps/
│   ├── web/                    # Frontend React application
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   │   ├── layout/     # Layout components (Header, Sidebar, MainLayout)
│   │   │   │   ├── task/       # Task-related components
│   │   │   │   └── ui/         # UI components (Button, Card, Toast, etc.)
│   │   │   ├── pages/          # Page components (MyDayPage, LoginPage, etc.)
│   │   │   ├── lib/            # Utilities (API client, i18n, hooks)
│   │   │   ├── models/         # TypeScript interfaces/types
│   │   │   ├── stores/         # Zustand state stores
│   │   │   ├── locales/        # i18n translation files (en, zh-CN)
│   │   │   └── types/          # Additional type definitions
│   │   ├── vite.config.ts      # Vite configuration with path alias `@/`
│   │   └── tsconfig.json       # TypeScript config (strict mode)
│   │
│   └── api/                    # Backend Fastify application
│       ├── src/
│       │   ├── config/         # Configuration (DB, env)
│       │   ├── modules/        # Feature modules
│       │   │   ├── auth/       # Authentication routes/service/schemas
│       │   │   ├── lists/      # List CRUD operations
│       │   │   ├── tasks/      # Task CRUD operations
│       │   │   ├── steps/      # Step (subtask) operations
│       │   │   └── my-day/     # "My Day" feature
│       │   ├── shared/         # Shared utilities and errors
│       │   ├── app.ts          # Fastify app factory
│       │   └── server.ts       # Server bootstrap
│       ├── prisma/
│       │   └── schema.prisma   # Database schema (SQLite)
│       └── tsconfig.json       # TypeScript config (NodeNext module resolution)
│
├── agents/                     # Multi-agent role definitions
├── docs/                       # Documentation
├── docker/                     # Docker configuration files
├── scripts/                    # Automation scripts (deploy.sh, backup.sh)
├── e2e/                        # Playwright E2E tests
└── package.json                # Root workspace configuration
```

---

## Build, Test, and Development Commands

Run all commands from the repository root:

### Development
```bash
# Start both web and API in development mode
npm run dev

# Start only frontend (port 5173)
npm run dev:web

# Start only backend API (port 4000)
npm run dev:api
```

### Building
```bash
# Build both applications
npm run build

# Build only web
npm run build:web

# Build only API
npm run build:api
```

### Testing and Quality
```bash
# Run TypeScript type checking across all workspaces
npm run typecheck --workspaces

# Run E2E tests (Playwright)
npx playwright test

# Run workspace tests
npm run test --workspaces
```

### Database Operations (API)
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Docker Deployment
```bash
# Build Docker images
npm run docker:build

# Start services with Docker Compose
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Deploy using deployment script
npm run deploy
```

### Agent Workflow
```bash
# Regenerate AGENT_TASK_BOARD.md from TODO.md
npm run agent:dispatch
```

---

## Code Style Guidelines

### Language and Framework
- **Language**: TypeScript with strict mode enabled
- **Frontend**: React 18 with functional components and hooks
- **Backend**: Fastify with async/await pattern

### Naming Conventions
- **React Components**: PascalCase (e.g., `TaskItem.tsx`, `MainLayout.tsx`)
- **Hooks/Functions/Variables**: camelCase
- **Files**: 
  - Component files: PascalCase.tsx
  - Utility/feature files: camelCase or kebab-case
  - Documentation: kebab-case.md

### Code Formatting
- **Indentation**: 2 spaces
- **Imports**: Grouped and minimal; use path alias `@/` for frontend imports
- **Line endings**: Unix-style (LF)

### Frontend Specifics
- Use Tailwind CSS for styling
- UI components are in `components/ui/` (shadcn/ui pattern)
- Feature components are organized by domain (e.g., `components/task/`)
- Use Zustand for client state, React Query for server state

### Backend Specifics
- Module structure: Each module has `routes.ts`, `service.ts`, `schemas.ts`
- Routes use Zod for validation via `fastify-type-provider-zod`
- Services contain business logic
- Error handling uses custom `AppError` class

---

## Testing Instructions

### Current Testing Setup
- **E2E Tests**: Playwright tests in `e2e/` directory
  - Tests run against Chromium by default
  - Web servers automatically started during tests
  - Base URL: `http://localhost:5173`
  - API health check endpoint: `http://localhost:4000/health`

### Minimum Quality Gate
Before committing changes, ensure:
1. `npm run typecheck --workspaces` passes without errors
2. `npm run build:web` completes successfully
3. `npm run build:api` completes successfully

### Adding Tests
- E2E tests: Add `*.spec.ts` files to `e2e/` directory
- Unit tests: Use `*.test.ts` naming and place near the module under test

---

## Security Considerations

### Environment Variables
- **Never commit** `.env` files or secrets to version control
- Copy `.env.example` to `.env` for local development
- Required environment variables:
  - `JWT_SECRET`: Strong random string for JWT signing (generate with `openssl rand -base64 32`)
  - `DATABASE_URL`: SQLite database path
  - `CORS_ORIGIN`: Allowed CORS origins
  - `VITE_API_BASE_URL`: API base URL for frontend

### Current Security State
- JWT authentication is **currently disabled** for demo purposes
- Mock authentication returns a demo user (`userId: "demo-user"`)
- CORS is configured but should be restricted in production

### Production Deployment
- Use `docker/docker-compose.yml` for production deployment
- Nginx serves as reverse proxy (configured in `docker/nginx.conf`)
- Database volume is persisted (`todo-data` Docker volume)
- Health checks are configured for all services

---

## Architecture Details

### Frontend Architecture
- **Router**: React Router v6 with protected routes
- **State Management**: 
  - Zustand for auth and task stores
  - React Query for server data with 5-minute stale time
- **API Client**: Axios-based client in `lib/api/client.ts`
- **Internationalization**: i18next with English and Simplified Chinese
- **Styling**: Tailwind CSS 4 with custom components

### Backend Architecture
- **Framework**: Fastify 5 with pino logging
- **Database**: SQLite via Prisma ORM
- **Schema Models**: User, List, Task, Step, MyDayTask
- **API Documentation**: Swagger UI at `/docs` endpoint
- **Error Handling**: Centralized error handler in `app.ts`

### Database Schema (Prisma)
- **User**: Authentication and profile
- **List**: Task lists with color and order
- **Task**: Main task entity with due dates, priority, importance
- **Step**: Subtasks linked to tasks
- **MyDayTask**: "My Day" feature linking tasks to specific dates

---

## Development Workflow

### Multi-Agent Execution
This project uses a multi-agent workflow defined in `agents/`:
1. **Orchestrator**: Manages task dispatch
2. **Frontend Builder**: Web app changes
3. **Backend Builder**: API changes
4. **QA Reviewer**: Testing and validation
5. **Release DevOps**: Deployment
6. **App Builder**: Generic task executor

### Task Management
- Tasks tracked in `TODO.md` (Chinese content)
- Auto-generated board in `docs/AGENT_TASK_BOARD.md`
- Work log maintained in `docs/WORKLOG.md`

### Commit Guidelines
- Follow Conventional Commit style: `feat:`, `fix:`, `chore:`, `docs:`
- Keep commits scoped to one logical change
- Run quality gates before committing

---

## Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Web Dev | 5173 | Vite development server |
| API | 4000 | Fastify API server |
| Nginx | 80 | Production HTTP |
| Nginx HTTPS | 443 | Production HTTPS (if SSL configured) |

---

## Useful Resources

- **Development Plan**: `docs/DEVELOPMENT_PLAN.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md` (Chinese)
- **Environment Setup**: `docs/SECRETS_AND_ENV.md`
- **API Documentation**: Available at `/docs` when API is running
- **Task Board**: `docs/AGENT_TASK_BOARD.md`
