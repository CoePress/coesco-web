# Testing Guide

This guide explains how to write and run tests for the server application.

## Setup

Testing infrastructure is configured with:
- **Jest**: Testing framework
- **ts-jest**: TypeScript support for Jest
- **Coverage reporting**: Built-in coverage analysis

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for continuous integration)
npm run test:ci
```

### Running Specific Tests

```bash
# Run a specific test file
npm test -- address.service.test.ts

# Run tests matching a pattern
npm test -- customer

# Run tests in a specific directory
npm test -- services/sales
```

## Checking Test Coverage

### Command Line Coverage

Run tests with coverage to see a summary in the terminal:

```bash
npm run test:coverage
```

This will display a table showing coverage for:
- **Statements**: % of executable statements covered
- **Branches**: % of conditional branches covered
- **Functions**: % of functions called
- **Lines**: % of lines executed

Example output:
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   45.23 |    32.15 |   38.92 |   45.67 |
 services/sales/    |   87.50 |    75.00 |  100.00 |   87.50 |
  address.service.ts|   87.50 |    75.00 |  100.00 |   87.50 | 15,23
--------------------|---------|----------|---------|---------|-------------------
```

### HTML Coverage Report

After running `npm run test:coverage`, open the HTML report:

```bash
# The report is generated in apps/server/coverage/
# Open apps/server/coverage/index.html in your browser
```

The HTML report provides:
- Interactive file browser
- Line-by-line coverage highlighting
- Detailed branch coverage
- Sortable tables

### Coverage Thresholds

The project is configured with minimum coverage thresholds in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 50,   // 50% of branches must be covered
    functions: 50,  // 50% of functions must be called
    lines: 50,      // 50% of lines must be executed
    statements: 50, // 50% of statements must run
  },
}
```

If coverage falls below these thresholds, the test run will **fail**. This ensures code quality standards.

### Interpreting Coverage Metrics

- **Statements (>50%)**: Basic code execution coverage
- **Branches (>50%)**: Tests cover different conditional paths (if/else)
- **Functions (>50%)**: All functions are called in tests
- **Lines (>50%)**: Physical lines of code executed

**Goal**: Aim for **70-80% coverage** for services and repositories.

## Writing Tests

### Test File Location

Place test files next to the code they test:

```
src/services/sales/
├── address.service.ts
└── __tests__/
    └── address.service.test.ts
```

Or use the `.test.ts` suffix in the same directory:

```
src/services/sales/
├── address.service.ts
└── address.service.test.ts
```

### Test Structure

```typescript
import { YourService } from "../your.service";
import { yourRepository } from "@/repositories";

// Mock dependencies
jest.mock("@/repositories", () => ({
  yourRepository: {
    create: jest.fn(),
    getById: jest.fn(),
    // ... other methods
  },
}));

describe("YourService", () => {
  let service: YourService;

  // Setup before each test
  beforeEach(() => {
    service = new YourService();
    jest.clearAllMocks(); // Clear mock call history
  });

  describe("methodName", () => {
    it("should do something successfully", async () => {
      // Arrange: Set up test data and mocks
      const input = { /* test data */ };
      const mockResponse = { success: true, data: { /* ... */ } };
      (yourRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      // Act: Call the method being tested
      const result = await service.methodName(input);

      // Assert: Verify the results
      expect(yourRepository.create).toHaveBeenCalledWith(input);
      expect(result.success).toBe(true);
    });

    it("should handle errors correctly", async () => {
      // Test error scenarios
      const error = new Error("Something went wrong");
      (yourRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.methodName({})).rejects.toThrow("Something went wrong");
    });
  });
});
```

### Example: AddressService Test

See `src/services/sales/__tests__/address.service.test.ts` for a complete example that demonstrates:

1. **Mocking repositories**: Isolate the service from database calls
2. **Testing CRUD operations**: Create, Read, Update, Delete
3. **Testing with different inputs**: Default params, custom params
4. **Error handling**: Testing failure scenarios
5. **Assertions**: Verifying method calls and return values

Key patterns from the example:

```typescript
// Mock repository responses to match BaseRepository format
const mockResponse = {
  success: true,
  data: mockAddress,
};

// For getAll, include meta pagination data
const mockListResponse = {
  success: true,
  data: [mockAddress1, mockAddress2],
  meta: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
};

// For delete operations
const mockDeleteResponse = {
  success: true,
  message: "Deleted successfully",
};
```

## Best Practices

### 1. Test Naming Conventions

```typescript
describe("ServiceName", () => {
  describe("methodName", () => {
    it("should [expected behavior] when [condition]", () => {
      // Test implementation
    });
  });
});
```

Examples:
- ✅ `"should create an address successfully"`
- ✅ `"should throw an error when address not found"`
- ✅ `"should return filtered results when query params provided"`
- ❌ `"test create"` (too vague)
- ❌ `"it works"` (not descriptive)

### 2. Mock External Dependencies

Always mock:
- Repositories (database calls)
- External APIs
- File system operations
- Date/time (use fixed dates in tests)

```typescript
jest.mock("@/repositories", () => ({
  yourRepository: {
    create: jest.fn(),
  },
}));
```

### 3. Test Both Success and Failure Paths

```typescript
// Success case
it("should create successfully", async () => {
  // Mock successful response
  // Call method
  // Assert success
});

// Failure case
it("should handle validation errors", async () => {
  // Mock error
  // Expect rejection
});
```

### 4. Use Arrange-Act-Assert Pattern

```typescript
it("should do something", async () => {
  // Arrange: Set up test data
  const input = { name: "Test" };
  const expected = { id: "123", name: "Test" };

  // Act: Execute the code under test
  const result = await service.method(input);

  // Assert: Verify the outcome
  expect(result).toEqual(expected);
});
```

### 5. Clear Mocks Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clears call history
});
```

### 6. Test Edge Cases

Don't just test the happy path:
- Empty inputs
- Null values
- Invalid data
- Boundary conditions
- Database errors
- Network failures

### 7. Keep Tests Isolated

Each test should:
- Be independent of other tests
- Not depend on test execution order
- Clean up after itself

### 8. Don't Test Implementation Details

❌ Bad - Testing internal implementation:
```typescript
it("should call private method", () => {
  // Don't test private methods directly
});
```

✅ Good - Testing public behavior:
```typescript
it("should return formatted address", async () => {
  const result = await service.getAddress(id);
  expect(result.data.addressLine1).toBe("123 Main St");
});
```

## Common Patterns

### Mocking Prisma Client

```typescript
jest.mock("@/utils/prisma", () => ({
  prisma: {
    address: {
      create: jest.fn(),
      findMany: jest.fn(),
      // ... other methods
    },
  },
}));
```

### Testing Async Operations

```typescript
it("should handle async operations", async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});
```

### Testing Error Throwing

```typescript
it("should throw error on invalid input", async () => {
  await expect(service.method(null)).rejects.toThrow("Invalid input");
});
```

### Testing with Multiple Assertions

```typescript
it("should create and return formatted data", async () => {
  const result = await service.create(data);

  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.data.id).toBeTruthy();
  expect(result.data.name).toBe(data.name);
});
```

## Troubleshooting

### "Cannot find module" errors

Make sure path aliases are configured in `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

### Tests timing out

Increase timeout for slow tests:

```typescript
it("should handle slow operation", async () => {
  // ... test code
}, 30000); // 30 second timeout
```

Or globally in `jest.config.js`:
```javascript
testTimeout: 10000, // 10 seconds
```

### Mock not working

Make sure `jest.mock()` is called **before** imports:

```typescript
// ✅ Correct order
jest.mock("@/repositories");
import { service } from "./service";

// ❌ Wrong order
import { service } from "./service";
jest.mock("@/repositories"); // Too late!
```

### TypeScript errors in tests

Ensure `@types/jest` is installed:

```bash
npm install --save-dev @types/jest
```

## Next Steps

1. **Write tests for existing services** - Start with simple CRUD services
2. **Increase coverage gradually** - Aim for 70%+ coverage
3. **Test critical paths first** - Authentication, permissions, data integrity
4. **Add integration tests** - Test multiple layers together
5. **Set up CI/CD** - Run tests automatically on every commit

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [TypeScript with Jest](https://jestjs.io/docs/getting-started#via-ts-jest)

## Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Services | 70-80% |
| Repositories | 60-70% (mostly auto-generated) |
| Controllers | 60-70% |
| Utilities | 80-90% |
| Overall | 65-75% |

Run `npm run test:coverage` to check current coverage and identify gaps!
