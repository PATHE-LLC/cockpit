import Link from "next/link";
import { AutonomySheet } from "./autonomy-sheet";
import { MainNav } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="press flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground"
            >
              C
            </span>
            <span translate="no">CockpitOS</span>
          </Link>
          <MainNav />
          <div className="ml-auto flex items-center gap-1">
            <AutonomySheet />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
