import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" className="page-column h-dvh py-6">
      <Skeleton className="h-5 w-56" />
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-16 w-4/5" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="mt-auto h-24 w-full rounded-xl" />
      <span className="sr-only">Opening task</span>
    </div>
  );
}
