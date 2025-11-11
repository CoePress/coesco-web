# Getting Started

## Prerequisites

- Node.js >= 18
- PostgreSQL
- Redis (optional)

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cd apps/server
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

Server runs on `http://localhost:3000`

## Troubleshooting

**Database connection error**: Check `DATABASE_URL` in `.env`

**Port in use**: Change `PORT` in `.env`

**Migration errors**: Try `npm run db:reset` (deletes all data)
