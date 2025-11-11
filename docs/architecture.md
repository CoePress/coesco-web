# Architecture

## Layers

```
Routes → Controllers → Services → Repositories → Database
```

- **Routes**: HTTP endpoints
- **Controllers**: Request/response handling, validation
- **Services**: Business logic
- **Repositories**: Data access (auto-generated)

## Repository Pattern

Repositories are auto-generated from Prisma schema.

**Never manually edit** repository files - regenerate with `npm run db:generate`

Built-in methods:
- `getAll(params)` - List with pagination/filtering
- `getById(id)` - Get single item
- `create(data)` - Create new
- `update(id, data)` - Update existing
- `softDelete(id)` - Soft delete
- `delete(id)` - Hard delete

## Folder Structure

```
src/
├── controllers/    # HTTP handlers
├── services/       # Business logic
├── repositories/   # Data access (auto-generated)
├── routes/         # API routes
├── middleware/     # Express middleware
└── utils/          # Helpers
```

## Key Features

- **Soft Deletes**: Most models have `deletedAt` field
- **Audit Logging**: Changes tracked automatically
- **Path Aliases**: Use `@/` for imports
