import postgres from "postgres";
import type { DatabaseDialect, ColumnInfo, ForeignKeyInfo, QueryResult } from "./types";

export class PostgreSQLDialect implements DatabaseDialect {
  private client: ReturnType<typeof postgres>;
  private database: string;

  constructor(private config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    sslEnabled: boolean;
  }) {
    this.database = config.database;
    this.client = postgres({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: config.sslEnabled ? "require" : false,
      connect_timeout: 10,
      max: 1,
    });
  }

  async connect(): Promise<void> {
    // postgres lazy connects on first query
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async getColumns(tableNameFilter?: string): Promise<ColumnInfo[]> {
    const filter = tableNameFilter ?? "%";
    return this.client`
      SELECT
        n.nspname AS table_schema,
        c.relname AS table_name,
        a.attname AS column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
        CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable,
        pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
      LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
      WHERE c.relkind IN ('r', 'p')
        AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND c.relname LIKE ${filter}
      ORDER BY n.nspname, c.relname, a.attnum
    ` as unknown as ColumnInfo[];
  }

  async getForeignKeys(): Promise<ForeignKeyInfo[]> {
    return this.client`
      SELECT
        cl.relname AS table_name, a.attname AS column_name,
        clf.relname AS foreign_table, af.attname AS foreign_column
      FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class cl ON cl.oid = con.conrelid
      JOIN pg_catalog.pg_class clf ON clf.oid = con.confrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = cl.relnamespace
      JOIN pg_catalog.pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
      JOIN pg_catalog.pg_attribute af ON af.attrelid = con.confrelid AND af.attnum = ANY(con.confkey)
      WHERE con.contype = 'f'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ` as unknown as ForeignKeyInfo[];
  }

  async execute(sql: string, limit = 500): Promise<QueryResult> {
    const trimmed = sql.trim().replace(/;$/, "");
    const limited = `SELECT * FROM (${trimmed}) AS __q LIMIT ${limit}`;
    const rows = await this.client.unsafe(limited);
    return { rowCount: rows.length, rows: Array.isArray(rows) ? rows : [rows] };
  }

  async executeMutation(sql: string): Promise<QueryResult> {
    const result = await this.client.unsafe(sql);
    const rows = Array.isArray(result) ? result : result ? [result] : [];
    return { rowCount: rows.length, rows };
  }

  async explainQuery(sql: string): Promise<unknown> {
    const result = await this.client.unsafe(`EXPLAIN ANALYZE ${sql}`);
    return result;
  }

  supportsReturning(): boolean {
    return true;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  dialectName(): string {
    return "postgresql";
  }

  getDatabaseName(): string {
    return this.database;
  }
}
