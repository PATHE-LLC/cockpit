import { TaskDialog } from "@/components/tasks/task-dialog";
import { IconRail } from "./icon-rail";
import { TeamTour } from "./team-tour";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <main id="main" className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <IconRail />
      <TaskDialog />
      <TeamTour />
    </div>
  );
}
