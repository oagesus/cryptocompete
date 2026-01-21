"use client";

import { ArrowUpNarrowWide, ArrowDownNarrowWide } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SortMode = "mcap-high" | "mcap-low" | "perf-high" | "perf-low";

interface Props {
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
}

export function SortButtons({ sortMode, onSortChange }: Props) {
  const handlePopularityClick = () => {
    onSortChange(sortMode === "mcap-high" ? "mcap-low" : "mcap-high");
  };

  const handlePerformanceClick = () => {
    onSortChange(sortMode === "perf-high" ? "perf-low" : "perf-high");
  };

  const isPopularityActive = sortMode === "mcap-high" || sortMode === "mcap-low";
  const isPerformanceActive = sortMode === "perf-high" || sortMode === "perf-low";

  return (
    <div className="flex justify-between">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={handlePopularityClick}
      >
        Market Cap
        {isPopularityActive && (
          sortMode === "mcap-high" ? (
            <ArrowDownNarrowWide className="h-3 w-3 ml-1" />
          ) : (
            <ArrowUpNarrowWide className="h-3 w-3 ml-1" />
          )
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={handlePerformanceClick}
      >
        Performance
        {isPerformanceActive && (
          sortMode === "perf-high" ? (
            <ArrowDownNarrowWide className="h-3 w-3 ml-1" />
          ) : (
            <ArrowUpNarrowWide className="h-3 w-3 ml-1" />
          )
        )}
      </Button>
    </div>
  );
}