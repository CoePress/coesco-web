# Testing Guide

## Running Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

## Basic Test

```typescript
import request from "supertest";
import app from "../app";

describe("Product API", () => {
  it("should create product", async () => {
    const response = await request(app)
      .post("/v1/products")
      .send({ name: "Widget", price: 99.99 })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty("id");
  });
});
```

## With Mocks

```typescript
jest.mock("@/services/product.service");

it("should call service", async () => {
  (productService.create as jest.Mock).mockResolvedValue({ id: "1" });

  await request(app).post("/v1/products").send(data);

  expect(productService.create).toHaveBeenCalledWith(data);
});
```
