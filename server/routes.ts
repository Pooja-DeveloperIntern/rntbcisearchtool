import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { api } from "@shared/routes";

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Create uploads dir if not exists
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  app.post(api.files.upload.path, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileRecord = await storage.createFile({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path
      });

      const workbook = xlsx.readFile(req.file.path);
      const allRows: any[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // Parse sheet to JSON array of arrays
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        jsonData.forEach((rowData, index) => {
          // Convert row data to simple array of values
          // Clean up undefined/nulls for search text
          const cleanRow = rowData.map(cell => cell === null || cell === undefined ? "" : String(cell));
          const searchText = cleanRow.join(" ").toLowerCase();

          if (searchText.trim()) { // Only index non-empty rows
            allRows.push({
              fileId: fileRecord.id,
              sheetName: sheetName,
              rowNumber: index + 1, // 1-based index for user friendliness
              data: rowData,
              searchText: searchText
            });
          }
        });
      }

      await storage.createRows(allRows);

      res.json({ message: "File uploaded and indexed successfully", fileId: fileRecord.id });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  app.get(api.files.search.path, async (req, res) => {
    try {
      const termsStr = req.query.terms as string;
      if (!termsStr) {
         return res.json([]);
      }
      
      let terms: string[] = [];
      try {
        terms = JSON.parse(termsStr);
      } catch (e) {
        // fallback if not json
        terms = [termsStr];
      }

      // Filter out empty terms
      terms = terms.filter(t => t.trim().length > 0).map(t => t.toLowerCase());

      const results = await storage.searchRows(terms);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get(api.files.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const rows = await storage.getRows(id);
      
      // Reconstruct sheets structure
      const sheets: Record<string, any[][]> = {};
      
      // Group by sheetName
      rows.forEach(row => {
        if (!sheets[row.sheetName]) {
          sheets[row.sheetName] = [];
        }
        // Ensure array is large enough (sparse handling if needed, but we used push so they might be out of order? 
        // We ordered by rowNumber in storage.getRows, so push is fine if we account for empty rows)
        
        // Actually, just push for now, assuming sequential. 
        // If we skipped empty rows during index, the visual grid might look collapsed.
        // For a true Excel view, we might want to respect rowNumber.
        // But for MVP simplicity, we'll just push.
        sheets[row.sheetName].push(row.data as any[]);
      });

      res.json({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        sheets: sheets
      });
    } catch (error) {
      console.error("Get file error:", error);
      res.status(500).json({ message: "Failed to retrieve file" });
    }
  });

  app.get(api.files.download.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.download(file.path, file.originalName);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Download failed" });
    }
  });

  return httpServer;
}
