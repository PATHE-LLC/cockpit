"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  idsForScope,
  releaseBlockers,
  simulateRun,
  type Scope,
  type QATab,
  type Run,
  type Issue,
  type Feedback,
} from "./model";

interface QAState {
  scope: Scope;
  selected: string[];
  tab: QATab;
  build: number;
  inbox: boolean;
  runs: Run[];
  issues: Issue[];
  feedback: Feedback[];
  activeRun: number | null;
  activeCheck: string;
  evidenceOpen: boolean;
  flakyReviewed: boolean;
  gapsAccepted: boolean;
  signoffs: string[];
  decision: { kind: "approved" | "held"; note: string; build: number } | null;
  setTab: (tab: QATab) => void;
  setScope: (scope: Scope) => void;
  toggleCheck: (id: string) => void;
  configureInbox: () => void;
  run: (plan?: {
    build: number;
    scope: Scope;
    selected: string[];
    inbox: boolean;
  }) => void;
  reset: () => void;
  fix: () => void;
  startFix: () => void;
  capture: (feedback: Omit<Feedback, "id">) => void;
  selectResult: (run: number, check: string) => void;
  inspectResult: (run: number, check: string) => void;
  setEvidenceOpen: (open: boolean) => void;
  reviewFlaky: (value: boolean) => void;
  acceptGaps: (value: boolean) => void;
  signoff: (name: string) => void;
  decide: (kind: "approved" | "held", note: string) => void;
}

export const useQA = create<QAState>()(
  persist<QAState>(
    (set, get): QAState => ({
      scope: "changed",
      selected: idsForScope("changed"),
      tab: "plan",
      build: 12,
      inbox: false,
      runs: [],
      issues: [],
      feedback: [],
      activeRun: null,
      activeCheck: "C02",
      evidenceOpen: false,
      flakyReviewed: false,
      gapsAccepted: false,
      signoffs: [],
      decision: null,
      setTab: (tab) => set({ tab, evidenceOpen: false }),
      setScope: (scope) => set({ scope, selected: idsForScope(scope) }),
      toggleCheck: (id) =>
        set((s) => ({
          selected: s.selected.includes(id)
            ? s.selected.filter((c) => c !== id)
            : [...s.selected, id],
        })),
      configureInbox: () => set({ inbox: true }),
      reset: () => set(useQA.getInitialState()),
      run: (plan) => {
        const s = get();
        const target = plan ?? s;
        if (!target.selected.length) return;
        const run = simulateRun(
          target.build,
          target.scope,
          target.selected,
          target.inbox,
          s.runs.length + 1,
        );
        const issues = s.issues.map((i) => ({ ...i }));
        const failure = run.results.find((r) => r.checkId === "C02");
        if (failure?.outcome === "failed" && target.build === s.build) {
          const old = issues.find((i) => i.id === "QA-104");
          if (old) old.status = "open";
          else
            issues.push({
              id: "QA-104",
              title: "Message disappears after a failed submission",
              status: "open",
              checkId: "C02",
              originalBuild: target.build,
            });
        } else if (failure?.outcome === "passed" && target.build === s.build) {
          const old = issues.find((i) => i.id === "QA-104");
          if (old?.status === "fixed" && old.fixedBuild === s.build)
            old.status = "resolved";
        }
        set({
          runs: [...s.runs, run],
          issues: issues.map((i) => ({ ...i })),
          activeRun: run.id,
          activeCheck: failure ? "C02" : run.results[0].checkId,
          tab: "results",
          evidenceOpen: false,
          flakyReviewed: false,
          signoffs: [],
          decision: null,
        });
      },
      startFix: () =>
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === "QA-104" && i.status === "open"
              ? { ...i, status: "in-progress" }
              : i,
          ),
        })),
      fix: () =>
        set((s) => ({
          build: 13,
          issues: s.issues.map((i) =>
            i.id === "QA-104" && i.status !== "resolved"
              ? { ...i, status: "fixed", fixedBuild: 13 }
              : i,
          ),
          signoffs: [],
          decision: null,
          flakyReviewed: false,
        })),
      capture: (feedback) =>
        set((s) => ({
          feedback: [
            ...s.feedback,
            { ...feedback, id: `FB-${s.feedback.length + 1}` },
          ],
          issues: s.issues.some((i) => i.id === "QA-104")
            ? s.issues
            : [
                {
                  id: "QA-104",
                  title: "Message disappears after a failed submission",
                  status: "open",
                  checkId: "C02",
                  originalBuild: feedback.build,
                },
              ],
          tab: "issues",
          signoffs: [],
          decision: null,
        })),
      selectResult: (activeRun, activeCheck) => set({ activeRun, activeCheck }),
      inspectResult: (activeRun, activeCheck) =>
        set({ activeRun, activeCheck, tab: "results", evidenceOpen: true }),
      setEvidenceOpen: (evidenceOpen) => set({ evidenceOpen }),
      reviewFlaky: (flakyReviewed) =>
        set({ flakyReviewed, signoffs: [], decision: null }),
      acceptGaps: (gapsAccepted) =>
        set({ gapsAccepted, signoffs: [], decision: null }),
      signoff: (name) =>
        set((s) => ({
          signoffs: s.signoffs.includes(name)
            ? s.signoffs.filter((n) => n !== name)
            : [...s.signoffs, name],
          decision: null,
        })),
      decide: (kind, note) => {
        const s = get();
        if (
          kind === "approved" &&
          (releaseBlockers(s.runs, s.build, s.issues, s.flakyReviewed).length ||
            !s.gapsAccepted ||
            s.signoffs.length !== 3)
        )
          return;
        if (kind === "held" && !note.trim()) return;
        set({ decision: { kind, note, build: s.build } });
      },
    }),
    { name: "cockpit-qa-v1", skipHydration: true },
  ),
);
