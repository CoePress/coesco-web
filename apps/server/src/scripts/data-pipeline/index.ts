/* eslint-disable node/prefer-global/process */
import { closeConnections, createContext, runMigrations } from "./migrator";
import type { Migration } from "./migrator";

// Import modules
import { catalogMigrations } from "./catalog";
import { employeeMigrations } from "./employees";
import { quoteMigrations } from "./quotes";

// All available migrations grouped by module
export const modules = {
  employees: employeeMigrations,
  catalog: catalogMigrations,
  quotes: quoteMigrations,
} as const;

// Default run order
const defaultOrder: Migration[] = [
  ...employeeMigrations,
  ...catalogMigrations,
  ...quoteMigrations,
];

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Data Pipeline - Legacy Migration Tool

Usage:
  npx ts-node -r tsconfig-paths/register src/scripts/data-pipeline/index.ts [options]

Options:
  --module <name>    Run specific module (employees, catalog, quotes)
  --list             List all available migrations
  --help             Show this help

Examples:
  npm run pipeline                    # Run all migrations
  npm run pipeline -- --module employees  # Run only employee migrations
  npm run pipeline -- --list          # List migrations
`);
    return;
  }

  if (args.includes("--list")) {
    console.log("\nAvailable migrations:\n");
    for (const [name, migrations] of Object.entries(modules)) {
      console.log(`${name}:`);
      migrations.forEach(m => console.log(`  - ${m.name}`));
    }
    return;
  }

  const moduleIndex = args.indexOf("--module");
  let migrations = defaultOrder;

  if (moduleIndex !== -1 && args[moduleIndex + 1]) {
    const moduleName = args[moduleIndex + 1] as keyof typeof modules;
    if (!modules[moduleName]) {
      console.error(`Unknown module: ${moduleName}`);
      console.error(`Available: ${Object.keys(modules).join(", ")}`);
      process.exit(1);
    }
    migrations = modules[moduleName];
  }

  try {
    await runMigrations(migrations);
  }
  catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
  finally {
    await closeConnections();
    process.exit(0);
  }
}

// Export for programmatic use
export { createContext, closeConnections, runMigrations } from "./migrator";
export type { Migration, MigrationConfig, MigrationContext, MigrationResult } from "./migrator";

if (require.main === module) {
  main();
}
