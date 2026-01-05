import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Plus, X, Search, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { Header } from "@/components/Header";
import { useSearchFiles, useFiles } from "@/hooks/use-files";
import { Highlighter } from "@/components/Highlighter";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
      <Header />
      
      <main className="container max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Search Inside Your Excel Files
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your spreadsheets and instantly find rows matching multiple criteria.
            Simple, fast, and powerful.
          </p>
        </div>

        {/* Search Interface Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-6 md:p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTerm();
                  }}
                  placeholder="Enter a keyword..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-gray-900 rounded-xl outline-none transition-all duration-200"
                />
              </div>
              <Button 
                onClick={addTerm}
                variant="secondary" 
                className="rounded-xl px-5"
              >
                <Plus className="h-5 w-5 mr-1" /> Add
              </Button>
            </div>
            <Button 
              onClick={handleSearch}
              size="lg"
              className="md:w-auto w-full rounded-xl text-base font-semibold"
            >
              Search All Terms
            </Button>
          </div>

          {/* Active Tags Area */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            <AnimatePresence>
              {activeTerms.length === 0 && (
                <span className="text-muted-foreground italic text-sm py-2">No search terms added yet...</span>
              )}
              {activeTerms.map(term => (
                <motion.div
                  key={term}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`
                    flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border transition-all select-none
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
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="font-medium text-sm">{term}</span>
                  <button 
                    onClick={() => removeTerm(term)}
                    className="ml-1 p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <FileUploader />

        {/* Dashboard: List of Uploaded Files */}
        <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Uploaded Files</h2>
          {isLoadingFiles ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : uploadedFiles && uploadedFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map(file => (
                <div key={file.id} className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary/70" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground">Uploaded {new Date(file.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No files uploaded yet.</p>
          )}
        </div>

        {/* Results Section */}
        {isSearching && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          </div>
        )}

        {queryTerms.length > 0 && results && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Search Results <span className="text-muted-foreground font-normal ml-2">({results.length} matches)</span>
              </h2>
            </div>

            {results.length === 0 ? (
               <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed">
                 <p className="text-muted-foreground">No matches found for these terms.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {results.map((result) => (
                  <div 
                    key={`${result.fileId}-${result.sheetName}-${result.rowNumber}`}
                    className="group bg-white dark:bg-gray-900 rounded-xl p-5 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium text-foreground">{result.filename}</span>
                          <span>•</span>
                          <span>{result.sheetName}</span>
                          <span>•</span>
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-mono">Row {result.rowNumber}</span>
                        </div>
                        
                        <div className="pt-2">
                           <div className="flex flex-wrap gap-2 text-sm text-gray-700 dark:text-gray-300">
                             {/* Preview first few non-empty cells */}
                             {result.data.slice(0, 5).map((cell: any, i: number) => {
                                if (!cell) return null;
                                return (
                                  <div key={i} className="bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded border border-gray-100 dark:border-gray-800 max-w-xs truncate">
                                    <Highlighter 
                                      text={String(cell)} 
                                      terms={queryTerms} 
                                      className="font-medium"
                                    />
                                  </div>
                                )
                             })}
                           </div>
                        </div>
                      </div>

                      <Link href={`/view/${result.fileId}?sheet=${encodeURIComponent(result.sheetName)}&row=${result.rowNumber}&terms=${encodeURIComponent(JSON.stringify(queryTerms))}`}>
                        <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                          View in File
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
