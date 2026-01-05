import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useUploadFile } from "@/hooks/use-files";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function FileUploader() {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xls|xlsx)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xls or .xlsx)",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadMutation.mutateAsync(file);
      toast({
        title: "Success",
        description: `Successfully indexed ${file.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mb-12">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed
          transition-all duration-300 ease-out
          ${isDragOver 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border hover:border-primary/50 hover:bg-muted/30"
          }
        `}
      >
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <AnimatePresence mode="wait">
            {uploadMutation.isPending ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
                key="loading"
              >
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Indexing content...</h3>
                <p className="text-sm text-muted-foreground mt-1">This might take a moment for large files</p>
              </motion.div>
            ) : uploadMutation.isSuccess ? (
               <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
                key="success"
               >
                 <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                   <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-foreground">Upload Complete</h3>
                 <p className="text-sm text-muted-foreground mt-1">Click to upload another file</p>
               </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
                key="idle"
              >
                <div className={`
                  p-4 rounded-full mb-4 transition-colors duration-300
                  ${isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}
                `}>
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Drop your Excel file here
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  Or click to browse. We'll index every cell for instant search.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".xls,.xlsx" 
          className="hidden" 
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
