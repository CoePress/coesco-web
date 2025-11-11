# Database Guide

## Common Commands

```bash
npm run db:migrate          # Create and apply migration
npm run db:generate         # Generate client + repositories
npm run db:migrate:deploy   # Production migrations
npm run db:reset            # Reset database (deletes data!)
```

## Creating Models

```prisma
model Product {
  id        String    @id @default(uuid())
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?  // For soft deletes

  @@map("products")
}
```

Run `npm run db:generate` after changes.

## Relationships

```prisma
// One-to-many
model Post {
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

model User {
  posts Post[]
}
```

## Direct Queries

```typescript
import { prisma } from "@/utils/prisma";

await prisma.product.findMany({
  where: { price: { gt: 100 } },
  include: { category: true },
  orderBy: { createdAt: 'desc' }
});
```

## Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const product = await productRepository.create(data, tx);
  await inventoryRepository.create({ productId: product.id }, tx);
});
```
