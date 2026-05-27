import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  scrollTargetId?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  scrollTargetId,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Hiển thị tối đa 5 trang, có dấu ... nếu quá nhiều
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
    if (scrollTargetId) {
      const element = document.getElementById(scrollTargetId);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100; // Trừ hao 100px cho thanh Navbar
        window.scrollTo({ top: y, behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {getPageNumbers().map((page, index) =>
        page === "..." ? (
          <span key={`dots-${index}`} className="px-2 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageChange(page as number)}
            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentPage === page
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-teal-600 bg-white"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
