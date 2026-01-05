import { files, rows, type File, type Row, type InsertFile, type InsertRow, type SearchResult } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and } from "drizzle-orm";

export interface IStorage {
  createFile(file: InsertFile): Promise<File>;
  createRows(rowsData: InsertRow[]): Promise<void>;
  getFile(id: number): Promise<File | undefined>;
  getAllFiles(): Promise<File[]>;
  searchRows(terms: string[]): Promise<SearchResult[]>;
  getRows(fileId: number): Promise<Row[]>;
}

export class DatabaseStorage implements IStorage {
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async createRows(rowsData: InsertRow[]): Promise<void> {
    // Insert in batches to avoid query size limits
    const batchSize = 1000;
    for (let i = 0; i < rowsData.length; i += batchSize) {
      await db.insert(rows).values(rowsData.slice(i, i + batchSize));
    }
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getAllFiles(): Promise<File[]> {
    return await db.select().from(files);
  }

  async searchRows(terms: string[]): Promise<SearchResult[]> {
    if (terms.length === 0) return [];

    const conditions = terms.map(term => ilike(rows.searchText, `%${term}%`));
    
    // Join with files to get filename
    const results = await db
      .select({
        id: rows.id,
        fileId: rows.fileId,
        sheetName: rows.sheetName,
        rowNumber: rows.rowNumber,
        data: rows.data,
        searchText: rows.searchText,
        filename: files.originalName // Use originalName instead of filename
      })
      .from(rows)
      .innerJoin(files, eq(rows.fileId, files.id))
      .where(and(...conditions))
      .limit(100); // Limit results for performance

    return results;
  }

  async getRows(fileId: number): Promise<Row[]> {
    return await db.select().from(rows).where(eq(rows.fileId, fileId)).orderBy(rows.rowNumber);
  }

  async deleteFile(id: number): Promise<void> {
    const file = await this.getFile(id);
    if (file) {
      // 1. Delete rows from DB
      await db.delete(rows).where(eq(rows.fileId, id));
      // 2. Delete file record from DB
      await db.delete(files).where(eq(files.id, id));
      // 3. Delete physical file if it exists
      try {
        import("fs").then(fs => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      } catch (e) {
        console.error("Failed to delete physical file:", e);
      }
    }
  }
}

export const storage = new DatabaseStorage();
