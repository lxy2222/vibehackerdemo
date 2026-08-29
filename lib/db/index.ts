import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function migrate(connection: Database.Database) {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      leader_request TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 10,
      brief TEXT,
      requirement_spec TEXT,
      clarification_answers TEXT,
      column_mapping TEXT,
      facts TEXT,
      notes_chunks TEXT,
      deck_spec TEXT,
      deck_id TEXT,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      spec TEXT NOT NULL,
      facts TEXT NOT NULL,
      pptx_path TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);
    CREATE INDEX IF NOT EXISTS idx_decks_project ON decks(project_id);
  `);

  const columns = connection.pragma("table_info(projects)") as { name: string }[];
  if (!columns.some((column) => column.name === "brief")) {
    connection.exec("ALTER TABLE projects ADD COLUMN brief TEXT");
  }
}

export function getDb() {
  if (db) {
    return db;
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  migrate(sqlite);
  db = drizzle(sqlite, { schema });
  return db;
}
