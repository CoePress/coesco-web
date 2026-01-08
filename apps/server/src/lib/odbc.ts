import { connectionManager } from "./odbc-connection";

// Connection management
export { connectionManager, ConnectionManager } from "./odbc-connection";

// Generic CRUD service for legacy databases
export { legacyService, LegacyService } from "./odbc-service";

// ID generation for legacy tables
export { idGenerator, IdGenerator } from "./odbc-id-generator";

// Domain-specific services
export { quoteService, QuoteService } from "./quote-service";
export type { QuoteLineItem, QuoteValueResult } from "./quote-service";

// Types
export * from "./odbc-types";

export async function initializeLegacyService(): Promise<void> {
  await connectionManager.initialize();
}

export async function closeLegacyService(): Promise<void> {
  await connectionManager.close();
}
