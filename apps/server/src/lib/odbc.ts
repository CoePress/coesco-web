import { connectionManager } from "./odbc-connection";

export { connectionManager, ConnectionManager } from "./odbc-connection";
export { legacyService, LegacyService } from "./odbc-service";
export * from "./odbc-types";

export async function initializeLegacyService(): Promise<void> {
  await connectionManager.initialize();
}

export async function closeLegacyService(): Promise<void> {
  await connectionManager.close();
}
