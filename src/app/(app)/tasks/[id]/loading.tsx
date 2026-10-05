import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-3">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[38fr_62fr]">
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-24 w-4/5" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="hidden flex-col gap-3 border-l p-6 lg:flex">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <span className="sr-only">Opening workspace…</span>
    </div>
  );
}
