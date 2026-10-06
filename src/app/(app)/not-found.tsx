import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-column min-h-[50vh] flex-1 items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-lg font-semibold">We couldn&rsquo;t find that task</h1>
      <p className="text-sm text-muted-foreground">It may have been completed or moved. Your checklist has everything that&rsquo;s current.</p>
      <Button nativeButton={false} render={<Link href="/" />}>Back to Today</Button>
    </div>
  );
}
