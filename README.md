# Project Name

A full-stack application built with Turborepo, featuring a Vite frontend and Express backend.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Turbo](https://turbo.build/repo/docs/installing) (`npm install -g turbo`)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- [Redis](https://redis.io/) (v6+)

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd <your-repo>
npm install

# 2. Setup environment
cp apps/server/.env.example apps/server/.env
# Edit .env with your database credentials

# 3. Setup database
npm run db:setup

# 4. Start development
npm run dev
```

**Access your app:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

## Project Structure

```
├── apps/
│   ├── client/          # Vite React app
│   └── server/          # Express API server
├── packages/            # Shared packages (if any)
└── package.json         # Root workspace
```

## Available Scripts

```bash
# Development
npm run dev              # Start all apps in development
npm run dev:client       # Start only frontend
npm run dev:server       # Start only backend

# Database
npm run db:setup         # Run migrations + seed
npm run db:migrate       # Run migrations only
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# Build
npm run build            # Build all apps
npm run build:client     # Build frontend only
npm run build:server     # Build backend only

# Production
npm start                # Start production build
```

## Environment Setup

### Database Connection

Create `apps/server/.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/yourdb"
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"
PORT=3001
```

### Required Services

Make sure PostgreSQL and Redis are running:

```bash
# Check postgres
psql -U postgres -c "SELECT version();"

# Check redis
redis-cli ping
```

## Troubleshooting

**Database connection issues?**

- Ensure PostgreSQL is running
- Check your DATABASE_URL in .env
- Try: `npm run db:reset`

**Redis connection issues?**

- Ensure Redis is running: `redis-server`
- Check REDIS_URL in .env

**Turbo not found?**

```bash
npm install -g turbo
```
