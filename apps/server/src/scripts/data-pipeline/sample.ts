/**
 * ============================================================================
 * SAMPLE MIGRATION MODULE - Fully Documented
 * ============================================================================
 *
 * This file demonstrates how to create a migration module for the data pipeline.
 * It migrates data from the legacy FileMaker databases into our new PostgreSQL database.
 *
 * ARCHITECTURE OVERVIEW:
 * ----------------------
 * The data pipeline is designed to migrate data from three legacy FileMaker databases
 * (accessed via ODBC) into our new Prisma-managed PostgreSQL database.
 *
 * Legacy Databases (FileMaker via ODBC):
 *   - "std"   : Standard/shared data (employees, contacts, companies)
 *   - "quote" : Quote-related data (quotes, revisions, equipment, options)
 *   - "job"   : Job/production data
 *
 * Target Database:
 *   - PostgreSQL managed by Prisma ORM
 *
 * KEY CONCEPTS:
 * -------------
 * 1. Migration: A single unit of work that moves data from one legacy table to one target table
 * 2. Module: A collection of related migrations (e.g., all employee-related migrations)
 * 3. MigrationConfig: Defines HOW to migrate (field mappings, transforms, filters)
 * 4. MigrationContext: Provides access to databases and utilities during migration
 *
 * EXECUTION FLOW:
 * ---------------
 * 1. CLI starts (index.ts) → creates MigrationContext
 * 2. For each Migration in the module:
 *    a. runMigration() is called with the config
 *    b. Legacy records are fetched in batches (default 5000)
 *    c. Each record is transformed using fieldMappings + beforeSave
 *    d. Transformed records are bulk-inserted into PostgreSQL
 *    e. Progress is logged, errors are tracked
 * 3. Connections are closed, results are reported
 */

import type { Migration, MigrationContext } from "./migrator";

import { runMigration } from "./migrator";

/**
 * ============================================================================
 * MIGRATION #1: Simple Migration (Direct Field Mapping)
 * ============================================================================
 *
 * This is the simplest form of migration - direct field-to-field mapping
 * with optional transformations.
 */
export const migrateCoilTypesSimple: Migration = {
  /**
   * name: Human-readable name shown in logs
   */
  name: "Coil Types (Simple Example)",

  /**
   * run: The function that executes the migration
   *
   * @param ctx - MigrationContext containing:
   *   - ctx.db: Prisma client for PostgreSQL
   *   - ctx.legacy: LegacyService for FileMaker ODBC access
   *   - ctx.findRecord: Helper to find records with caching
   *   - ctx.cache: Map for storing data between operations
   */
  run: async (ctx: MigrationContext) => {
    /**
     * runMigration() handles all the heavy lifting:
     * - Fetching records from legacy DB in batches
     * - Applying field mappings and transforms
     * - Bulk inserting into PostgreSQL
     * - Error handling and retry logic
     * - Progress logging
     */
    return runMigration(
      {
        /**
         * sourceDatabase: Which legacy FileMaker database to read from
         * Options: "std" | "quote" | "job"
         */
        sourceDatabase: "quote",

        /**
         * sourceTable: The table name in the legacy database
         * This is the FileMaker table we're reading FROM
         */
        sourceTable: "CoilType",

        /**
         * targetTable: The Prisma model name (camelCase) to write TO
         * Must match a model in your Prisma schema
         */
        targetTable: "coilType",

        /**
         * fieldMappings: Array defining how legacy fields map to new fields
         *
         * Each mapping has:
         *   - from: Legacy field name (exact match, case-sensitive)
         *   - to: New field name (must match Prisma model field)
         *   - transform?: Function to convert the value (optional)
         *   - defaultValue?: Value to use if source is null/undefined (optional)
         *   - required?: If true, skip record if this field is null (optional)
         */
        fieldMappings: [
          {
            // Direct mapping - no transformation needed
            from: "CoilDesc", // Legacy field name
            to: "description", // Prisma model field name
            required: true, // Skip record if CoilDesc is null
          },
          {
            // Transform: provide default if null
            from: "CoilMult",
            to: "multiplier",
            transform: value => value || 1, // Default to 1 if null/undefined
          },
          {
            // Transform: parse string to integer
            from: "SortOrder",
            to: "sortOrder",
            transform: value => Number.parseInt(value) || 999,
          },
          {
            // Transform: convert string "1" to boolean true
            from: "IsArchived",
            to: "isArchived",
            transform: value => value === "1",
          },
          {
            // Transform: ensure string type for ID
            from: "CoilID",
            to: "legacyId",
            transform: value => value?.toString(),
          },
        ],

        /**
         * skipDuplicates: If true, Prisma will skip records that violate
         * unique constraints instead of throwing an error.
         * Default: true
         */
        skipDuplicates: true,
      },
      ctx,
    );
  },
};

/**
 * ============================================================================
 * MIGRATION #2: Migration with beforeSave Hook
 * ============================================================================
 *
 * When you need more complex logic than simple field mapping, use beforeSave.
 * This runs AFTER field mappings but BEFORE the record is inserted.
 */
export const migrateDepartmentsWithBeforeSave: Migration = {
  name: "Departments (beforeSave Example)",

  run: async (ctx: MigrationContext) => {
    return runMigration(
      {
        sourceDatabase: "std",
        sourceTable: "Employee",
        targetTable: "department",

        /**
         * fieldMappings can be empty if you handle everything in beforeSave
         * Or you can use both - fieldMappings runs first, then beforeSave
         */
        fieldMappings: [
          {
            from: "DeptCode",
            to: "code",
            transform: v => v?.trim(),
            required: true,
          },
        ],

        /**
         * beforeSave: Runs after fieldMappings, before insert
         *
         * Use this for:
         *   - Looking up related records (foreign keys)
         *   - Complex transformations
         *   - Conditional logic
         *   - Adding computed fields
         *   - Skipping records based on complex conditions
         *
         * @param data - The mapped data from fieldMappings
         * @param original - The raw record from the legacy database
         * @param ctx - MigrationContext for database access
         *
         * @returns
         *   - Object: The data to insert (can be modified)
         *   - null: Skip this record (don't insert)
         */
        beforeSave: async (data, original, ctx) => {
          // Get the code we mapped
          const code = original.DeptCode?.trim();

          // Skip if no code (return null = skip record)
          if (!code) {
            return null;
          }

          // Check if department already exists (avoid duplicates)
          // ctx.findRecord caches results for performance
          const existing = await ctx.findRecord("department", { code });
          if (existing) {
            return null; // Skip - already exists
          }

          // Return the final object to insert
          // We spread `data` (from fieldMappings) and add extra fields
          return {
            ...data, // Contains: { code: "..." }
            name: code, // Add name field
            description: code, // Add description field
            createdById: "system",
            updatedById: "system",
          };
        },
      },
      ctx,
    );
  },
};

/**
 * ============================================================================
 * MIGRATION #3: Migration with Foreign Key Lookups
 * ============================================================================
 *
 * When your target table has foreign keys, you need to look up the related
 * records to get their IDs.
 */
export const migrateEmployeesWithRelations: Migration = {
  name: "Employees (Foreign Key Example)",

  run: async (ctx: MigrationContext) => {
    return runMigration(
      {
        sourceDatabase: "std",
        sourceTable: "Employee",
        targetTable: "employee",

        fieldMappings: [
          { from: "EmpNum", to: "number", transform: v => v?.trim(), required: true },
          { from: "EmpFirstName", to: "firstName", transform: v => v?.trim(), required: true },
          { from: "EmpLastName", to: "lastName", transform: v => v?.trim(), required: true },
          { from: "EmpInitials", to: "initials", transform: v => v?.trim(), required: true },
          {
            from: "HireDate",
            to: "hireDate",
            // Transform: parse date, return null if invalid
            transform: v => (v ? new Date(v) : null),
          },
        ],

        beforeSave: async (data, original, ctx) => {
          const initials = original.EmpInitials?.trim();
          if (!initials)
            return null;

          /**
           * FOREIGN KEY LOOKUP PATTERN:
           *
           * ctx.findRecord<Type>(tableName, whereClause)
           *
           * - tableName: Prisma model name (camelCase)
           * - whereClause: Prisma where object
           * - Returns: The found record or null
           * - Caches results for performance (same query = same result)
           *
           * Type parameter is optional but helps with TypeScript
           */

          // Look up the user record by username
          const user = await ctx.findRecord<{ id: string }>(
            "user", // Table to search
            { username: initials.toLowerCase() }, // Where clause
          );

          // If no user found, skip this employee
          if (!user) {
            return null;
          }

          // Look up department (optional relation)
          const deptCode = original.DeptCode?.trim();
          const department = deptCode
            ? await ctx.findRecord<{ id: string }>("department", { code: deptCode })
            : null;

          return {
            ...data,
            userId: user.id, // Required foreign key
            departmentId: department?.id || null, // Optional foreign key
            email: `${initials}@company.com`,
            createdAt: new Date(original.CreateDate || Date.now()),
            updatedAt: new Date(original.ModifyDate || Date.now()),
          };
        },
      },
      ctx,
    );
  },
};

/**
 * ============================================================================
 * MIGRATION #4: Migration with Filter
 * ============================================================================
 *
 * Use `filter` to skip records BEFORE any processing happens.
 * More efficient than returning null from beforeSave.
 */
export const migrateActiveEmployeesOnly: Migration = {
  name: "Active Employees Only (Filter Example)",

  run: async (ctx: MigrationContext) => {
    return runMigration(
      {
        sourceDatabase: "std",
        sourceTable: "Employee",
        targetTable: "employee",

        /**
         * filter: Runs BEFORE fieldMappings and beforeSave
         *
         * Use for simple conditions that don't require database lookups.
         * Return true to process the record, false to skip it.
         *
         * @param record - Raw record from legacy database
         * @returns boolean - true = process, false = skip
         */
        filter: (record) => {
          // Only migrate employees that:
          // 1. Have initials
          // 2. Are not terminated (no TermDate)
          // 3. Have a first name
          return (
            record.EmpInitials?.trim()
            && !record.TermDate
            && record.EmpFirstName?.trim()
          );
        },

        fieldMappings: [
          { from: "EmpNum", to: "number", transform: v => v?.trim(), required: true },
          { from: "EmpFirstName", to: "firstName", transform: v => v?.trim(), required: true },
          { from: "EmpLastName", to: "lastName", transform: v => v?.trim(), required: true },
          { from: "EmpInitials", to: "initials", transform: v => v?.trim(), required: true },
        ],

        beforeSave: async (data, original, ctx) => {
          // At this point we KNOW the record passed the filter
          // So we don't need to re-check those conditions

          const user = await ctx.findRecord<{ id: string }>(
            "user",
            { username: original.EmpInitials.toLowerCase() },
          );

          if (!user)
            return null;

          return {
            ...data,
            userId: user.id,
            email: `${original.EmpInitials}@company.com`,
          };
        },
      },
      ctx,
    );
  },
};

/**
 * ============================================================================
 * MIGRATION #5: Migration with Sorting and Batch Options
 * ============================================================================
 *
 * Control the order of processing and batch sizes for performance tuning.
 */
export const migrateWithOptions: Migration = {
  name: "With Options (Sort & Batch Example)",

  run: async (ctx: MigrationContext) => {
    return runMigration(
      {
        sourceDatabase: "quote",
        sourceTable: "EquipList",
        targetTable: "item",

        /**
         * sort: Field to sort by when fetching from legacy DB
         * Useful when you need consistent ordering or when
         * processing order matters (e.g., parent records before children)
         */
        sort: "Model",

        /**
         * order: Sort direction
         * Options: "ASC" | "DESC"
         */
        order: "ASC",

        /**
         * legacyFetchSize: How many records to fetch from legacy DB at once
         * Default: 5000
         *
         * Larger = fewer round trips but more memory
         * Smaller = more round trips but less memory
         */
        legacyFetchSize: 10000,

        /**
         * batchSize: How many records to insert into PostgreSQL at once
         * Default: 1000
         *
         * Larger = faster but may hit query size limits
         * Smaller = slower but more reliable
         */
        batchSize: 500,

        fieldMappings: [
          { from: "Model", to: "modelNumber", transform: v => v?.trim() },
          { from: "Description", to: "description" },
        ],

        beforeSave: (data, original) => ({
          ...data,
          type: "Equipment",
          leadTime: 112,
          createdAt: new Date(original.CreateDate || Date.now()),
          updatedAt: new Date(original.ModifyDate || Date.now()),
        }),
      },
      ctx,
    );
  },
};

/**
 * ============================================================================
 * MIGRATION #6: Migration with Cache for Performance
 * ============================================================================
 *
 * Use ctx.cache to store data that's needed across multiple records.
 * Useful for lookups that would otherwise be repeated.
 */
export const migrateWithCache: Migration = {
  name: "With Cache (Performance Example)",

  run: async (ctx: MigrationContext) => {
    /**
     * PRE-LOAD DATA INTO CACHE
     *
     * Before running the migration, we can load frequently-needed
     * data into the cache. This avoids repeated database lookups.
     */

    // Load all departments into a map for quick lookup
    const departments = await ctx.db.department.findMany({
      select: { id: true, code: true },
    });

    // Store in cache as a Map for O(1) lookups
    const deptMap = new Map(departments.map(d => [d.code, d.id]));
    ctx.cache.set("departmentsByCode", deptMap);

    // Load all users into a map
    const users = await ctx.db.user.findMany({
      select: { id: true, username: true },
    });
    const userMap = new Map(users.map(u => [u.username, u.id]));
    ctx.cache.set("usersByUsername", userMap);

    return runMigration(
      {
        sourceDatabase: "std",
        sourceTable: "Employee",
        targetTable: "employee",

        fieldMappings: [
          { from: "EmpNum", to: "number", transform: v => v?.trim(), required: true },
          { from: "EmpFirstName", to: "firstName", transform: v => v?.trim(), required: true },
          { from: "EmpLastName", to: "lastName", transform: v => v?.trim(), required: true },
          { from: "EmpInitials", to: "initials", transform: v => v?.trim(), required: true },
        ],

        beforeSave: async (data, original, ctx) => {
          const initials = original.EmpInitials?.trim()?.toLowerCase();
          if (!initials)
            return null;

          // Get maps from cache (instant, no DB call)
          const userMap = ctx.cache.get("usersByUsername") as Map<string, string>;
          const deptMap = ctx.cache.get("departmentsByCode") as Map<string, string>;

          // Look up user ID from cache
          const userId = userMap.get(initials);
          if (!userId)
            return null;

          // Look up department ID from cache
          const deptCode = original.DeptCode?.trim();
          const departmentId = deptCode ? deptMap.get(deptCode) : null;

          return {
            ...data,
            userId,
            departmentId: departmentId || null,
            email: `${initials}@company.com`,
          };
        },
      },
      ctx,
    );
  },
};

/**
 * ============================================================================
 * MIGRATION #7: Migration with Post-Processing
 * ============================================================================
 *
 * Sometimes you need to do additional work after the main migration.
 * Handle this by running additional logic after runMigration().
 */
export const migrateWithPostProcessing: Migration = {
  name: "With Post-Processing",

  run: async (ctx: MigrationContext) => {
    // Run the main migration
    const result = await runMigration(
      {
        sourceDatabase: "quote",
        sourceTable: "QRev",
        targetTable: "quoteRevision",

        fieldMappings: [
          { from: "QRev", to: "revision", transform: v => v?.toString().trim(), required: true },
          { from: "QDate", to: "quoteDate", transform: v => new Date(v), required: true },
        ],

        filter: r => r.QYear && r.QNum && r.QRev,

        beforeSave: async (data, original, ctx) => {
          const quote = await ctx.findRecord<{ id: string }>("quote", {
            year: original.QYear?.toString(),
            number: original.QNum?.toString(),
          });

          if (!quote)
            return null;

          return {
            ...data,
            quoteId: quote.id,
            status: "DRAFT",
            createdAt: new Date(original.CreateDate || Date.now()),
            updatedAt: new Date(original.ModifyDate || Date.now()),
          };
        },
      },
      ctx,
    );

    /**
     * POST-PROCESSING
     *
     * After the main migration, we might need to:
     * - Update related records
     * - Calculate derived values
     * - Fix up relationships
     * - Clean up data
     */

    // Only run post-processing if we actually created records
    if (result.created > 0) {
      console.log("Running post-processing...");

      // Example: Mark older revisions as "REVISED"
      const quotes = await ctx.db.quote.findMany({ select: { id: true } });

      for (const quote of quotes) {
        const revisions = await ctx.db.quoteRevision.findMany({
          where: { quoteId: quote.id },
          orderBy: { revision: "desc" },
        });

        // Skip the first (latest) revision, mark rest as REVISED
        for (let i = 1; i < revisions.length; i++) {
          await ctx.db.quoteRevision.update({
            where: { id: revisions[i].id },
            data: { status: "REVISED" },
          });
        }
      }

      console.log("Post-processing complete");
    }

    return result;
  },
};

/**
 * ============================================================================
 * MIGRATION #8: Migration that Updates Instead of Creates
 * ============================================================================
 *
 * Sometimes you need to update existing records rather than create new ones.
 * Return null from beforeSave after doing the update.
 */
export const updateExistingRecords: Migration = {
  name: "Update Managers (Update Example)",

  run: async (ctx: MigrationContext) => {
    return runMigration(
      {
        sourceDatabase: "std",
        sourceTable: "EmpMgr", // Table linking employees to managers
        targetTable: "employee", // We're updating, not creating

        fieldMappings: [], // Empty - we handle everything in beforeSave

        beforeSave: async (data, original, ctx) => {
          const empNum = original.EmpNum?.trim();
          const mgrNum = original.MgrNum?.trim();

          if (!empNum || !mgrNum)
            return null;

          // Find both employee and manager
          const employee = await ctx.findRecord<{ id: string }>("employee", { number: empNum });
          const manager = await ctx.findRecord<{ id: string }>("employee", { number: mgrNum });

          if (!employee || !manager)
            return null;

          // UPDATE the employee record directly
          await ctx.db.employee.update({
            where: { id: employee.id },
            data: { managerId: manager.id },
          });

          // Return null - we already did the update, nothing to insert
          return null;
        },
      },
      ctx,
    );
  },
};

/**
 * ============================================================================
 * EXPORT: Module Definition
 * ============================================================================
 *
 * Export your migrations as an array. The order matters - migrations
 * run in the order they appear in the array.
 *
 * Consider dependencies:
 * - Departments before Employees (employees reference departments)
 * - Users before Employees (employees reference users)
 * - Quotes before QuoteRevisions (revisions reference quotes)
 */
export const sampleMigrations: Migration[] = [
  migrateCoilTypesSimple,
  migrateDepartmentsWithBeforeSave,
  migrateEmployeesWithRelations,
  // ... add more in dependency order
];

/**
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 * 1. Import in index.ts:
 *    import { sampleMigrations } from "./sample";
 *
 * 2. Add to modules:
 *    export const modules = {
 *      sample: sampleMigrations,
 *      // ... other modules
 *    };
 *
 * 3. Run from CLI:
 *    npm run pipeline -- --module sample
 *
 * 4. Or run programmatically:
 *    import { createContext, runMigrations, closeConnections } from "./migrator";
 *    import { sampleMigrations } from "./sample";
 *
 *    const ctx = await createContext();
 *    await runMigrations(sampleMigrations);
 *    await closeConnections();
 */
