"use client";

import { FileTextIcon, HouseIcon, LibraryIcon, ListIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { projectById } from "@/lib/demo/library";
import { playClick } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AutonomySheet } from "./autonomy-sheet";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Home", icon: HouseIcon, exact: true },
  { href: "/briefing", label: "Briefing", icon: FileTextIcon, exact: false },
  { href: "/tasks", label: "Tasks", icon: ListIcon, exact: false },
  { href: "/library", label: "Library", icon: LibraryIcon, exact: false },
];

export function IconRail() {
  const pathname = usePathname();
  const openTaskForm = useCockpit((s) => s.openTaskForm);
  const favoriteProjects = useCockpit((s) => s.favoriteProjects);
  const hydrateFavorites = useCockpit((s) => s.hydrateFavorites);
  useEffect(() => {
    hydrateFavorites();
  }, [hydrateFavorites]);
  const favorites = favoriteProjects.flatMap((id) => {
    const project = projectById(id);
    return project ? [project] : [];
  });
  return (
    <nav
      aria-label="Primary"
      data-tour="rail"
      className="sticky top-0 flex h-dvh w-14 shrink-0 flex-col items-center gap-1 border-l bg-background py-3"
    >
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
        const Icon = l.icon;
        return (
          <Tooltip key={l.href}>
            <TooltipTrigger
              delay={0}
              render={
                <Link
                  href={l.href}
                  aria-label={l.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => playClick()}
                  className={cn(
                    "grid size-9 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "bg-accent text-foreground",
                  )}
                />
              }
            >
              <Icon className="size-4" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={12}>
              {l.label}
            </TooltipContent>
        </Tooltip>
      );
      })}
      {favorites.length > 0 ? (
        <div role="group" aria-label="Favorite projects" data-tour="favorites" className="flex w-full flex-1 flex-col items-center justify-center gap-1">
          {favorites.map((project) => {
            const href = `/library/projects/${project.id}`;
            const active = pathname === href;
            return (
              <Tooltip key={project.id}>
                <TooltipTrigger
                  delay={0}
                  render={
                    <Link
                      href={href}
                      aria-label={project.name}
                      aria-current={active ? "page" : undefined}
                      onClick={() => playClick()}
                      className={cn(
                        "grid size-9 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                        active && "bg-accent text-foreground",
                      )}
                    />
                  }
                >
                  <span aria-hidden className="text-base leading-none">
                    {project.emoji}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={12}>
                  {project.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ) : null}
      <div className={cn("flex flex-col items-center gap-1", favorites.length === 0 && "mt-auto")}>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="New task"
                onClick={() => {
                  playClick();
                  openTaskForm();
                }}
              />
            }
          >
            <PlusIcon className="size-4" aria-hidden />
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={12}>
            New task
          </TooltipContent>
        </Tooltip>
        <AutonomySheet />
        <ThemeToggle />
      </div>
    </nav>
  );
}
