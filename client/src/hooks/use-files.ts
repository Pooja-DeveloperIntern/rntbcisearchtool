import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Helper type for the search results since we need to parse them
type SearchResult = z.infer<typeof api.files.search.responses[200]>[number];
type FileDetails = z.infer<typeof api.files.get.responses[200]>;

export function useSearchFiles(terms: string[]) {
  // Only search if we have actual terms
  const enabled = terms.length > 0 && terms.some(t => t.trim().length > 0);
  // Serialize terms to JSON string for the query param
  const termsParam = JSON.stringify(terms.filter(t => t.trim().length > 0));

  return useQuery({
    queryKey: [api.files.search.path, termsParam],
    queryFn: async () => {
      // Manual URL construction because buildUrl handles path params, not query params
      const url = `${api.files.search.path}?terms=${encodeURIComponent(termsParam)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to search files");
      const data = await res.json();
      return api.files.search.responses[200].parse(data);
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 5, // Cache results for 5 mins
  });
}

export function useFile(id: number) {
  return useQuery({
    queryKey: [api.files.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.files.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch file");
      const data = await res.json();
      return api.files.get.responses[200].parse(data);
    },
  });
}

export function useFiles() {
  return useQuery({
    queryKey: [api.files.list.path],
    queryFn: async () => {
      const res = await fetch(api.files.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      return api.files.list.responses[200].parse(data);
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.files.upload.path, {
        method: "POST",
        body: formData,
        credentials: "include", // Essential for sessions
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to upload file");
      }
      
      const data = await res.json();
      return api.files.upload.responses[200].parse(data);
    },
    // Invalidate search results as new data might match existing searches
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.files.search.path] });
      queryClient.invalidateQueries({ queryKey: [api.files.list.path] });
    },
  });
}
