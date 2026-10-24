import { Button } from "@/components/ui/button";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

interface PaginatorProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Paginator({ page, totalPages, onPageChange, className = "" }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const WINDOW = 5;
  const windowStart = Math.floor((page - 1) / WINDOW) * WINDOW + 1;
  const windowEnd = Math.min(windowStart + WINDOW - 1, totalPages);
  const pageNums = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  const btnBase = "w-9 h-9 p-0 rounded-full font-medium text-sm";

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        className={btnBase}
        disabled={page === 1}
        onClick={() => onPageChange(1)}
        aria-label="最初のページ"
      >
        <ChevronsLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={btnBase}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="前のページ"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pageNums.map(p => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          className={btnBase}
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        className={btnBase}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="次のページ"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={btnBase}
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
        aria-label="最後のページ"
      >
        <ChevronsRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
