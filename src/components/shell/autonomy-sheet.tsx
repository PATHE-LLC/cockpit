"use client";

import { ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type AutonomyLevel, useCockpit } from "@/lib/store";

const LEVELS: { value: AutonomyLevel; label: string; hint: string }[] = [
  { value: "suggest", label: "Suggest", hint: "Only tell me what's worth doing. Prepare nothing." },
  { value: "prepare", label: "Prepare", hint: "Draft messages, research and safe changes for my review." },
  { value: "act", label: "Act safely", hint: "Also push branches and open draft PRs. Never send messages." },
];

const PERMISSIONS = [
  { key: "draftMessages", label: "Draft Slack and email replies", hint: "Drafts only. Sending is always manual." },
  { key: "research", label: "Research with citations", hint: "Read docs, threads and repos." },
  { key: "codeInSandbox", label: "Make code changes in a sandbox", hint: "Branch + checks, nothing leaves the sandbox." },
  { key: "editFigma", label: "Edit shared Figma pages", hint: "Only the pages I've been invited to." },
  { key: "pushBranches", label: "Push branches and open PRs", hint: "Requires your approval unless Act safely is on." },
] as const;

export function AutonomySheet() {
  const autonomy = useCockpit((s) => s.autonomy);
  const setLevel = useCockpit((s) => s.setAutonomyLevel);
  const setOffline = useCockpit((s) => s.setWhileOffline);
  const setPermission = useCockpit((s) => s.setPermission);
  const current = LEVELS.find((l) => l.value === autonomy.level)!;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Autonomy settings" />
        }
      >
        <ShieldCheckIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">Autonomy: {current.label}</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>How much should CockpitOS do for you?</SheetTitle>
          <SheetDescription>
            You decide what happens while you&rsquo;re offline or focused elsewhere. Changes apply immediately.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <section aria-labelledby="level-h" className="flex flex-col gap-2">
            <h3 id="level-h" className="text-sm font-medium">Proactivity</h3>
            <ToggleGroup
              value={[autonomy.level]}
              onValueChange={(v) => v[0] && setLevel(v[0] as AutonomyLevel)}
              variant="outline"
              spacing={0}
              className="w-full"
              aria-label="Proactivity level"
            >
              {LEVELS.map((l) => (
                <ToggleGroupItem key={l.value} value={l.value} className="flex-1">
                  {l.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-sm text-muted-foreground">{current.hint}</p>
          </section>

          <section className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="offline" className="text-sm font-medium">Keep working while I&rsquo;m offline</Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Prepare drafts overnight so your checklist is ready each morning.
              </p>
            </div>
            <Switch id="offline" checked={autonomy.whileOffline} onCheckedChange={setOffline} />
          </section>

          <section aria-labelledby="perm-h" className="flex flex-col gap-1">
            <h3 id="perm-h" className="mb-1 text-sm font-medium">Allowed actions</h3>
            {PERMISSIONS.map((p) => (
              <div key={p.key} className="flex items-start justify-between gap-4 rounded-lg px-1 py-2">
                <div>
                  <Label htmlFor={`perm-${p.key}`} className="text-sm">{p.label}</Label>
                  <p className="text-xs text-muted-foreground">{p.hint}</p>
                </div>
                <Switch
                  id={`perm-${p.key}`}
                  checked={autonomy.permissions[p.key]}
                  onCheckedChange={(v) => setPermission(p.key, v)}
                />
              </div>
            ))}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
