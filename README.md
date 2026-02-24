# TaskFlow

A Microsoft To Do-style task management application with a modern tech stack.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core Features
- ✅ Task management with title, notes, due dates, and priorities
- ✅ Subtasks (steps) support
- ✅ Task lists with customizable colors
- ✅ "My Day" daily focus view
- ✅ Important tasks view
- ✅ Planned tasks (calendar) view
- ✅ Search functionality
- ✅ Batch operations (complete, delete, move)

### User Experience
- 🎨 Light/Dark theme support
- 🌐 Internationalization (English/Chinese)
- 📱 Mobile responsive design
- ⚡ Smooth animations and transitions
- 🦴 Skeleton loading screens
- 💬 Toast notifications
- 🎯 Keyboard shortcuts

### Technical
- 🔐 JWT authentication (demo mode)
- 💾 SQLite database with Prisma ORM
- 🔄 Optimistic UI updates
- 📦 Docker deployment ready
- 🧪 E2E tests with Playwright

## Tech Stack

### Frontend
- React 18 + TypeScript 5
- Vite (build tool)
- Tailwind CSS 4 + shadcn/ui
- Zustand (state management)
- React Query (data fetching)
- Framer Motion (animations)
- i18next (internationalization)

### Backend
- Fastify 5 + TypeScript
- Prisma ORM
- SQLite database
- Zod (validation)

### DevOps
- Docker + Docker Compose
- Nginx reverse proxy
- Playwright (E2E testing)

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
# Clone repository
git clone <repository-url>
cd taskflow

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:4000

### Build for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
npm run start
```

### Docker Deployment

```bash
# Build and start with Docker Compose
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start both web and API in dev mode
npm run dev:web      # Start frontend only
npm run dev:api      # Start backend only

# Building
npm run build        # Build for production
npm run build:web    # Build frontend only
npm run build:api    # Build backend only

# Testing
npm run test         # Run all tests
npx playwright test  # Run E2E tests

# Database
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database

# Backup
npm run backup       # Create database backup

# Docker
npm run docker:build # Build local images for testing
npm run docker:pull  # Pull production images from registry
npm run docker:up    # Start production containers
npm run docker:down  # Stop containers
npm run docker:push  # Build and push unified app image to Docker Hub
```

### Project Structure

```
.
├── apps/
│   ├── web/              # React frontend
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Page components
│   │   │   ├── stores/       # Zustand stores
│   │   │   ├── locales/      # i18n translations
│   │   │   └── lib/          # Utilities
│   │   └── package.json
│   └── api/              # Fastify backend
│       ├── src/
│       │   ├── modules/      # Feature modules
│       │   ├── config/       # Configuration
│       │   └── shared/       # Shared utilities
│       └── prisma/
├── e2e/                  # Playwright E2E tests
├── scripts/              # Automation scripts
├── docker-compose.yml    # Production compose file
└── docs/                 # Documentation
```

## Testing

### E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tasks.spec.ts
```

Test coverage includes:
- Task management (create, complete, delete)
- List management
- Navigation
- Search functionality
- Settings (theme, language)
- Mobile responsiveness
- Batch operations

## Deployment

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# API
JWT_SECRET=your-jwt-secret
DATABASE_URL=file:./dev.db
CORS_ORIGIN=http://localhost:5173

# Web
VITE_API_BASE_URL=http://localhost:4000
```

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure `CORS_ORIGIN` for your domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure database backups
- [ ] Run database migrations
- [ ] Build and test Docker images

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting)
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Build/process changes

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Design inspired by Microsoft To Do
- Icons by Lucide
- UI components by shadcn/ui
