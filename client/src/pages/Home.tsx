import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Plus, X, Search, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { Header } from "@/components/Header";
import { useSearchFiles, useFiles, useDeleteFile } from "@/hooks/use-files";
import { Highlighter } from "@/components/Highlighter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  // State initialization from URL params to persist state
  const initialTerms = searchParams.get("terms") 
    ? JSON.parse(decodeURIComponent(searchParams.get("terms")!)) 
    : [];
    
  // Current input value
  const [inputValue, setInputValue] = useState("");
  
  // List of active search terms
  const [activeTerms, setActiveTerms] = useState<string[]>(initialTerms);
  
  // Terms that are currently checked/enabled
  const [checkedTerms, setCheckedTerms] = useState<Set<string>>(new Set(initialTerms));

  // The actual query sent to the API (only updates on "Search" click)
  const [queryTerms, setQueryTerms] = useState<string[]>(initialTerms);

  const { data: results, isLoading: isSearching, isError } = useSearchFiles(queryTerms);
  const { data: uploadedFiles, isLoading: isLoadingFiles } = useFiles();
  const deleteFileMutation = useDeleteFile();

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this file and all its indexed data?")) {
      try {
        await deleteFileMutation.mutateAsync(id);
        toast({
          title: "File deleted",
          description: "The file and its search index have been removed.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the file.",
          variant: "destructive",
        });
      }
    }
  };

  // Sync URL with queryTerms
  useEffect(() => {
    if (queryTerms.length > 0) {
      const params = new URLSearchParams();
      params.set("terms", JSON.stringify(queryTerms));
      // Using history.replaceState to update URL without reloading page
      // wouter's setLocation triggers navigation, we just want to update URL
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else {
      window.history.replaceState(null, "", "/");
    }
  }, [queryTerms]);

  const addTerm = () => {
    if (inputValue.trim() && !activeTerms.includes(inputValue.trim())) {
      const newTerm = inputValue.trim();
      setActiveTerms([...activeTerms, newTerm]);
      setCheckedTerms(prev => new Set(prev).add(newTerm));
      setInputValue("");
    }
  };

  const removeTerm = (term: string) => {
    setActiveTerms(prev => prev.filter(t => t !== term));
    setCheckedTerms(prev => {
      const next = new Set(prev);
      next.delete(term);
      return next;
    });
  };

  const toggleTerm = (term: string) => {
    setCheckedTerms(prev => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  const handleSearch = () => {
    // Also add the current input if it's not empty
    let termsToSearch = activeTerms.filter(t => checkedTerms.has(t));
    
    if (inputValue.trim()) {
      const newTerm = inputValue.trim();
      if (!activeTerms.includes(newTerm)) {
         setActiveTerms(prev => [...prev, newTerm]);
         setCheckedTerms(prev => new Set(prev).add(newTerm));
         termsToSearch.push(newTerm);
         setInputValue("");
      }
    }
    
    setQueryTerms(termsToSearch);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50 dark:bg-gray-950/50 overflow-hidden">
      <Header />
      
      <main className="flex-1 flex flex-col min-h-0 container max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="shrink-0">
          {/* Hero Section - Only show when no search active */}
          {queryTerms.length === 0 && (
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                Search Inside Your Excel Files
              </h1>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Upload your spreadsheets and instantly find rows matching multiple criteria.
              </p>
            </div>
          )}

          {/* Search Interface Card */}
          <div className={`
            bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800 transition-all duration-500 overflow-hidden relative
            ${queryTerms.length > 0 ? "p-3 md:p-4 mb-4 opacity-100 scale-100" : "p-6 md:p-8 mb-8"}
          `}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className={`relative z-10 flex flex-col md:flex-row gap-3 ${queryTerms.length > 0 ? "mb-2" : "mb-6"}`}>
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTerm();
                    }}
                    placeholder="Enter a keyword..."
                    className={`
                      w-full pl-9 pr-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-gray-900 rounded-xl outline-none transition-all duration-200
                      ${queryTerms.length > 0 ? "py-1.5 text-sm" : "py-3"}
                    `}
                  />
                </div>
                <Button 
                  onClick={addTerm}
                  variant="secondary" 
                  className={`rounded-xl px-4 ${queryTerms.length > 0 ? "h-9 text-sm" : "h-12"}`}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <Button 
                onClick={handleSearch}
                size={queryTerms.length > 0 ? "sm" : "lg"}
                className="md:w-auto w-full rounded-xl text-sm font-semibold"
              >
                Search All Terms
              </Button>
            </div>

            {/* Active Tags Area */}
            <div className="flex flex-wrap gap-1.5 min-h-[20px]">
              <AnimatePresence>
                {activeTerms.length === 0 && queryTerms.length === 0 && (
                  <span className="text-muted-foreground italic text-xs py-1">No search terms added yet...</span>
                )}
                {activeTerms.map(term => (
                  <motion.div
                    key={term}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`
                      flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg border transition-all select-none
                      ${checkedTerms.has(term) 
                        ? "bg-primary/10 border-primary/20 text-primary" 
                        : "bg-gray-100 dark:bg-gray-800 border-transparent text-muted-foreground"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checkedTerms.has(term)}
                      onChange={() => toggleTerm(term)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-3 w-3"
                    />
                    <span className="font-medium text-xs">{term}</span>
                    <button 
                      onClick={() => removeTerm(term)}
                      className="ml-0.5 p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {queryTerms.length === 0 && <FileUploader />}

          {/* Dashboard: List of Uploaded Files - Minimized when results shown */}
          {queryTerms.length === 0 && (
            <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Uploaded Files</h2>
              {isLoadingFiles ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
              ) : uploadedFiles && uploadedFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-3 group relative overflow-hidden transition-all hover:border-primary/20 hover:bg-white dark:hover:bg-gray-900">
                      <div className="flex items-start gap-3">
                        <FileText className="h-8 w-8 text-primary/70 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm" title={file.originalName}>{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">Uploaded {new Date(file.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                        <Link href={`/view/${file.id}`} className="flex-1">
                          <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Open
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleDelete(e, file.id)}
                          disabled={deleteFileMutation.isPending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No files uploaded yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Results Section - Scrollable and takes remaining space */}
        <div className="flex-1 min-h-0 mt-4 overflow-hidden flex flex-col">
          {isSearching && (
            <div className="flex justify-center py-12 shrink-0">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          )}

          {queryTerms.length > 0 && results && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col min-h-0 space-y-4"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-bold text-foreground">Search Results</h2>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {queryTerms.map((term, idx) => {
                      const count = results.filter(r => 
                        r.searchText.toLowerCase().includes(term.toLowerCase())
                      ).length;
                      const colors = [
                        "text-yellow-600 dark:text-yellow-400",
                        "text-green-600 dark:text-green-400",
                        "text-blue-600 dark:text-blue-400",
                        "text-purple-600 dark:text-purple-400",
                        "text-pink-600 dark:text-pink-400",
                        "text-orange-600 dark:text-orange-400",
                      ];
                      return (
                        <span key={term} className={`text-sm font-medium ${colors[idx % colors.length]}`}>
                          {term}: {count}
                        </span>
                      );
                    })}
                    <span className="text-muted-foreground text-sm font-normal">
                      (Total {results.length})
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setQueryTerms([])} className="text-xs h-8">Clear Results</Button>
              </div>

              {results.length === 0 ? (
                 <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed shrink-0">
                   <p className="text-muted-foreground">No matches found for these terms.</p>
                 </div>
              ) : (
                <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-xl border shadow-sm flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-foreground border-b">File Name</th>
                          <th className="px-4 py-3 font-semibold text-foreground border-b">Sheet</th>
                          <th className="px-4 py-3 font-semibold text-foreground border-b">Row</th>
                          <th className="px-4 py-3 font-semibold text-foreground border-b">Content Detail</th>
                          <th className="px-4 py-3 font-semibold text-foreground text-right border-b sticky right-0 bg-gray-50 dark:bg-gray-800">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.map((result) => (
                          <tr key={`${result.fileId}-${result.sheetName}-${result.rowNumber}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground align-top">{result.filename}</td>
                            <td className="px-4 py-3 text-muted-foreground align-top whitespace-nowrap">{result.sheetName}</td>
                            <td className="px-4 py-3 align-top">
                              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-mono">Row {result.rowNumber}</span>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-wrap gap-2">
                                {result.data.map((cell: any, i: number) => {
                                  const cellStr = cell !== null && cell !== undefined ? String(cell).trim() : "";
                                  if (!cellStr) return null;
                                  
                                  const hasMatch = queryTerms.some(term => 
                                    cellStr.toLowerCase().includes(term.toLowerCase())
                                  );

                                  return (
                                    <div 
                                      key={i} 
                                      className={`
                                        px-2 py-1 rounded border text-xs leading-relaxed transition-all
                                        ${hasMatch 
                                          ? "bg-white dark:bg-gray-900 border-primary/30 shadow-sm ring-1 ring-primary/10" 
                                          : "bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 text-muted-foreground"
                                        }
                                      `}
                                    >
                                      <Highlighter text={cellStr} terms={queryTerms} />
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right align-top sticky right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                              <Link href={`/view/${result.fileId}?sheet=${encodeURIComponent(result.sheetName)}&row=${result.rowNumber}&terms=${encodeURIComponent(JSON.stringify(queryTerms))}`}>
                                <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm">
                                  View
                                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
