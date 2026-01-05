import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rows = pgTable("rows", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  sheetName: text("sheet_name").notNull(),
  rowNumber: integer("row_number").notNull(),
  data: jsonb("data").notNull(), // Stores the array of cell values
  searchText: text("search_text").notNull(), // Concatenated text for searching
});

export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true });
export const insertRowSchema = createInsertSchema(rows).omit({ id: true });

export type File = typeof files.$inferSelect;
export type Row = typeof rows.$inferSelect;

export interface SearchResult extends Row {
  filename: string;
}

export interface FileData {
  id: number;
  filename: string;
  originalName: string;
  sheets: Record<string, any[][]>;
}
