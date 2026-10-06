"use client";

import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page-column min-h-[50vh] flex-1 items-center justify-center gap-4 py-20 text-center">
      <AlertTriangleIcon className="size-8 text-destructive" aria-hidden />
      <div>
        <h1 className="text-lg font-semibold">This workspace didn&rsquo;t load</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong while preparing the task. Your drafts are safe. Try again, or go back to Today.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back to Today
        </Button>
      </div>
    </div>
  );
}
