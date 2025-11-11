# Development Guide

## Adding a New Endpoint

1. **Create validation schema**
```typescript
const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});
```

2. **Create controller**
```typescript
export class ProductController {
  create = asyncWrapper(async (req: Request, res: Response) => {
    const data = CreateProductSchema.parse(req.body);
    const result = await productService.create(data);
    res.status(HTTP_STATUS.CREATED).json(result);
  });
}
```

3. **Create service**
```typescript
export class ProductService {
  async create(data: any) {
    return await productRepository.create(data);
  }
}
```

4. **Add route**
```typescript
router.post("/", protect, productController.create);
```

## Creating a Database Model

1. **Add to Prisma schema**
```prisma
model Product {
  id        String    @id @default(uuid())
  name      String
  price     Decimal
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("products")
}
```

2. **Generate**
```bash
npm run db:generate
```

This creates migration, repository, and types automatically.

## Using Repositories

```typescript
// Get all with pagination
await productRepository.getAll({ page: 1, limit: 10 });

// Get by ID
await productRepository.getById(id);

// Create
await productRepository.create(data);

// Update
await productRepository.update(id, data);

// Soft delete
await productRepository.softDelete(id);
```

## Path Aliases

Use `@/` instead of relative paths:
```typescript
import { logger } from "@/utils/logger";
import { productRepository } from "@/repositories";
```
