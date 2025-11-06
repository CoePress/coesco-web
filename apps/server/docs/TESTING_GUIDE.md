# Testing Guide

## Setup

Configure `.env.test` with a separate test database:

```bash
DATABASE_URL=postgresql://test:test@localhost:5432/coesco_test?schema=public
```

Create and migrate test database:

```bash
createdb coesco_test
DATABASE_URL="postgresql://test:test@localhost:5432/coesco_test?schema=public" npm run db:migrate:deploy
```

## Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:ci             # CI mode

npm test -- address.service.test.ts           # Specific file
npm test -- --testNamePattern="should create" # Pattern match
```

## Coverage

View terminal summary:
```bash
npm run test:coverage
```

View HTML report:
```bash
# Open apps/server/coverage/index.html
```

**Thresholds:** 50% minimum (branches, functions, lines, statements)
**Goal:** Aim for 70-80% on services and repositories

## Writing Tests

### File Location

Place tests next to the code:
```
src/services/sales/
├── address.service.ts
└── __tests__/
    └── address.service.test.ts
```

### Basic Structure

```typescript
import { YourService } from "../your.service";
import { yourRepository } from "@/repositories";

jest.mock("@/repositories", () => ({
  yourRepository: {
    create: jest.fn(),
    getById: jest.fn(),
  },
}));

describe("YourService", () => {
  let service: YourService;

  beforeEach(() => {
    service = new YourService();
    jest.clearAllMocks();
  });

  describe("methodName", () => {
    it("should do something successfully", async () => {
      // Arrange
      const input = { name: "test" };
      const mockResponse = { success: true, data: { id: "1", name: "test" } };
      (yourRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(yourRepository.create).toHaveBeenCalledWith(input);
      expect(result.success).toBe(true);
    });

    it("should handle errors", async () => {
      const error = new Error("Failed");
      (yourRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.methodName({})).rejects.toThrow("Failed");
    });
  });
});
```

### Test Helpers

For integration tests:

```typescript
import { createTestServer } from "@/test-helpers";
import app from "@/app";

const testServer = createTestServer(app);

const response = await testServer.get("/v1/users");

const responseWithAuth = await testServer
  .withAuth("token")
  .get("/v1/users");
```

## Best Practices

1. **Use descriptive names**: `"should return 401 when token is invalid"`
2. **Mock external dependencies**: Repositories, APIs, file system
3. **Test both success and failure**: Happy path and error cases
4. **Arrange-Act-Assert pattern**: Set up → Execute → Verify
5. **Clear mocks between tests**: Use `jest.clearAllMocks()` in `beforeEach`
6. **Test behavior, not implementation**: Don't test private methods
7. **Keep tests isolated**: Independent and order-agnostic

## Common Issues

**Module errors**: Check path aliases in `jest.config.js`

**Timeout errors**: Increase timeout
```typescript
jest.setTimeout(30000);
// or per-test
it("slow test", async () => { /* ... */ }, 30000);
```

**Mock not working**: Call `jest.mock()` before imports
```typescript
jest.mock("@/repositories");
import { service } from "./service";
```

## Lifecycle Hooks

- `globalSetup.ts`: Runs once before all test suites
- `globalTeardown.ts`: Runs once after all test suites
- `jest.setup.ts`: Runs before each test file
- `beforeEach/afterEach`: Runs before/after each test
