import type odbc from "odbc";

export class ODBC {
  async connect() { }

  async close() { }

  async create() { }

  async getAll() { }

  async update() { }

  async delete() { }
}

export class ODBCConnection {
  private stdConnection?: odbc.Connection;
  private jobConnection?: odbc.Connection;
  private quoteConnection?: odbc.Connection;
}
