"use client";

import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type Timeframe = "1d" | "7d" | "1m" | "3m";

interface TimeframeOption {
  value: Timeframe;
  label: string;
  shortLabel: string;
}

const timeframeOptions: TimeframeOption[] = [
  { value: "1d", label: "1 Day", shortLabel: "1D" },
  { value: "7d", label: "7 Days", shortLabel: "7D" },
  { value: "1m", label: "1 Month", shortLabel: "1M" },
  { value: "3m", label: "3 Months", shortLabel: "3M" },
];

interface Props {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

export function TimeframeDropdown({ timeframe, onTimeframeChange }: Props) {
  const currentOption = timeframeOptions.find((o) => o.value === timeframe);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          {currentOption?.shortLabel ?? timeframe.toUpperCase()}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {timeframeOptions.map((option) => {
          const isSelected = option.value === timeframe;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onTimeframeChange(option.value)}
              className={cn(
                "cursor-pointer",
                isSelected && "bg-muted font-medium"
              )}
            >
              <span className="flex-1">{option.label}</span>
              {isSelected && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}