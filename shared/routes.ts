import { z } from "zod";
import { insertFileSchema } from "./schema";

export const api = {
  files: {
    upload: {
      method: "POST" as const,
      path: "/api/upload",
      responses: {
        200: z.object({ message: z.string(), fileId: z.number() }),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    },
    search: {
      method: "GET" as const,
      path: "/api/search",
      // Query params: ?terms=["term1","term2"]
      input: z.object({
        terms: z.string().optional()
      }).optional(),
      responses: {
        200: z.array(z.object({
           id: z.number(),
           fileId: z.number(),
           filename: z.string(),
           sheetName: z.string(),
           rowNumber: z.number(),
           data: z.array(z.any()),
           searchText: z.string()
        })),
        500: z.object({ message: z.string() })
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/files/:id",
      responses: {
        200: z.object({
           id: z.number(),
           filename: z.string(),
           originalName: z.string(),
           sheets: z.record(z.string(), z.array(z.array(z.any())))
        }),
        404: z.object({ message: z.string() })
      }
    },
    download: {
      method: "GET" as const,
      path: "/api/files/:id/download",
      responses: {
        // 200 is binary file
        404: z.object({ message: z.string() })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
