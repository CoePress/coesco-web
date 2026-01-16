# Coesco Web Platform

Full-stack enterprise application for manufacturing management, CRM, and production tracking.

## Applications

### Server (`apps/server`)

Backend API built with Node.js and Express.

**Tech Stack:**
- **Runtime**: Node.js (>=18)
- **Language**: TypeScript (CommonJS)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt, Microsoft SSO (MSAL)
- **Testing**: Jest + Supertest

### Client (`apps/client`)

Frontend web application built with React.

**Tech Stack:**
- **Runtime**: Node.js (>=18)
- **Language**: TypeScript (ESM)
- **Framework**: React 19 with Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 + DaisyUI
- **State**: React Context + hooks
- **Build**: Vite with SWC

## Quick Start

```bash
# Install dependencies
npm install

# Set up server environment
cp apps/server/.env.example apps/server/.env
# Edit .env with your database credentials

# Set up client environment
cp apps/client/.env.example apps/client/.env
# Edit .env with API URL (default: http://localhost:3000)

# Run database migrations
cd apps/server
npm run db:migrate

# Start all apps (from root)
cd ../..
npm run dev
```

**Server**: `http://localhost:3000`
**Client**: `http://localhost:5173`

## Documentation

- **[Getting Started](docs/getting-started.md)** - Installation, prerequisites, and initial setup
- **[Development Guide](docs/development-guide.md)** - Common development tasks and workflows
- **[Architecture](docs/architecture.md)** - Repository pattern, service layer, and code organization
- **[Database Guide](docs/database.md)** - Prisma workflow, migrations, and conventions
- **[Testing Guide](docs/testing.md)** - Writing and running tests
- **[Deployment](docs/deployment.md)** - Production deployment instructions

## Project Structure

```
├── apps/
│   ├── server/            # Backend API
│   │   ├── src/
│   │   │   ├── controllers/     # Request handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── repositories/    # Data access (auto-generated)
│   │   │   ├── routes/          # API routes
│   │   │   ├── middleware/      # Express middleware
│   │   │   └── utils/           # Helpers
│   │   └── prisma/
│   │       └── schema.prisma    # Database schema
│   │
│   └── client/            # Frontend React app
│       ├── src/
│       │   ├── pages/           # Page components
│       │   ├── components/      # Reusable components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── config/          # App configuration
│       │   └── utils/           # Helpers
│       └── public/              # Static assets
│
└── packages/
    └── types/             # Shared TypeScript types
```

## Core Libraries

### Server
| Library | Purpose |
|---------|---------|
| `express` | Web framework |
| `@prisma/client` | Type-safe database client |
| `ioredis` | Redis caching |
| `socket.io` | WebSocket communication |
| `zod` | Runtime validation |

### Client
| Library | Purpose |
|---------|---------|
| `react` | UI framework |
| `react-router` | Routing |
| `tailwindcss` | Styling |
| `daisyui` | UI components |
| `vite` | Build tool |

## Common Commands

### From Root (runs all apps)
```bash
npm run dev              # Start all apps in dev mode
npm run build            # Build all apps
npm run lint             # Lint all apps
npm run check-types      # Type-check all apps
```

### Server (`apps/server`)
```bash
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript
npm test                 # Run tests

# Database
npm run db:generate      # Generate Prisma client + repositories
npm run db:migrate       # Create and apply migrations
```

### Client (`apps/client`)
```bash
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build
```

## Contributing

1. Follow existing code patterns and conventions
2. Use TypeScript path aliases (`@/` for `src/`)
3. Never manually edit auto-generated repository files
4. Write tests for new features
5. Run `npm run lint` before committing

## License

Proprietary - Coesco Manufacturing
