"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          />
        }
      >
        <SunIcon className="hidden size-4 dark:block" aria-hidden />
        <MoonIcon className="size-4 dark:hidden" aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={12}>
        Theme
      </TooltipContent>
    </Tooltip>
  );
}
