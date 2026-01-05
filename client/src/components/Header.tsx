import { Link } from "wouter";
import { FileSpreadsheet } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center px-4 sm:px-8">
        <Link href="/" className="mr-8 flex items-center space-x-2 transition-opacity hover:opacity-80">
          <div className="bg-primary rounded-lg p-1.5">
            <FileSpreadsheet className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">ExcelSearch</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
        </div>
      </div>
    </header>
  );
}
