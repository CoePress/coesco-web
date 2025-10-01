# @coesco/types

Shared TypeScript types for the Coesco monorepo.

## Structure

This package contains both **auto-generated** and **custom static** types:

```
src/
├── _auto-generated.ts      # Auto-generated index (DO NOT EDIT)
├── index.ts                 # Main exports (auto + custom)
├── custom/                  # Custom static types directory
│   └── index.ts            # Custom types index
├── *.ts                    # Auto-generated model files
└── .gitignore              # Ignores auto-generated files
```

## Usage

### Importing Types

All types (both auto-generated and custom) are exported from the main package:

```typescript
import { User, Quote, QuoteRevision } from '@coesco/types';
```

### Adding Custom Types

To add custom static types that won't be overwritten by the generator:

1. Create a new file in `src/custom/`:
   ```typescript
   // src/custom/my-custom-type.ts
   export interface MyCustomType {
     foo: string;
     bar: number;
   }
   ```

2. Export it from `src/custom/index.ts`:
   ```typescript
   export * from './my-custom-type';
   ```

3. Your custom types will now be available through the main package:
   ```typescript
   import { MyCustomType } from '@coesco/types';
   ```

## Auto-Generated Types

The auto-generated types are created by running:

```bash
npm run generate:services
```

This script:
- Reads the Prisma schema
- Generates TypeScript interfaces for each model
- Creates enums for Prisma enums
- Outputs to individual files and `_auto-generated.ts`

**Do not manually edit auto-generated files** - they will be overwritten on the next generation.

## Guidelines

- ✅ Add custom types to `src/custom/`
- ✅ Import all types from `@coesco/types`
- ❌ Don't edit `_auto-generated.ts`
- ❌ Don't edit individual auto-generated model files (unless you know what you're doing)
