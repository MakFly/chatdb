import { PostgreSQLDialect } from "./postgresql";
import { MySQLDialect } from "./mysql";
import { SQLiteDialect } from "./sqlite";
import { decrypt } from "../crypto";
import type { DatabaseDialect } from "./types";

export type { DatabaseDialect, ColumnInfo, ForeignKeyInfo, QueryResult } from "./types";

interface ConnectionRecord {
  type?: string | null;
  host?: string | null;
  port?: number | null;
  database?: string | null;
  username?: string | null;
  passwordEncrypted?: string | null;
  filePath?: string | null;
  sslEnabled: boolean;
}

export async function createDialect(conn: ConnectionRecord): Promise<DatabaseDialect> {
  const type = conn.type ?? "postgresql";

  if (type === "sqlite") {
    if (!conn.filePath) throw new Error("filePath is required for SQLite connections");
    const dialect = new SQLiteDialect(conn.filePath);
    await dialect.connect();
    return dialect;
  }

  const host = conn.host ?? "";
  const port = conn.port ?? (type === "mysql" || type === "mariadb" ? 3306 : 5432);
  const database = conn.database ?? "";
  const username = conn.username ?? "";
  const password = conn.passwordEncrypted ? decrypt(conn.passwordEncrypted) : "";

  if (type === "mysql" || type === "mariadb") {
    const dialect = new MySQLDialect({ host, port, database, username, password, sslEnabled: conn.sslEnabled });
    await dialect.connect();
    return dialect;
  }

  // Default: postgresql
  const dialect = new PostgreSQLDialect({ host, port, database, username, password, sslEnabled: conn.sslEnabled });
  await dialect.connect();
  return dialect;
}
