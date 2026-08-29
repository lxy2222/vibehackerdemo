import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  leaderRequest: text("leader_request").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(10),
  brief: text("brief"),
  requirementSpec: text("requirement_spec"),
  clarificationAnswers: text("clarification_answers"),
  columnMapping: text("column_mapping"),
  facts: text("facts"),
  notesChunks: text("notes_chunks"),
  deckSpec: text("deck_spec"),
  deckId: text("deck_id"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  kind: text("kind").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  path: text("path").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const decks = sqliteTable("decks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  spec: text("spec").notNull(),
  facts: text("facts").notNull(),
  pptxPath: text("pptx_path").notNull(),
  createdAt: integer("created_at").notNull(),
});
