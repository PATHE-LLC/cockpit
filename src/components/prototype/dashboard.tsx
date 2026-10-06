"use client";

import { AlertTriangleIcon, ArrowDownRightIcon, ArrowUpRightIcon, CheckCircle2Icon, RefreshCwIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { PROTOTYPE_CONFIG_INITIAL, type PrototypeConfig } from "@/lib/demo/content";
import { cn } from "@/lib/utils";

type Strand = Exclude<PrototypeConfig["strand"], "all">;

const ACCENTS: Record<PrototypeConfig["accent"], string> = {
  teal: "oklch(0.52 0.095 185)",
  amber: "oklch(0.64 0.14 65)",
  blue: "oklch(0.52 0.15 255)",
};

const STRANDS: Record<
  Strand,
  { label: string; metric: string; value: string; delta: number; unit: string; status: "healthy" | "at-risk"; series: number[] }
> = {
  pipeline: {
    label: "Pipeline",
    metric: "Qualified leads",
    value: "128",
    delta: 12,
    unit: "% vs last 4 weeks",
    status: "healthy",
    series: [82, 88, 91, 87, 95, 99, 104, 101, 110, 116, 121, 128],
  },
  delivery: {
    label: "Delivery",
    metric: "Milestones on track",
    value: "14 / 18",
    delta: -2,
    unit: " vs plan",
    status: "at-risk",
    series: [15, 15, 16, 16, 15, 15, 16, 15, 14, 14, 14, 14],
  },
  health: {
    label: "Customer Health",
    metric: "Net Promoter Score",
    value: "42",
    delta: 3,
    unit: " pts vs last quarter",
    status: "healthy",
    series: [36, 37, 37, 38, 39, 38, 40, 40, 41, 41, 42, 42],
  },
};

const ATTENTION: Record<Strand, { title: string; detail: string }[]> = {
  pipeline: [{ title: "Enterprise segment conversion dipped", detail: "3 deals stalled in legal review for 10+ days" }],
  delivery: [
    { title: "Integration milestone slipped by 2 weeks", detail: "Waiting on partner API access" },
    { title: "Two milestones without an owner", detail: "Reassign before Friday's review" },
  ],
  health: [],
};

const STRAND_KEYS = Object.keys(STRANDS) as Strand[];

function parseConfig(params: URLSearchParams): PrototypeConfig {
  const d = PROTOTYPE_CONFIG_INITIAL;
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const v = params.get(key);
    return allowed.includes(v as T) ? (v as T) : fallback;
  };
  return {
    density: pick("density", ["comfortable", "compact"], d.density),
    theme: pick("theme", ["light", "dark"], d.theme),
    chart: pick("chart", ["bars", "line"], d.chart),
    accent: pick("accent", ["teal", "amber", "blue"], d.accent),
    strand: pick("strand", ["all", "pipeline", "delivery", "health"], d.strand),
    trends: params.get("trends") !== "false",
  };
}

function DashboardInner() {
  const params = useSearchParams();
  const [config, setConfig] = useState<PrototypeConfig>(() => parseConfig(params));
  const [version, setVersion] = useState(Number(params.get("v") ?? 0));
  const [attempt, setAttempt] = useState(0);
  const [resolved, setResolved] = useState(-1);
  const ready = resolved === attempt;
  const failed = ready && params.get("fail") === "1" && attempt === 0;

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "cockpit:prototype-config") return;
      setConfig(e.data.config as PrototypeConfig);
      if (e.data.version) setVersion(e.data.version);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setResolved(attempt), 450);
    return () => window.clearTimeout(id);
  }, [attempt]);

  const compact = config.density === "compact";
  const visible: Strand[] = config.strand === "all" ? STRAND_KEYS : [config.strand];
  const attention = visible.flatMap((k) => ATTENTION[k].map((a) => ({ ...a, strand: STRANDS[k].label })));

  const accent = ACCENTS[config.accent];
  const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
  const data = weeks.map((w, i) => ({
    week: w,
    pipeline: Math.round((STRANDS.pipeline.series[i] / STRANDS.pipeline.series[0]) * 100),
    delivery: Math.round((STRANDS.delivery.series[i] / STRANDS.delivery.series[0]) * 100),
    health: Math.round((STRANDS.health.series[i] / STRANDS.health.series[0]) * 100),
  }));
  const chartConfig = {
    pipeline: { label: "Pipeline", color: accent },
    delivery: { label: "Delivery", color: "oklch(0.68 0.12 70)" },
    health: { label: "Customer Health", color: "oklch(0.55 0.08 255)" },
  } satisfies ChartConfig;

  return (
    <div
      data-theme={config.theme}
      className={cn(
        "min-h-dvh bg-background text-foreground transition-colors duration-200 motion-reduce:transition-none",
        config.theme === "dark" && "dark",
      )}
      style={{ ["--accent-color" as string]: accent }}
    >
      <div className={cn("mx-auto max-w-5xl", compact ? "space-y-3 p-3 sm:p-4" : "space-y-6 p-4 sm:p-8")}>
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className={cn("font-semibold tracking-tight", compact ? "text-lg" : "text-2xl")}>3 Strands</h1>
            <p className="text-xs text-muted-foreground">Program health · last 12 weeks</p>
          </div>
          <div className="flex items-center gap-2">
            <nav aria-label="Strand filter" className="flex rounded-lg border p-0.5 text-xs">
              {(["all", ...STRAND_KEYS] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={config.strand === k}
                  onClick={() => setConfig((c) => ({ ...c, strand: k }))}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]",
                    config.strand === k ? "bg-[var(--accent-color)] text-white" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k === "all" ? "All" : STRANDS[k].label}
                </button>
              ))}
            </nav>
            {version > 0 && (
              <span className="tabular rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">v{version}</span>
            )}
          </div>
        </header>

        {!ready ? (
          <div role="status" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-56 rounded-xl" />
            <span className="sr-only">Loading dashboard…</span>
          </div>
        ) : failed ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangleIcon className="size-4 text-destructive" aria-hidden /> Couldn&rsquo;t load strand data
            </p>
            <p className="text-sm text-muted-foreground">The data source timed out. Your filters are kept.</p>
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <RefreshCwIcon className="size-3.5" aria-hidden /> Retry
            </button>
          </div>
        ) : (
          <>
            <section aria-label="Strand summary" className={cn("grid sm:grid-cols-3", compact ? "gap-2" : "gap-4")}>
              {STRAND_KEYS.map((k) => {
                const s = STRANDS[k];
                const active = config.strand === "all" || config.strand === k;
                const up = s.delta >= 0;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={config.strand === k}
                    onClick={() => setConfig((c) => ({ ...c, strand: c.strand === k ? "all" : k }))}
                    className={cn(
                      "rounded-xl border bg-card text-left transition-[opacity,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]",
                      compact ? "p-3" : "p-4",
                      !active && "opacity-50",
                      config.strand === k && "ring-1 ring-[var(--accent-color)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          s.status === "healthy" ? "bg-[color-mix(in_oklab,var(--accent-color)_14%,transparent)] text-[var(--accent-color)]" : "bg-warn-soft text-foreground",
                        )}
                      >
                        {s.status === "healthy" ? <CheckCircle2Icon className="size-3" aria-hidden /> : <AlertTriangleIcon className="size-3" aria-hidden />}
                        {s.status === "healthy" ? "Healthy" : "At risk"}
                      </span>
                    </div>
                    <p className={cn("tabular mt-2 font-semibold tracking-tight", compact ? "text-xl" : "text-3xl")}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.metric}</p>
                    <p className="tabular mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {up ? <ArrowUpRightIcon className="size-3" aria-hidden /> : <ArrowDownRightIcon className="size-3" aria-hidden />}
                      {up ? "+" : ""}
                      {s.delta}
                      {s.unit}
                    </p>
                  </button>
                );
              })}
            </section>

            {config.trends && (
              <section aria-label="Trend" className={cn("rounded-xl border bg-card", compact ? "p-3" : "p-4")}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="text-sm font-medium">Trend, indexed to week 1</h2>
                  <p className="text-xs text-muted-foreground">
                    {config.strand === "all" ? "All strands" : STRANDS[config.strand].label}
                  </p>
                </div>
                <ChartContainer config={chartConfig} className={cn("w-full", compact ? "h-36" : "h-56")}>
                  {config.chart === "bars" ? (
                    <BarChart data={data} accessibilityLayer>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={6} />
                      <YAxis hide domain={[80, "dataMax + 10"]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {visible.map((k) => (
                        <Bar key={k} dataKey={k} fill={`var(--color-${k})`} radius={3} />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={data} accessibilityLayer>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={6} />
                      <YAxis hide domain={[80, "dataMax + 10"]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {visible.map((k) => (
                        <Line key={k} dataKey={k} type="monotone" stroke={`var(--color-${k})`} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  )}
                </ChartContainer>
              </section>
            )}

            <section aria-label="Needs attention" className={cn("rounded-xl border bg-card", compact ? "p-3" : "p-4")}>
              <h2 className="mb-2 text-sm font-medium">Needs attention</h2>
              {attention.length === 0 ? (
                <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="size-4 text-[var(--accent-color)]" aria-hidden />
                  Nothing needs attention in {STRANDS[visible[0]].label}.
                </p>
              ) : (
                <ul className="divide-y">
                  {attention.map((a) => (
                    <li key={a.title} className={cn("flex items-start gap-3", compact ? "py-1.5" : "py-3")}>
                      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.strand} · {a.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}
