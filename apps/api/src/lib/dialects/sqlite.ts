import Database from "better-sqlite3";
import type { DatabaseDialect, ColumnInfo, ForeignKeyInfo, QueryResult } from "./types";

export class SQLiteDialect implements DatabaseDialect {
  private db: Database.Database | null = null;

  constructor(private filePath: string) {}

  async connect(): Promise<void> {
    this.db = new Database(this.filePath, { readonly: false });
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private ensureConnected(): Database.Database {
    if (!this.db) throw new Error("SQLite not connected");
    return this.db;
  }

  async getColumns(tableNameFilter?: string): Promise<ColumnInfo[]> {
    const db = this.ensureConnected();
    const filter = tableNameFilter ?? "%";

    // Get all tables matching filter
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ?`
    ).all(filter) as { name: string }[];

    const columns: ColumnInfo[] = [];
    for (const table of tables) {
      const pragma = db.prepare(`PRAGMA table_info(${JSON.stringify(table.name)})`).all() as {
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
      }[];

      for (const col of pragma) {
        columns.push({
          table_name: table.name,
          column_name: col.name,
          data_type: col.type || "TEXT",
          is_nullable: col.notnull ? "NO" : "YES",
          column_default: col.dflt_value,
        });
      }
    }
    return columns;
  }

  async getForeignKeys(): Promise<ForeignKeyInfo[]> {
    const db = this.ensureConnected();
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table'`
    ).all() as { name: string }[];

    const fks: ForeignKeyInfo[] = [];
    for (const table of tables) {
      const pragma = db.prepare(`PRAGMA foreign_key_list(${JSON.stringify(table.name)})`).all() as {
        from: string;
        table: string;
        to: string;
      }[];

      for (const fk of pragma) {
        fks.push({
          table_name: table.name,
          column_name: fk.from,
          foreign_table: fk.table,
          foreign_column: fk.to,
        });
      }
    }
    return fks;
  }

  async execute(sql: string, limit = 500): Promise<QueryResult> {
    const db = this.ensureConnected();
    const trimmed = sql.trim().replace(/;$/, "");
    const rows = db.prepare(`SELECT * FROM (${trimmed}) AS __q LIMIT ${limit}`).all();
    return { rowCount: rows.length, rows };
  }

  async executeMutation(sql: string): Promise<QueryResult> {
    const db = this.ensureConnected();
    const result = db.prepare(sql).run();
    return { rowCount: result.changes, rows: [] };
  }

  async explainQuery(sql: string): Promise<unknown> {
    const db = this.ensureConnected();
    const rows = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
    return rows;
  }

  supportsReturning(): boolean {
    return false;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const db = this.ensureConnected();
      db.prepare("SELECT 1").get();
      return true;
    } catch {
      return false;
    } finally {
      await this.disconnect();
    }
  }

  dialectName(): string {
    return "sqlite";
  }

  getDatabaseName(): string {
    return this.filePath;
  }
}
