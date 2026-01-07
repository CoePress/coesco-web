import odbc from "odbc";

import type { DatabaseName } from "./odbc-types";

import env from "./env";
import logger from "./logger";

const CONNECTION_TIMEOUT = 10000;
const HEALTH_CHECK_INTERVAL = 60000;

function buildConnectionString(host: string, port: number, database: string): string {
  return `
    Driver=${env.ODBC_DRIVER};
    HostName=${host};
    PortNumber=${port};
    DatabaseName=${database};
    UID=${env.PROSQL_USER};
    PWD=${env.PROSQL_PASSWORD};
  `;
}

const connectionStrings: Record<DatabaseName, string> = {
  std: buildConnectionString(env.STD_HOST, env.STD_PORT, env.STD_DB),
  job: buildConnectionString(env.JOB_HOST, env.JOB_PORT, env.JOB_DB),
  quote: buildConnectionString(env.QUOTE_HOST, env.QUOTE_PORT, env.QUOTE_DB),
};

export class ConnectionManager {
  private connections: Map<DatabaseName, odbc.Connection | undefined> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  async initialize(): Promise<void> {
    logger.info("Initializing ODBC connections...");

    const results = await Promise.all([
      this.connect("std"),
      this.connect("job"),
      this.connect("quote"),
    ]);

    const connected = (["std", "job", "quote"] as const).filter((_, i) => results[i]);
    if (connected.length === 0) {
      logger.error("Failed to connect to any databases");
    }
    else {
      logger.info(`Connected to: ${connected.map(d => d.toUpperCase()).join(", ")}`);
    }

    this.startHealthCheck();
  }

  private async connect(database: DatabaseName): Promise<boolean> {
    try {
      logger.info(`Connecting to ${database.toUpperCase()}...`);

      const connection = await Promise.race([
        odbc.connect(connectionStrings[database]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), CONNECTION_TIMEOUT),
        ),
      ]);

      this.connections.set(database, connection);
      logger.info(`Connected to ${database.toUpperCase()}`);
      return true;
    }
    catch (err) {
      logger.error(`Failed to connect to ${database.toUpperCase()}:`, err);
      this.connections.set(database, undefined);
      return false;
    }
  }

  private startHealthCheck(): void {
    logger.info("Starting health check service...");

    this.healthCheckInterval = setInterval(async () => {
      for (const db of ["std", "job", "quote"] as const) {
        const conn = this.connections.get(db);
        if (!conn) {
          logger.warn(`No connection for ${db.toUpperCase()}, reconnecting...`);
          await this.connect(db);
          continue;
        }

        try {
          await conn.query("SELECT 1 FROM PUB.\"_File\" FETCH FIRST 1 ROW ONLY");
        }
        catch {
          logger.warn(`Lost connection to ${db.toUpperCase()}, reconnecting...`);
          await this.connect(db);
        }
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  get(database: DatabaseName): odbc.Connection | undefined {
    return this.connections.get(database);
  }

  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      logger.info("Health check stopped");
    }

    for (const [db, conn] of this.connections) {
      if (conn) {
        try {
          await conn.close();
          logger.info(`Closed ${db.toUpperCase()} connection`);
        }
        catch (err) {
          logger.error(`Error closing ${db.toUpperCase()}:`, err);
        }
      }
    }
  }
}

export const connectionManager = new ConnectionManager();
