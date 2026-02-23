# Project Overview

This is a To-Do List application inspired by Microsoft To Do, featuring lists, tasks, and a "My Day" view. It is structured as a monorepo utilizing npm workspaces. The project encompasses a React + TypeScript frontend built with Vite and a Node.js + TypeScript backend API service. Furthermore, this project integrates multi-agent role definitions and execution orchestration.

## Main Technologies

*   **Frontend:** React, TypeScript, Vite (`apps/web`)
*   **Backend:** Node.js, TypeScript (`apps/api`)
*   **Architecture:** Monorepo (npm workspaces) with integrated multi-agent execution tracking and rules (`docs/`, `agents/`, `scripts/`).
*   **Data:** SQLite (defaulted to `data/todo.sqlite` for the API)

## Building and Running

The project relies on standard npm scripts defined in the root `package.json`.

**Initial Setup:**
```bash
npm install
```

**Local Testing & Development:**
*   Run local MVP deploy for testing (Builds and runs both API and web preview): `npm run deploy:mvp:local`
*   Run the web app (dev mode): `npm run dev:web`
*   Run the API service (dev mode): `npm run dev:api`

**Building and Deployment:**
*   Build the frontend: `npm run build:web`
*   Build the API: `npm run build:api`
*   Start built web preview standalone: `npm run start:web:preview`
*   Start built API standalone: `npm run start:api`

**Testing and Quality:**
*   Run tests across all workspaces: `npm run test`
*   Run linting: `npm run lint`
*   Run typechecking: `npm run typecheck`

**Agent Execution:**
*   Build/Dispatch agent board: `npm run agent:dispatch`

## Development Conventions

*   **TypeScript:** Both frontend and backend utilize TypeScript for strong typing. Ensure all code passes typechecking (`npm run typecheck`).
*   **Multi-Agent Workflow:** The project relies on specific multi-agent orchestration rules. Review `docs/AGENT_RUNBOOK.md` for handoff contracts and execution rules. The `docs/AGENT_TASK_BOARD.md` holds the auto-generated task queue.
*   **Environment Configuration:** Refer to `.env.example` to set up your `.env` file (API defaults to PORT=4000, Web defaults to VITE_API_BASE_URL=http://localhost:4000).
*   **Code Quality:** Adhere to existing linting rules (`npm run lint`).
