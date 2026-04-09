"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Props {
  totalPages: number;
  currentPage: number;
  baseUrl?: string;
}

export function Pagination({ totalPages, currentPage, baseUrl = "" }: Props) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  // Generate URL for a specific page
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Logic for visible pages (max 10)
  const maxVisible = 10;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex justify-center items-center gap-2 mt-12 mb-8 w-full">
      {/* First Page */}
      {totalPages > maxVisible && (
        <Link
          href={createPageUrl(1)}
          className={`p-2 rounded-xl transition-all ${
            currentPage === 1 
              ? "text-slate-800 pointer-events-none" 
              : "text-slate-500 hover:text-white hover:bg-white/5"
          }`}
          title="В начало"
        >
          <ChevronsLeft className="w-5 h-5" />
        </Link>
      )}

      {/* Back Button */}
      <Link
        href={createPageUrl(Math.max(1, currentPage - 1))}
        className={`p-2 rounded-xl transition-all ${
          currentPage === 1 
            ? "text-slate-800 pointer-events-none" 
            : "text-slate-500 hover:text-white hover:bg-white/5"
        }`}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5 mx-2">
        {pages.map((p) => (
          <Link
            key={p}
            href={createPageUrl(p)}
            scroll={true}
            className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
              p === currentPage
                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
            }`}
          >
            {p}
          </Link>
        ))}
      </div>

      {/* Forward Button */}
      <Link
        href={createPageUrl(Math.min(totalPages, currentPage + 1))}
        className={`p-2 rounded-xl transition-all ${
          currentPage === totalPages 
            ? "text-slate-800 pointer-events-none" 
            : "text-slate-500 hover:text-white hover:bg-white/5"
        }`}
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-5 h-5" />
      </Link>

      {/* Last Page */}
      {totalPages > maxVisible && (
        <Link
          href={createPageUrl(totalPages)}
          className={`p-2 rounded-xl transition-all ${
            currentPage === totalPages 
              ? "text-slate-800 pointer-events-none" 
              : "text-slate-500 hover:text-white hover:bg-white/5"
          }`}
          title="В конец"
        >
          <ChevronsRight className="w-5 h-5" />
        </Link>
      )}
    </div>
  );
}
