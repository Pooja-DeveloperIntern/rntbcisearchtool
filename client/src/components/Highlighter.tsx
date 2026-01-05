import { useMemo } from 'react';

interface HighlighterProps {
  text: string;
  terms: string[];
  className?: string;
}

export function Highlighter({ text, terms, className = "" }: HighlighterProps) {
  const parts = useMemo(() => {
    if (!text || terms.length === 0) return [{ text, match: false }];
    
    // Create a regex that matches any of the terms, case insensitive
    // Escape special regex characters in terms
    const escapedTerms = terms
      .filter(t => t.trim().length > 0)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      
    if (escapedTerms.length === 0) return [{ text, match: false }];
    
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const matches = text.split(regex);
    
    return matches.map((part, i) => {
      // Check if this part matches any of our terms (case insensitive check)
      const isMatch = escapedTerms.some(term => 
        part.toLowerCase() === term.toLowerCase()
      );
      return { text: part, match: isMatch };
    });
  }, [text, terms]);

  return (
    <span className={className}>
      {parts.map((part, i) => 
        part.match ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 rounded px-0.5 font-semibold">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
