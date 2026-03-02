import mysql from "mysql2/promise";
import type { DatabaseDialect, ColumnInfo, ForeignKeyInfo, QueryResult } from "./types";

export class MySQLDialect implements DatabaseDialect {
  private connection: mysql.Connection | null = null;
  private isMariaDB = false;

  constructor(private config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    sslEnabled: boolean;
  }) {}

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.sslEnabled ? {} : undefined,
      connectTimeout: 10000,
    });

    // Detect MariaDB
    const [rows] = await this.connection.execute("SELECT VERSION() AS version");
    const version = (rows as any[])[0]?.version ?? "";
    this.isMariaDB = version.toLowerCase().includes("mariadb");
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  private ensureConnected(): mysql.Connection {
    if (!this.connection) throw new Error("MySQL not connected");
    return this.connection;
  }

  async getColumns(tableNameFilter?: string): Promise<ColumnInfo[]> {
    const conn = this.ensureConnected();
    const filter = tableNameFilter?.replace(/%/g, "%") ?? "%";
    const [rows] = await conn.execute(
      `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name,
              DATA_TYPE as data_type,
              IS_NULLABLE as is_nullable,
              COLUMN_DEFAULT as column_default
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME LIKE ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [filter]
    );
    return rows as ColumnInfo[];
  }

  async getForeignKeys(): Promise<ForeignKeyInfo[]> {
    const conn = this.ensureConnected();
    const [rows] = await conn.execute(
      `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name,
              REFERENCED_TABLE_NAME as foreign_table,
              REFERENCED_COLUMN_NAME as foreign_column
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    return rows as ForeignKeyInfo[];
  }

  async execute(sql: string, limit = 500): Promise<QueryResult> {
    const conn = this.ensureConnected();
    const trimmed = sql.trim().replace(/;$/, "");
    const [rows] = await conn.execute(`SELECT * FROM (${trimmed}) AS __q LIMIT ${limit}`);
    const arr = Array.isArray(rows) ? rows : [rows];
    return { rowCount: arr.length, rows: arr };
  }

  async executeMutation(sql: string): Promise<QueryResult> {
    const conn = this.ensureConnected();
    const [result] = await conn.execute(sql);
    return { rowCount: (result as any).affectedRows ?? 0, rows: [] };
  }

  async explainQuery(sql: string): Promise<unknown> {
    const conn = this.ensureConnected();
    const [rows] = await conn.execute(`EXPLAIN ${sql}`);
    return rows;
  }

  supportsReturning(): boolean {
    // MariaDB 10.5+ supports RETURNING, but we keep it simple and return false
    return false;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const conn = this.ensureConnected();
      await conn.execute("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      await this.disconnect();
    }
  }

  dialectName(): string {
    return this.isMariaDB ? "mariadb" : "mysql";
  }

  getDatabaseName(): string {
    return this.config.database;
  }
}
