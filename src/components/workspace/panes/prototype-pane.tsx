"use client";

import { CopyIcon, ExternalLinkIcon, GitBranchIcon, MonitorIcon, RefreshCwIcon, SmartphoneIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PrototypeConfig } from "@/lib/demo/content";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

export const PREVIEW_PATH = "/preview/3-strands";
export const PREVIEW_MESSAGE = "cockpit:prototype-config";

export function previewQuery(config: PrototypeConfig, version?: number) {
  const p = new URLSearchParams({
    density: config.density,
    theme: config.theme,
    chart: config.chart,
    accent: config.accent,
    strand: config.strand,
    trends: String(config.trends),
  });
  if (version) p.set("v", String(version));
  return p.toString();
}

export function PrototypePane() {
  const { config, current, versions } = useCockpit((s) => s.prototype);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [initialUrl] = useState(() => `${PREVIEW_PATH}?${previewQuery(config, current)}`);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_MESSAGE, config, version: current },
      window.location.origin,
    );
  }, [config, current, loaded]);

  const logs = useMemo(
    () =>
      versions.map((v, i) => ({
        level: "log" as const,
        message: `feature/prototype  commit v${v.version}: ${v.label} · deployed`,
        timestamp: new Date(2026, 9, 5, 9, 40 + i * 6),
      })),
    [versions],
  );

  const liveHref = `${PREVIEW_PATH}?${previewQuery(config, current)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
      <WebPreview defaultUrl={initialUrl} className="min-h-0 flex-1 overflow-hidden">
        <WebPreviewNavigation>
          <WebPreviewNavigationButton
            tooltip="Reload preview"
            onClick={() => {
              setLoaded(false);
              setReloadKey((k) => k + 1);
            }}
          >
            <RefreshCwIcon className="size-4" aria-label="Reload preview" />
          </WebPreviewNavigationButton>
          <WebPreviewUrl aria-label="Preview address" readOnly value={`${PREVIEW_PATH}  ·  v${current}`} />
          <ToggleGroup
            value={[device]}
            onValueChange={(v) => v[0] && setDevice(v[0] as "desktop" | "mobile")}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Preview size"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="desktop" aria-label="Desktop width">
              <MonitorIcon aria-hidden />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile width">
              <SmartphoneIcon aria-hidden />
            </ToggleGroupItem>
          </ToggleGroup>
          <WebPreviewNavigationButton
            tooltip="Copy shareable link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${window.location.origin}${liveHref}`);
                toast.success("Shareable link copied");
              } catch {
                toast.error("Couldn’t copy the link");
              }
            }}
          >
            <CopyIcon className="size-4" aria-label="Copy shareable link" />
          </WebPreviewNavigationButton>
          <Button size="sm" variant="default" nativeButton={false} render={<a href={liveHref} target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon aria-hidden /> Open live
          </Button>
        </WebPreviewNavigation>

        <div className="relative flex min-h-0 flex-1 justify-center bg-muted/40">
          <div
            className={cn(
              "relative flex min-h-0 w-full flex-1 transition-[max-width] duration-300 ease-in-out-strong motion-reduce:transition-none",
              device === "mobile" && "max-w-[390px] border-x bg-background shadow-sm",
            )}
          >
            {!loaded && (
              <div className="absolute inset-0 z-10 flex flex-col gap-3 bg-background p-4" role="status">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-40 w-full" />
                <span className="sr-only">Loading prototype…</span>
              </div>
            )}
            <WebPreviewBody
              key={reloadKey}
              ref={frameRef}
              title="3 Strands dashboard prototype"
              src={initialUrl}
              onLoad={() => setLoaded(true)}
              className="min-h-0 flex-1"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GitBranchIcon className="size-3.5" aria-hidden />
            <span translate="no">acme/3-strands-dashboard</span> · <code>feature/prototype</code>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden /> Deployed v{current} (simulated)
          </span>
          <span className="ml-auto">Frontend only · no backend, no secrets</span>
        </div>
        <WebPreviewConsole logs={logs} />
      </WebPreview>
    </div>
  );
}
