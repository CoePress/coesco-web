import type { IQueryParams } from "@/types";

import { deriveTableNames, getObjectDiff } from "@/utils";
import { getEmployeeContext } from "@/utils/context";
import { buildQuery, prisma } from "@/utils/prisma";

import { BaseRepository } from "../_base.repository";

jest.mock("@/utils/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
  buildQuery: jest.fn(),
}));
jest.mock("@/utils/context", () => ({
  getEmployeeContext: jest.fn(),
}));
jest.mock("@/utils", () => ({
  getObjectDiff: jest.fn(),
  deriveTableNames: jest.fn(),
}));

class TestRepository extends BaseRepository<any> {
  constructor() {
    super();
    this.modelName = "TestModel";
    (this as any).model = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }

  public setColumns(columns: string[]) {
    (this as any)._columns = columns;
  }

  public getModel() {
    return (this as any).model;
  }

  public override getSearchFields() {
    return ["name", "email"];
  }
}

describe("baseRepository", () => {
  let repository: TestRepository;
  let mockContext: any;

  beforeEach(() => {
    repository = new TestRepository();
    mockContext = {
      id: "emp-123",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    };

    (getEmployeeContext as jest.Mock).mockReturnValue(mockContext);
    (deriveTableNames as jest.Mock).mockReturnValue(["test_models"]);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { column_name: "id" },
      { column_name: "name" },
      { column_name: "createdAt" },
      { column_name: "updatedAt" },
      { column_name: "createdById" },
      { column_name: "updatedById" },
    ]);

    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all items with pagination metadata", async () => {
      const mockItems = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];

      (buildQuery as jest.Mock).mockReturnValue({
        where: {},
        page: 1,
        take: 20,
        skip: 0,
      });

      repository.getModel().findMany.mockResolvedValue(mockItems);
      repository.getModel().count.mockResolvedValue(2);
      repository.setColumns(["id", "name"]);

      const result = await repository.getAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItems);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it("should calculate total pages correctly", async () => {
      (buildQuery as jest.Mock).mockReturnValue({
        where: {},
        page: 1,
        take: 10,
        skip: 0,
      });

      repository.getModel().findMany.mockResolvedValue([]);
      repository.getModel().count.mockResolvedValue(25);
      repository.setColumns(["id"]);

      const result = await repository.getAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });

    it("should use transaction client when provided", async () => {
      const mockTx = {
        TestModel: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
        },
      };

      (buildQuery as jest.Mock).mockReturnValue({
        where: {},
        page: 1,
      });

      repository.setColumns(["id"]);

      await repository.getAll({}, mockTx as any);

      expect(mockTx.TestModel.findMany).toHaveBeenCalled();
      expect(mockTx.TestModel.count).toHaveBeenCalled();
    });

    it("should handle includeDeleted parameter", async () => {
      repository.setColumns(["id", "deletedAt"]);

      (buildQuery as jest.Mock).mockReturnValue({
        where: {},
        page: 1,
      });

      repository.getModel().findMany.mockResolvedValue([]);
      repository.getModel().count.mockResolvedValue(0);

      await repository.getAll({ includeDeleted: true });

      expect(buildQuery).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array),
        true,
        "TestModel",
      );
    });
  });

  describe("getById", () => {
    it("should return item by id", async () => {
      const mockItem = { id: "test-123", name: "Test Item" };

      (buildQuery as jest.Mock).mockReturnValue({});
      repository.getModel().findFirst.mockResolvedValue(mockItem);
      repository.setColumns(["id", "name"]);

      const result = await repository.getById("test-123");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItem);
      expect(repository.getModel().findFirst).toHaveBeenCalledWith({
        where: {
          AND: [{ id: "test-123" }, {}],
        },
      });
    });

    it("should apply scope to query", async () => {
      repository.setColumns(["id", "deletedAt"]);

      (buildQuery as jest.Mock).mockReturnValue({});
      repository.getModel().findFirst.mockResolvedValue(null);

      await repository.getById("test-123");

      expect(repository.getModel().findFirst).toHaveBeenCalledWith({
        where: {
          AND: [
            { id: "test-123" },
            {
              AND: [{ deletedAt: null }],
            },
          ],
        },
      });
    });

    it("should handle include parameter", async () => {
      const params: IQueryParams<any> = {
        include: ["relation1", "relation2"],
      };

      (buildQuery as jest.Mock).mockReturnValue({
        include: { relation1: true, relation2: true },
      });

      repository.getModel().findFirst.mockResolvedValue({});
      repository.setColumns(["id"]);

      await repository.getById("test-123", params);

      expect(repository.getModel().findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { relation1: true, relation2: true },
        }),
      );
    });

    it("should handle select parameter", async () => {
      const params: IQueryParams<any> = {
        select: ["id", "name"],
      };

      (buildQuery as jest.Mock).mockReturnValue({
        select: { id: true, name: true },
      });

      repository.getModel().findFirst.mockResolvedValue({});
      repository.setColumns(["id"]);

      await repository.getById("test-123", params);

      expect(repository.getModel().findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, name: true },
        }),
      );
    });

    it("should use transaction client when provided", async () => {
      const mockTx = {
        TestModel: {
          findFirst: jest.fn().mockResolvedValue({}),
        },
      } as any;

      (buildQuery as jest.Mock).mockReturnValue({});
      repository.setColumns(["id"]);

      await repository.getById("test-123", {}, mockTx);

      expect(mockTx.TestModel.findFirst).toHaveBeenCalled();
      expect(repository.getModel().findFirst).not.toHaveBeenCalled();
    });
  });

  describe("getHistory", () => {
    it("should return audit log entries for a record", async () => {
      const mockEntries = [
        {
          id: "log-1",
          model: "TestModel",
          recordId: "test-123",
          action: "CREATE",
          changedBy: "emp-123",
          diff: {},
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "log-2",
          model: "TestModel",
          recordId: "test-123",
          action: "UPDATE",
          changedBy: "emp-456",
          diff: { name: { before: "Old", after: "New" } },
          createdAt: new Date("2024-01-02"),
        },
      ];

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const result = await repository.getHistory("test-123");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        action: "CREATE",
        actor: { id: "emp-123" },
        timestamp: new Date("2024-01-01"),
        diff: {},
      });
      expect(result[1]).toEqual({
        action: "UPDATE",
        actor: { id: "emp-456" },
        timestamp: new Date("2024-01-02"),
        diff: { name: { before: "Old", after: "New" } },
      });
    });

    it("should query audit logs with correct filters", async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

      await repository.getHistory("test-123");

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { model: "TestModel", recordId: "test-123" },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should throw error if modelName is not set", async () => {
      const repo = new BaseRepository();

      await expect(repo.getHistory("test-123")).rejects.toThrow("Missing model name");
    });
  });

  describe("create", () => {
    it("should create a new record with metadata", async () => {
      const data = { name: "New Item" };
      const created = { id: "new-123", name: "New Item", createdById: "emp-123" };

      repository.setColumns(["id", "name", "createdById", "updatedById", "createdAt", "updatedAt"]);

      (prisma.$transaction as jest.Mock).mockImplementation(async fn => fn({
        TestModel: {
          create: jest.fn().mockResolvedValue(created),
        },
        auditLog: { create: jest.fn() },
      }));

      (getObjectDiff as jest.Mock).mockReturnValue({ name: { after: "New Item" } });

      const result = await repository.create(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
    });

    it("should add createdBy and updatedBy metadata", async () => {
      const data = { name: "New Item" };

      repository.setColumns(["id", "name", "createdById", "updatedById", "createdAt", "updatedAt"]);

      let capturedPayload: any;
      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            create: jest.fn().mockImplementation(({ data: payload }) => {
              capturedPayload = payload;
              return { id: "new-123", ...payload };
            }),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({});

      await repository.create(data);

      expect(capturedPayload.createdById).toBe("emp-123");
      expect(capturedPayload.updatedById).toBe("emp-123");
      expect(capturedPayload.createdAt).toBeInstanceOf(Date);
      expect(capturedPayload.updatedAt).toBeInstanceOf(Date);
    });

    it("should skip validation when skipValidation is true", async () => {
      const data = { name: "New Item" };

      repository.setColumns(["id", "name"]);

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: { create: jest.fn().mockResolvedValue({ id: "new-123" }) },
          auditLog: { create: jest.fn() },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({});

      const validateSpy = jest.spyOn(repository as any, "validate");

      await repository.create(data, undefined, true);

      expect(validateSpy).not.toHaveBeenCalled();
    });

    it("should use transaction client when provided", async () => {
      const mockTx = {
        TestModel: {
          create: jest.fn().mockResolvedValue({ id: "new-123" }),
        },
        auditLog: { create: jest.fn() },
      } as any;

      repository.setColumns(["id"]);
      (getObjectDiff as jest.Mock).mockReturnValue({});

      await repository.create({ name: "Test" }, mockTx);

      expect(mockTx.TestModel.create).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a record and log changes", async () => {
      const before = { id: "test-123", name: "Old Name" };
      const after = { id: "test-123", name: "New Name", updatedById: "emp-123" };

      repository.setColumns(["id", "name", "updatedById", "updatedAt"]);

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            findFirst: jest.fn().mockResolvedValue(before),
            update: jest.fn().mockResolvedValue(after),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({ name: { before: "Old Name", after: "New Name" } });

      const result = await repository.update("test-123", { name: "New Name" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(after);
    });

    it("should throw error if record not found", async () => {
      repository.setColumns(["id"]);

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      await expect(repository.update("test-123", { name: "New Name" })).rejects.toThrow(
        "Cannot update: TestModel test-123 not found",
      );
    });

    it("should throw error if no changes detected", async () => {
      const existing = { id: "test-123", name: "Same Name", updatedAt: new Date() };

      repository.setColumns(["id", "name", "updatedAt"]);

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            findFirst: jest.fn().mockResolvedValue(existing),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({ updatedAt: {} });

      await expect(repository.update("test-123", { name: "Same Name" })).rejects.toThrow(
        "TestModel test-123 update made no changes",
      );
    });

    it("should apply scope when finding record to update", async () => {
      repository.setColumns(["id", "deletedAt"]);

      let capturedWhere: any;
      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            findFirst: jest.fn().mockImplementation(({ where }) => {
              capturedWhere = where;
              return null;
            }),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      await expect(repository.update("test-123", {})).rejects.toThrow();

      expect(capturedWhere.AND).toContainEqual({ id: "test-123" });
      expect(capturedWhere.AND).toContainEqual({
        AND: [{ deletedAt: null }],
      });
    });
  });

  describe("delete", () => {
    it("should soft delete when deletedAt column exists", async () => {
      repository.setColumns(["id", "name", "deletedAt", "deletedById"]);

      const before = { id: "test-123", name: "Item", deletedAt: null };
      const deleted = { id: "test-123", name: "Item", deletedAt: new Date(), deletedById: "emp-123" };

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            findFirst: jest.fn().mockResolvedValue(before),
            update: jest.fn().mockResolvedValue(deleted),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({ deletedAt: { after: deleted.deletedAt } });

      const result = await repository.delete("test-123");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Deleted successfully");
    });

    it("should hard delete when deletedAt column does not exist", async () => {
      repository.setColumns(["id", "name"]);

      const before = { id: "test-123", name: "Item" };

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            findFirst: jest.fn().mockResolvedValue(before),
            delete: jest.fn().mockResolvedValue(before),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({ id: { before: "test-123" } });

      const result = await repository.delete("test-123");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Deleted successfully");
    });

    it("should throw error if record not found", async () => {
      repository.setColumns(["id"]);

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      await expect(repository.delete("test-123")).rejects.toThrow(
        "Cannot delete: TestModel test-123 not found",
      );
    });

    it("should use transaction client when provided", async () => {
      repository.setColumns(["id", "deletedAt"]);

      const mockTx = {
        TestModel: {
          findFirst: jest.fn().mockResolvedValue({ id: "test-123" }),
          update: jest.fn().mockResolvedValue({ id: "test-123", deletedAt: new Date() }),
        },
        auditLog: { create: jest.fn() },
      } as any;

      (getObjectDiff as jest.Mock).mockReturnValue({});

      await repository.delete("test-123", mockTx);

      expect(mockTx.TestModel.findFirst).toHaveBeenCalled();
      expect(mockTx.TestModel.update).toHaveBeenCalled();
    });
  });

  describe("scope handling", () => {
    it("should apply deletedAt scope when includeDeleted is false", async () => {
      repository.setColumns(["id", "deletedAt"]);

      (buildQuery as jest.Mock).mockReturnValue({ where: {}, page: 1 });
      repository.getModel().findMany.mockResolvedValue([]);
      repository.getModel().count.mockResolvedValue(0);

      await repository.getAll({ includeDeleted: false });

      const findManyCall = repository.getModel().findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toContainEqual({
        AND: [{ deletedAt: null }],
      });
    });

    it("should apply deletedAt scope with 'only' to get deleted items", async () => {
      repository.setColumns(["id", "deletedAt"]);

      (buildQuery as jest.Mock).mockReturnValue({ where: {}, page: 1 });
      repository.getModel().findMany.mockResolvedValue([]);
      repository.getModel().count.mockResolvedValue(0);

      await repository.getAll({ includeDeleted: "only" });

      const findManyCall = repository.getModel().findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toContainEqual({
        AND: [{ deletedAt: { not: null } }],
      });
    });

    it("should not apply deletedAt scope when includeDeleted is true", async () => {
      repository.setColumns(["id", "deletedAt"]);

      (buildQuery as jest.Mock).mockReturnValue({ where: {}, page: 1 });
      repository.getModel().findMany.mockResolvedValue([]);
      repository.getModel().count.mockResolvedValue(0);

      await repository.getAll({ includeDeleted: true });

      const findManyCall = repository.getModel().findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).not.toContainEqual(
        expect.objectContaining({ deletedAt: expect.anything() }),
      );
    });

    it("should apply ownerId scope when column exists", async () => {
      repository.setColumns(["id", "ownerId"]);

      (buildQuery as jest.Mock).mockReturnValue({ where: {}, page: 1 });
      repository.getModel().findMany.mockResolvedValue([]);
      repository.getModel().count.mockResolvedValue(0);

      await repository.getAll();

      const findManyCall = repository.getModel().findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toContainEqual({
        AND: [{ OR: [{ ownerId: null }, { ownerId: "emp-123" }] }],
      });
    });
  });

  describe("audit logging", () => {
    it("should create audit log on CREATE", async () => {
      repository.setColumns(["id", "name"]);

      const created = { id: "new-123", name: "New Item" };

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          TestModel: {
            create: jest.fn().mockResolvedValue(created),
          },
          auditLog: { create: jest.fn() },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({ name: { after: "New Item" } });

      await repository.create({ name: "New Item" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should not create audit log for excluded models", async () => {
      const auditRepo = new BaseRepository();
      (auditRepo as any).modelName = "auditLog";
      (auditRepo as any)._columns = ["id"];
      (auditRepo as any).model = {
        create: jest.fn().mockResolvedValue({ id: "log-1" }),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async fn =>
        fn({
          auditLog: { create: jest.fn().mockResolvedValue({ id: "log-1" }) },
        }),
      );

      (getObjectDiff as jest.Mock).mockReturnValue({});

      await auditRepo.create({ action: "TEST" });

      const txFn = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      const mockClient = {
        auditLog: { create: jest.fn() },
      };
      await txFn(mockClient);

      expect(mockClient.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("transformSort", () => {
    it("should transform simple sort", () => {
      const result = (repository as any).transformSort("name", "asc");
      expect(result).toEqual({ name: "asc" });
    });

    it("should transform nested sort with dot notation", () => {
      const result = (repository as any).transformSort("user.profile.name", "desc");
      expect(result).toEqual({
        user: {
          profile: {
            name: "desc",
          },
        },
      });
    });

    it("should default to asc when order not provided", () => {
      const result = (repository as any).transformSort("name");
      expect(result).toEqual({ name: "asc" });
    });

    it("should return undefined when sort not provided", () => {
      const result = (repository as any).transformSort();
      expect(result).toBeUndefined();
    });
  });
});
