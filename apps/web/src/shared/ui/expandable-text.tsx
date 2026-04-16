"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function ExpandableText({ text, maxLength = 150, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldShowButton = text.length > maxLength;
  const displayedText = isExpanded ? text : text.slice(0, maxLength);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-slate-300 leading-snug opacity-90 transition-all duration-300">
        {displayedText}
        {!isExpanded && shouldShowButton && "..."}
      </p>
      
      {shouldShowButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors active:scale-95"
        >
          {isExpanded ? (
            <>
              Свернуть <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Читать далее <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
