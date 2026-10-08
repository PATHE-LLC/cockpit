"use client";

import { StarIcon } from "lucide-react";
import { projectById } from "@/lib/demo/library";
import { playClick } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProjectFavorite({ id }: { id: string }) {
  const on = useCockpit((state) => state.favoriteProjects.includes(id));
  const toggle = useCockpit((state) => state.toggleFavoriteProject);
  const name = projectById(id)?.name ?? "project";
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Unfavorite ${name}` : `Favorite ${name}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        playClick();
        toggle(id);
      }}
      className={cn(
        "relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        on && "text-foreground",
      )}
    >
      <StarIcon className={cn("size-3.5", on && "fill-current")} aria-hidden />
    </button>
  );
}
