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
    
    const colors = [
      "bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100",
      "bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100",
      "bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100",
      "bg-purple-200 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100",
      "bg-pink-200 dark:bg-pink-900/50 text-pink-900 dark:text-pink-100",
      "bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100",
    ];

    return matches.map((part, i) => {
      // Find which term matched (if any)
      const matchIndex = terms.findIndex(term => 
        term.trim().toLowerCase() === part.toLowerCase()
      );
      const isMatch = matchIndex !== -1;
      const colorClass = isMatch ? colors[matchIndex % colors.length] : "";
      return { text: part, match: isMatch, colorClass };
    });
  }, [text, terms]);

  return (
    <span className={className}>
      {parts.map((part, i) => 
        part.match ? (
          <mark key={i} className={`${part.colorClass} rounded px-0.5 font-semibold transition-colors`}>
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
