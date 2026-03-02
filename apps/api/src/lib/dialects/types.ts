export interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string | null;
  table_schema?: string;
}

export interface ForeignKeyInfo {
  table_name: string;
  column_name: string;
  foreign_table: string;
  foreign_column: string;
}

export interface QueryResult {
  rowCount: number;
  rows: unknown[];
  error?: string;
}

export interface DatabaseDialect {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getColumns(tableNameFilter?: string): Promise<ColumnInfo[]>;
  getForeignKeys(): Promise<ForeignKeyInfo[]>;
  execute(sql: string, limit?: number): Promise<QueryResult>;
  executeMutation(sql: string): Promise<QueryResult>;
  explainQuery(sql: string): Promise<unknown>;
  supportsReturning(): boolean;
  testConnection(): Promise<boolean>;
  dialectName(): string;
  getDatabaseName(): string;
}
