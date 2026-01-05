import { useEffect, useRef, useState } from "react";
import { useRoute, useSearch, Link } from "wouter";
import { ArrowLeft, Download, Loader2, Search, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useFile } from "@/hooks/use-files";
import { Highlighter } from "@/components/Highlighter";
import { api, buildUrl } from "@shared/routes";

export default function ViewFile() {
  const [match, params] = useRoute("/view/:id");
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const fileId = parseInt(params?.id || "0");
  const targetSheet = searchParams.get("sheet");
  const targetRow = parseInt(searchParams.get("row") || "0");
  const termsStr = searchParams.get("terms");
  const terms = termsStr ? JSON.parse(decodeURIComponent(termsStr)) : [];

  const { data: file, isLoading, isError } = useFile(fileId);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (file && !activeSheet) {
      // Set initial sheet (either from URL or first available)
      if (targetSheet && file.sheets[targetSheet]) {
        setActiveSheet(targetSheet);
      } else {
        const firstSheet = Object.keys(file.sheets)[0];
        if (firstSheet) setActiveSheet(firstSheet);
      }
    }
  }, [file, targetSheet, activeSheet]);

  // Scroll to row when sheet or row changes
  useEffect(() => {
    if (rowRef.current) {
      setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a flash highlight class here if needed
      }, 500);
    }
  }, [activeSheet, targetRow]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">File not found</h1>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const sheetData = file.sheets[activeSheet] || [];
  const headers = sheetData.length > 0 ? sheetData[0] : [];
  const rows = sheetData.slice(1);

  const downloadUrl = buildUrl(api.files.download.path, { id: fileId });

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-900 border-b flex items-center justify-between px-4 py-3 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/?terms=${encodeURIComponent(JSON.stringify(terms))}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Results
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
             <h1 className="font-semibold text-foreground flex items-center gap-2">
               <TableIcon className="w-4 h-4 text-primary" />
               {file.originalName}
             </h1>
             <p className="text-xs text-muted-foreground">
               {Object.keys(file.sheets).length} sheets • {rows.length + 1} rows
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {terms.length > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
               <Search className="w-3.5 h-3.5" />
               <span>Highlighting: </span>
               <span className="font-semibold">{terms.join(", ")}</span>
            </div>
          )}
          <a href={downloadUrl} download>
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Download Excel
            </Button>
          </a>
        </div>
      </header>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-auto relative custom-scrollbar bg-white dark:bg-gray-900">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-border border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="w-12 px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-r bg-gray-100 dark:bg-gray-800">
                  #
                </th>
                {headers.map((header: any, i: number) => (
                  <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-b border-r min-w-[150px]">
                    <span className="line-clamp-1">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white dark:bg-gray-900">
              {rows.map((row: any[], rowIndex: number) => {
                const actualRowNumber = rowIndex + 2; // +1 for 0-index, +1 for header
                const isTargetRow = actualRowNumber === targetRow && activeSheet === targetSheet;
                
                return (
                  <tr 
                    key={rowIndex} 
                    ref={isTargetRow ? rowRef : null}
                    className={`
                      ${isTargetRow ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"}
                      transition-colors
                    `}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-muted-foreground border-r font-mono bg-gray-50/30">
                      {actualRowNumber}
                    </td>
                    {/* Ensure we map over headers to handle sparse rows correctly, or map row if headers are missing */}
                    {Array.from({ length: Math.max(headers.length, row.length) }).map((_, colIndex) => {
                        const cellValue = row[colIndex];
                        return (
                          <td key={colIndex} className="px-6 py-2 whitespace-nowrap text-sm text-foreground border-r max-w-xs truncate border-b border-gray-100 dark:border-gray-800">
                             {cellValue ? (
                               <Highlighter text={String(cellValue)} terms={terms} />
                             ) : (
                               <span className="text-gray-300 dark:text-gray-700">-</span>
                             )}
                          </td>
                        )
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheets Tabs */}
      <div className="bg-gray-100 dark:bg-gray-800 border-t px-2 py-1.5 flex gap-1 overflow-x-auto shrink-0 no-scrollbar">
        {Object.keys(file.sheets).map((sheetName) => (
          <button
            key={sheetName}
            onClick={() => setActiveSheet(sheetName)}
            className={`
              px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap
              ${activeSheet === sheetName
                ? "bg-white dark:bg-gray-900 text-primary border-primary shadow-sm translate-y-px"
                : "text-muted-foreground border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-foreground"
              }
            `}
          >
            {sheetName}
          </button>
        ))}
      </div>
    </div>
  );
}
