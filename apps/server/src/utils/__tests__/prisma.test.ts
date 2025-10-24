import type { IQueryParams } from "@/types";

import { buildQuery } from "../prisma";

jest.mock("@prisma/client", () => ({
  Prisma: {
    dmmf: {
      datamodel: {
        models: [
          {
            name: "User",
            fields: [
              { name: "id", kind: "scalar", type: "String" },
              { name: "name", kind: "scalar", type: "String" },
              { name: "email", kind: "scalar", type: "String" },
              { name: "deletedAt", kind: "scalar", type: "DateTime" },
              { name: "posts", kind: "object", type: "Post", isList: true },
              { name: "profile", kind: "object", type: "Profile", isList: false },
            ],
          },
          {
            name: "Post",
            fields: [
              { name: "id", kind: "scalar", type: "String" },
              { name: "title", kind: "scalar", type: "String" },
              { name: "content", kind: "scalar", type: "String" },
              { name: "deletedAt", kind: "scalar", type: "DateTime" },
              { name: "author", kind: "object", type: "User", isList: false },
              { name: "comments", kind: "object", type: "Comment", isList: true },
            ],
          },
          {
            name: "Comment",
            fields: [
              { name: "id", kind: "scalar", type: "String" },
              { name: "text", kind: "scalar", type: "String" },
              { name: "deletedAt", kind: "scalar", type: "DateTime" },
            ],
          },
          {
            name: "Profile",
            fields: [
              { name: "id", kind: "scalar", type: "String" },
              { name: "bio", kind: "scalar", type: "String" },
            ],
          },
        ],
      },
    },
  },
  PrismaClient: jest.fn(),
}));

describe("prisma utils", () => {
  describe("buildQuery", () => {
    describe("pagination", () => {
      it("should build query with default page 1", () => {
        const params: IQueryParams<any> = {};
        const result = buildQuery(params);

        expect(result.page).toBe(1);
        expect(result.skip).toBeUndefined();
        expect(result.take).toBeUndefined();
      });

      it("should build query with custom page", () => {
        const params: IQueryParams<any> = { page: 2, limit: 10 };
        const result = buildQuery(params);

        expect(result.page).toBe(2);
        expect(result.skip).toBe(10);
        expect(result.take).toBe(10);
      });

      it("should handle string page number", () => {
        const params: IQueryParams<any> = { page: "3" as any, limit: "20" as any };
        const result = buildQuery(params);

        expect(result.page).toBe(3);
        expect(result.skip).toBe(40);
        expect(result.take).toBe(20);
      });

      it("should calculate skip correctly", () => {
        const params: IQueryParams<any> = { page: 5, limit: 15 };
        const result = buildQuery(params);

        expect(result.skip).toBe(60);
        expect(result.take).toBe(15);
      });
    });

    describe("search", () => {
      it("should build search query with single field", () => {
        const params: IQueryParams<any> = { search: "test" };
        const searchFields = ["name"];
        const result = buildQuery(params, searchFields);

        expect(result.where.OR).toEqual([
          { name: { contains: "test", mode: "insensitive" } },
        ]);
      });

      it("should build search query with multiple fields", () => {
        const params: IQueryParams<any> = { search: "john" };
        const searchFields = ["name", "email"];
        const result = buildQuery(params, searchFields);

        expect(result.where.OR).toEqual([
          { name: { contains: "john", mode: "insensitive" } },
          { email: { contains: "john", mode: "insensitive" } },
        ]);
      });

      it("should build search query with weighted fields", () => {
        const params: IQueryParams<any> = { search: "test" };
        const searchFields = [
          { field: "name", weight: 2 },
          { field: "email", weight: 1 },
        ];
        const result = buildQuery(params, searchFields);

        expect(result.where.OR).toEqual([
          { name: { contains: "test", mode: "insensitive" } },
          { email: { contains: "test", mode: "insensitive" } },
        ]);
        expect(result.orderBy).toEqual({ name: "asc" });
      });

      it("should not add search if no search fields provided", () => {
        const params: IQueryParams<any> = { search: "test" };
        const result = buildQuery(params);

        expect(result.where.OR).toBeUndefined();
      });
    });

    describe("filter", () => {
      it("should build filter from object", () => {
        const params: IQueryParams<any> = {
          filter: { name: "John", age: 25 },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({
          name: "John",
          age: 25,
        });
      });

      it("should build filter from JSON string", () => {
        const params: IQueryParams<any> = {
          filter: "{\"name\":\"John\",\"age\":25}",
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({
          name: "John",
          age: 25,
        });
      });

      it("should convert string booleans to actual booleans", () => {
        const params: IQueryParams<any> = {
          filter: { active: "true", verified: "false" },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({
          active: true,
          verified: false,
        });
      });

      it("should handle nested filter fields with dot notation", () => {
        const params: IQueryParams<any> = {
          filter: { "user.name": "John", "user.age": 25 },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({
          user: {
            name: "John",
            age: 25,
          },
        });
      });

      it("should handle filter operators (gte, lte, etc.)", () => {
        const params: IQueryParams<any> = {
          filter: {
            age: { gte: 18, lte: 65 },
            name: { contains: "john" },
          },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({
          age: { gte: 18, lte: 65 },
          name: { contains: "john" },
        });
      });

      it("should handle AND/OR operators in filters", () => {
        const params: IQueryParams<any> = {
          filter: {
            OR: [{ name: "John" }, { name: "Jane" }],
          },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({
          OR: [{ name: "John" }, { name: "Jane" }],
        });
      });

      it("should handle invalid JSON filter gracefully", () => {
        const params: IQueryParams<any> = {
          filter: "{invalid json}",
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({});
      });
    });

    describe("date filtering", () => {
      it("should add dateFrom filter", () => {
        const params: IQueryParams<any> = {
          dateFrom: "2024-01-01",
        };
        const result = buildQuery(params);

        expect(result.where.createdAt).toBeDefined();
        expect(result.where.createdAt.gte).toEqual(new Date("2024-01-01"));
      });

      it("should add dateTo filter", () => {
        const params: IQueryParams<any> = {
          dateTo: "2024-12-31",
        };
        const result = buildQuery(params);

        expect(result.where.createdAt).toBeDefined();
        expect(result.where.createdAt.lte).toEqual(new Date("2024-12-31"));
      });

      it("should add both dateFrom and dateTo filters", () => {
        const params: IQueryParams<any> = {
          dateFrom: "2024-01-01",
          dateTo: "2024-12-31",
        };
        const result = buildQuery(params);

        expect(result.where.createdAt).toEqual({
          gte: new Date("2024-01-01"),
          lte: new Date("2024-12-31"),
        });
      });
    });

    describe("sorting", () => {
      it("should add simple sort", () => {
        const params: IQueryParams<any> = {
          sort: "name",
        };
        const result = buildQuery(params);

        expect(result.orderBy).toEqual({ name: "asc" });
      });

      it("should add sort with custom order", () => {
        const params: IQueryParams<any> = {
          sort: "createdAt",
          order: "desc",
        };
        const result = buildQuery(params);

        expect(result.orderBy).toEqual({ createdAt: "desc" });
      });

      it("should handle nested sort with dot notation", () => {
        const params: IQueryParams<any> = {
          sort: "user.name",
          order: "asc",
        };
        const result = buildQuery(params);

        expect(result.orderBy).toEqual({
          user: {
            name: "asc",
          },
        });
      });

      it("should not override search ordering when sort is provided", () => {
        const params: IQueryParams<any> = {
          search: "test",
          sort: "createdAt",
        };
        const searchFields = [{ field: "name", weight: 2 }];
        const result = buildQuery(params, searchFields);

        expect(result.orderBy).toEqual({ createdAt: "asc" });
      });
    });

    describe("select", () => {
      it("should build select from array of strings", () => {
        const params: IQueryParams<any> = {
          select: ["id", "name", "email"],
        };
        const result = buildQuery(params);

        expect(result.select).toEqual({
          id: true,
          name: true,
          email: true,
        });
      });

      it("should build select from JSON string array", () => {
        const params: IQueryParams<any> = {
          select: "[\"id\",\"name\",\"email\"]",
        };
        const result = buildQuery(params);

        expect(result.select).toEqual({
          id: true,
          name: true,
          email: true,
        });
      });

      it("should build select from object", () => {
        const params: IQueryParams<any> = {
          select: { id: true, name: true },
        };
        const result = buildQuery(params);

        expect(result.select).toEqual({
          id: true,
          name: true,
        });
      });

      it("should handle nested select with dot notation", () => {
        const params: IQueryParams<any> = {
          select: ["id", "user.name", "user.email"],
        };
        const result = buildQuery(params);

        expect(result.select).toHaveProperty("user");
      });
    });

    describe("include", () => {
      it("should build include from array of strings", () => {
        const params: IQueryParams<any> = {
          include: ["posts", "profile"],
        };
        const result = buildQuery(params, undefined, false, "User");

        expect(result.include).toBeDefined();
        expect(result.include.posts).toBeDefined();
        expect(result.include.profile).toBe(true);
      });

      it("should build include from JSON string array", () => {
        const params: IQueryParams<any> = {
          include: "[\"posts\",\"comments\"]",
        };
        const result = buildQuery(params, undefined, false, "Post");

        expect(result.include).toBeDefined();
      });

      it("should build include from object", () => {
        const params: IQueryParams<any> = {
          include: { posts: true, profile: true },
        };
        const result = buildQuery(params);

        expect(result.include).toEqual({
          posts: true,
          profile: true,
        });
      });

      it("should handle nested include with dot notation", () => {
        const params: IQueryParams<any> = {
          include: ["posts.comments"],
        };
        const result = buildQuery(params, undefined, false, "User");

        expect(result.include).toHaveProperty("posts");
        expect(result.include.posts).toHaveProperty("include");
      });

      it("should apply deletedAt filter to list relations when includeDeleted is false", () => {
        const params: IQueryParams<any> = {
          include: ["posts"],
        };
        const result = buildQuery(params, undefined, false, "User");

        expect(result.include.posts).toBeDefined();
        expect(result.include.posts.where).toEqual({ deletedAt: null });
      });

      it("should not apply deletedAt filter when includeDeleted is true", () => {
        const params: IQueryParams<any> = {
          include: ["posts"],
        };
        const result = buildQuery(params, undefined, true, "User");

        expect(result.include.posts).toBe(true);
      });

      it("should filter only deleted when includeDeleted is 'only'", () => {
        const params: IQueryParams<any> = {
          include: ["posts"],
        };
        const result = buildQuery(params, undefined, "only", "User");

        expect(result.include.posts).toBeDefined();
        expect(result.include.posts.where).toEqual({ deletedAt: { not: null } });
      });

      it("should not apply deletedAt filter to non-list relations", () => {
        const params: IQueryParams<any> = {
          include: ["profile"],
        };
        const result = buildQuery(params, undefined, false, "User");

        expect(result.include.profile).toBe(true);
      });
    });

    describe("complex queries", () => {
      it("should handle combination of search, filter, sort, and pagination", () => {
        const params: IQueryParams<any> = {
          search: "john",
          filter: { active: "true" },
          sort: "createdAt",
          order: "desc",
          page: 2,
          limit: 20,
        };
        const searchFields = ["name", "email"];
        const result = buildQuery(params, searchFields);

        expect(result.where.OR).toBeDefined();
        expect(result.where.active).toBe(true);
        expect(result.orderBy).toEqual({ createdAt: "desc" });
        expect(result.page).toBe(2);
        expect(result.skip).toBe(20);
        expect(result.take).toBe(20);
      });

      it("should handle combination of include and filter", () => {
        const params: IQueryParams<any> = {
          include: ["posts"],
          filter: { name: "John" },
        };
        const result = buildQuery(params, undefined, false, "User");

        expect(result.where).toEqual({ name: "John" });
        expect(result.include).toBeDefined();
      });

      it("should handle empty params", () => {
        const params: IQueryParams<any> = {};
        const result = buildQuery(params);

        expect(result).toEqual({
          where: {},
          page: 1,
        });
      });
    });

    describe("edge cases", () => {
      it("should handle null filter values", () => {
        const params: IQueryParams<any> = {
          filter: { deletedAt: null },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({ deletedAt: null });
      });

      it("should handle undefined values in filter", () => {
        const params: IQueryParams<any> = {
          filter: { name: undefined },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({ name: undefined });
      });

      it("should handle empty select array", () => {
        const params: IQueryParams<any> = {
          select: [],
        };
        const result = buildQuery(params);

        expect(result.select).toBeUndefined();
      });

      it("should handle mixed search field types", () => {
        const params: IQueryParams<any> = { search: "test" };
        const searchFields = ["name", { field: "email", weight: 2 }];
        const result = buildQuery(params, searchFields);

        expect(result.where.OR).toHaveLength(2);
      });

      it("should handle deeply nested filter with dot notation", () => {
        const params: IQueryParams<any> = {
          filter: { "user.profile.bio": "test" },
        };
        const result = buildQuery(params);

        expect(result.where).toEqual({
          user: {
            profile: {
              bio: "test",
            },
          },
        });
      });

      it("should handle deeply nested sort with dot notation", () => {
        const params: IQueryParams<any> = {
          sort: "user.profile.createdAt",
          order: "desc",
        };
        const result = buildQuery(params);

        expect(result.orderBy).toEqual({
          user: {
            profile: {
              createdAt: "desc",
            },
          },
        });
      });
    });
  });
});
