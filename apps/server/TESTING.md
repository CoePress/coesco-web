# Testing Guide

## Overview

This server uses **Jest** as the test framework and **Supertest** for API integration testing.

## Setup

### Environment Configuration

Before running tests, ensure you have a `.env.test` file configured. A template is provided in the repository.

**Important:** Use a separate test database to avoid affecting your development data.

```bash
DATABASE_URL=postgresql://test:test@localhost:5432/coesco_test?schema=public
```

### Test Database Setup

1. Create a test database:
```bash
createdb coesco_test
```

2. Run migrations on test database:
```bash
DATABASE_URL="postgresql://test:test@localhost:5432/coesco_test?schema=public" npm run db:migrate:deploy
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode
```bash
npm run test:ci
```

### Run Specific Test File
```bash
npm test -- path/to/test.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create user"
```

## Test Structure

### Directory Organization

Tests should be placed in `__tests__` directories adjacent to the code they test:

```
src/
├── services/
│   ├── user.service.ts
│   └── __tests__/
│       └── user.service.test.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── __tests__/
│       └── auth.middleware.test.ts
```

### Test File Naming

- Unit tests: `*.test.ts`
- Integration tests: `*.test.ts` (in `__tests__` directory)
- E2E tests: `*.test.ts` (in `__tests__` directory)

## Test Lifecycle

### Global Setup/Teardown

- **globalSetup.ts**: Runs once before all test suites
- **globalTeardown.ts**: Runs once after all test suites

### Per-Test Setup/Teardown

- **jest.setup.ts**: Runs before each test file
- **beforeEach/afterEach**: Runs before/after each test

### Example Test Structure

```typescript
import { createTestServer } from "@/test-helpers";
import app from "@/app";

describe("User Service", () => {
  let testServer;

  beforeAll(() => {
    testServer = createTestServer(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const response = await testServer
        .post("/v1/users")
        .send({ email: "test@example.com", name: "Test User" });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("id");
    });
  });
});
```

## Test Helpers

### Test Server

Use `createTestServer` for integration tests:

```typescript
import { createTestServer } from "@/test-helpers";
import app from "@/app";

const testServer = createTestServer(app);

const response = await testServer.get("/v1/users");

const responseWithAuth = await testServer
  .withAuth("your-token")
  .get("/v1/users");
```

### Mock Data Generators

```typescript
import { mockUser, mockCompany, mockApiResponse } from "@/test-helpers";

const user = mockUser({ email: "custom@example.com" });
const company = mockCompany({ name: "Custom Company" });
const response = mockApiResponse(user);
```

## Mocking

### Mocking Modules

```typescript
jest.mock("@/repositories", () => ({
  userRepository: {
    findById: jest.fn(),
    create: jest.fn(),
  },
}));
```

### Mocking External Services

```typescript
jest.mock("axios");
import axios from "axios";

(axios.get as jest.Mock).mockResolvedValue({ data: { id: 1 } });
```

### Mocking Prisma

```typescript
jest.mock("@/utils/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));
```

## Best Practices

### 1. Isolate Tests
Each test should be independent and not rely on other tests.

### 2. Clear Mocks
Always clear mocks between tests:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. Test One Thing
Each test should verify one specific behavior.

### 4. Descriptive Names
Use descriptive test names that explain what is being tested:
```typescript
it("should return 401 when token is invalid", () => {});
```

### 5. Arrange-Act-Assert
Structure tests using the AAA pattern:
```typescript
it("should create user", async () => {
  const userData = { email: "test@example.com" };

  const response = await testServer.post("/v1/users").send(userData);

  expect(response.status).toBe(201);
  expect(response.body.data.email).toBe(userData.email);
});
```

### 6. Avoid Testing Implementation
Test behavior, not implementation details.

### 7. Use beforeEach for Setup
Set up common test data in `beforeEach`:
```typescript
beforeEach(() => {
  mockData = createMockData();
});
```

## Coverage

### Viewing Coverage

After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

### Coverage Thresholds

The project maintains minimum coverage thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Debugging Tests

### Run Single Test in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.test.ts
```

### VS Code Debug Configuration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### Database Connection Errors
Ensure test database is running and `.env.test` has correct credentials.

### Port Already in Use
Test server uses port 3001 by default. Change in `.env.test` if needed.

### Timeout Errors
Increase timeout in test:
```typescript
jest.setTimeout(30000);
```

Or in specific test:
```typescript
it("slow test", async () => {
  // test code
}, 30000);
```

## CI/CD Integration

Tests run automatically in CI using:
```bash
npm run test:ci
```

This command:
- Runs tests in CI mode
- Generates coverage reports
- Limits workers to 2 for stability
- Fails if coverage thresholds are not met
