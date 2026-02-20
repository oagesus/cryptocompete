"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageRange(currentPage: number, totalPages: number): number[] {
  const windowSize = Math.min(5, totalPages);

  let start = currentPage - Math.floor(windowSize / 2);
  start = Math.max(1, start);
  start = Math.min(start, totalPages - windowSize + 1);

  return Array.from({ length: windowSize }, (_, i) => start + i);
}

export function SidebarPagination({ currentPage, totalPages, onPageChange }: Props) {
  const t = useTranslations("trade");

  const pageRange = useMemo(
    () => getPageRange(currentPage, totalPages),
    [currentPage, totalPages]
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-1 pt-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageRange.map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 text-xs"
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </Button>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 pl-0 text-xs text-muted-foreground"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
          {t("first")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 pr-0 text-xs text-muted-foreground"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          {t("last")}
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}