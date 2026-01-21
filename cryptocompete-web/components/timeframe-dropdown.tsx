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

export type Timeframe = "1d" | "7d" | "30d" | "60d" | "90d";

interface TimeframeOption {
  value: Timeframe;
  label: string;
}

const timeframeOptions: TimeframeOption[] = [
  { value: "1d", label: "1 Day" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "60d", label: "60 Days" },
  { value: "90d", label: "90 Days" },
];

interface Props {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

export function TimeframeDropdown({ timeframe, onTimeframeChange }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          {timeframe.toUpperCase()}
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