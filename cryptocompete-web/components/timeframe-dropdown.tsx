"use client";

import { useTranslations } from "next-intl";
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

interface Props {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

export function TimeframeDropdown({ timeframe, onTimeframeChange }: Props) {
  const t = useTranslations("trade.timeframe");

  const timeframeOptions: { value: Timeframe; shortLabel: string }[] = [
    { value: "1d", shortLabel: "1D" },
    { value: "7d", shortLabel: "7D" },
    { value: "1m", shortLabel: "1M" },
    { value: "3m", shortLabel: "3M" },
  ];

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
              <span className="flex-1">{t(option.value)}</span>
              {isSelected && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}