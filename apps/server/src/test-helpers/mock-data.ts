export function mockUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockCompany(overrides = {}) {
  return {
    id: "test-company-id",
    name: "Test Company",
    email: "company@example.com",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function generateMockId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function mockApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function mockPaginatedResponse<T>(data: T[], page = 1, limit = 20) {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
    },
  };
}
