"use client";

import { useSyncExternalStore } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const subscribe = () => () => {};

export function ClientOnly({ children, height = "h-40" }: { children: React.ReactNode; height?: string }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? <>{children}</> : <Skeleton className={`${height} w-full rounded-lg`} />;
}
