import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4 select-none">
      {/* Previous Page Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-slate-800 bg-slate-900 rounded-xl text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages list */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-xl font-semibold text-sm transition-all duration-300 ${
              currentPage === page
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 bg-slate-900 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Page Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-slate-800 bg-slate-900 rounded-xl text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Pagination;
