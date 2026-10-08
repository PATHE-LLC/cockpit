"use client";

import type { JSONContent } from "@tiptap/core";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { create } from "zustand";
import {
  DANA_REPLY_INITIAL,
  EMAIL_DRAFT_INITIAL,
  FIGMA_FRAMES_INITIAL,
  MODEL_6D_DIFF,
  PROTOTYPE_CONFIG_INITIAL,
  PROTOTYPE_VERSIONS_INITIAL,
  PRD_SECTIONS_INITIAL,
  PRD_TITLE_INITIAL,
  SLACK_DRAFT_INITIAL,
  emailBody,
  type DiffFile,
  type FigmaFrame,
  type Lang,
  type PrdSection,
  type PrototypeConfig,
  type PrototypeVersion,
} from "./demo/content";
import { appendOrderedItem, sectionsToContent } from "./demo/editor-content";
import { LIBRARY_DOCS, SHARED_PRD_DOC } from "./demo/library";
import { TASKS } from "./demo/tasks";
import type { EmailDraft, Task, TaskStatus } from "./demo/types";
import { playCue } from "./sounds";

export type AutonomyLevel = "suggest" | "prepare" | "act";

export interface AutonomyState {
  level: AutonomyLevel;
  whileOffline: boolean;
  permissions: {
    draftMessages: boolean;
    research: boolean;
    codeInSandbox: boolean;
    editFigma: boolean;
    pushBranches: boolean;
  };
}

export type Approval = "pending" | "approved" | "rejected";

export interface IntakeState {
  phase: "what" | "who" | "done" | null;
  what: string;
  who: string;
}

export interface TaskDraft {
  id?: string;
  title: string;
  requester?: string;
  summary: string;
  due: string;
  project?: string;
}

export interface LibraryDocState {
  title: string;
  content: JSONContent;
}

function seedLibraryDocs() {
  const docs: Record<string, LibraryDocState> = {};
  for (const doc of LIBRARY_DOCS) {
    if (doc.kind !== "doc" || doc.id === SHARED_PRD_DOC) continue;
    docs[doc.id] = {
      title: doc.title,
      content: sectionsToContent(doc.title, doc.sections ?? []),
    };
  }
  return docs;
}

interface CockpitState {
  pane: Record<string, string>;
  setPane: (taskId: string, pane: string) => void;
  /** Side artifact is closed until an in-chat action opens it. */
  open: Record<string, boolean>;
  openArtifact: (taskId: string, pane?: string) => void;
  closeArtifact: (taskId: string) => void;

  tasks: Task[];
  discarded: Record<string, boolean>;
  addTask: (draft: TaskDraft) => string;
  threads: Record<string, ThreadMessageLike[]>;
  saveThread: (id: string, messages: ThreadMessageLike[]) => void;
  docs: Record<string, LibraryDocState>;
  setDocContent: (id: string, content: JSONContent) => void;
  updateTask: (id: string, patch: Partial<TaskDraft>) => void;
  deleteTask: (id: string) => void;
  discardTask: (id: string) => void;
  restoreTask: (id: string) => void;
  /** null is closed. taskId null is a new task. */
  taskForm: { taskId: string | null } | null;
  openTaskForm: (taskId?: string | null) => void;
  closeTaskForm: () => void;

  intake: IntakeState;
  setIntake: (intake: IntakeState) => void;
  intakeHandoff: string | null;
  handoffToIntake: (text: string) => void;
  clearIntakeHandoff: () => void;

  completed: Record<string, boolean>;
  toggleCompleted: (id: string, value?: boolean) => void;

  autonomy: AutonomyState;
  setAutonomyLevel: (level: AutonomyLevel) => void;
  setWhileOffline: (v: boolean) => void;
  setPermission: (key: keyof AutonomyState["permissions"], v: boolean) => void;

  slack: { draft: string; rev: number; sent: boolean };
  setSlackDraft: (text: string, bump?: boolean) => void;
  sendSlack: () => void;

  email: {
    draft: EmailDraft;
    deposit: boolean | null;
    tone: "friendly" | "formal";
    short: boolean;
    edited: boolean;
    rev: number;
    sent: boolean;
  };
  setEmailField: (field: "to" | "subject" | "body", value: string) => void;
  setEmailAnswers: (
    patch: Partial<{ deposit: boolean | null; tone: "friendly" | "formal"; short: boolean }>,
    force?: boolean,
  ) => boolean;
  sendEmail: () => void;

  code: {
    diff: DiffFile[];
    phoneRequired: boolean;
    reply: string;
    approval: Approval;
    replySent: boolean;
    rev: number;
  };
  setPhoneRequired: (required: boolean) => void;
  setReply: (text: string) => void;
  setApproval: (a: Approval) => void;
  sendReply: () => void;

  figma: {
    frames: FigmaFrame[];
    selected: string;
    lang: Lang;
    originalMode: "always" | "hover";
    srt: boolean;
    resolved: string[];
  };
  figmaSelect: (id: string) => void;
  figmaSetLang: (lang: Lang) => void;
  figmaApprove: (id: string, v?: boolean) => void;
  figmaSetOriginalMode: (m: "always" | "hover") => void;
  figmaSetSrt: (v: boolean) => void;
  figmaResolve: (id: string) => void;
  figmaAddErrorFrame: () => boolean;

  prd: { title: string; sections: PrdSection[]; content: JSONContent };
  setPrdContent: (content: JSONContent) => void;
  appendRequirement: (text: string) => void;

  prototype: {
    config: PrototypeConfig;
    versions: PrototypeVersion[];
    current: number;
  };
  applyPrototypeChange: (patch: Partial<PrototypeConfig>, label: string) => number;
  restorePrototypeVersion: (version: number) => void;
}

export const useCockpit = create<CockpitState>((set, get) => ({
  pane: {},
  setPane: (taskId, pane) => set((s) => ({ pane: { ...s.pane, [taskId]: pane } })),
  open: {},
  openArtifact: (taskId, pane) => {
    playCue("pane");
    set((s) => ({
      open: { ...s.open, [taskId]: true },
      pane: pane ? { ...s.pane, [taskId]: pane } : s.pane,
    }));
  },
  closeArtifact: (taskId) => set((s) => ({ open: { ...s.open, [taskId]: false } })),

  tasks: TASKS.map((task) => ({ ...task, origin: "suggested" as const })),
  discarded: {},
  threads: {},
  saveThread: (id, messages) => set((s) => ({ threads: { ...s.threads, [id]: messages } })),
  docs: seedLibraryDocs(),
  setDocContent: (id, content) =>
    set((s) => {
      const doc = s.docs[id];
      if (!doc || JSON.stringify(doc.content) === JSON.stringify(content)) return s;
      return { docs: { ...s.docs, [id]: { ...doc, content } } };
    }),

  addTask: (draft) => {
    const id = draft.id ?? `task-${Date.now().toString(36)}`;
    const task: Task = {
      id,
      kind: "ad-hoc",
      title: draft.title,
      summary: draft.summary,
      app: "meeting",
      requester: draft.requester?.trim() || "You",
      status: "needs-review",
      statusDetail: "Yours",
      prepared: [],
      due: draft.due ?? "Soon",
      project: draft.project?.trim() ?? "",
      autonomy: "You added this. Nothing is sent until you ask.",
      origin: "yours",
    };
    set((s) => ({ tasks: [...s.tasks, task] }));
    return id;
  },
  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    })),
  deleteTask: (id) =>
    set((s) => {
      const completed = { ...s.completed };
      const discarded = { ...s.discarded };
      delete completed[id];
      delete discarded[id];
      return { tasks: s.tasks.filter((task) => task.id !== id), completed, discarded };
    }),
  discardTask: (id) => set((s) => ({ discarded: { ...s.discarded, [id]: true } })),
  restoreTask: (id) => set((s) => ({ discarded: { ...s.discarded, [id]: false } })),

  taskForm: null,
  openTaskForm: (taskId = null) => set({ taskForm: { taskId } }),
  closeTaskForm: () => set({ taskForm: null }),

  intake: { phase: null, what: "", who: "" },
  setIntake: (intake) => set({ intake }),
  intakeHandoff: null,
  handoffToIntake: (intakeHandoff) => set({ intakeHandoff }),
  clearIntakeHandoff: () => set({ intakeHandoff: null }),

  completed: {},
  toggleCompleted: (id, value) =>
    set((s) => ({ completed: { ...s.completed, [id]: value ?? !s.completed[id] } })),

  autonomy: {
    level: "prepare",
    whileOffline: true,
    permissions: {
      draftMessages: true,
      research: true,
      codeInSandbox: true,
      editFigma: true,
      pushBranches: false,
    },
  },
  setAutonomyLevel: (level) =>
    set((s) => ({
      autonomy: {
        ...s.autonomy,
        level,
        permissions: {
          draftMessages: level !== "suggest",
          research: true,
          codeInSandbox: level !== "suggest",
          editFigma: level !== "suggest",
          pushBranches: level === "act",
        },
      },
    })),
  setWhileOffline: (whileOffline) => set((s) => ({ autonomy: { ...s.autonomy, whileOffline } })),
  setPermission: (key, v) =>
    set((s) => ({
      autonomy: { ...s.autonomy, permissions: { ...s.autonomy.permissions, [key]: v } },
    })),

  slack: { draft: SLACK_DRAFT_INITIAL, rev: 0, sent: false },
  setSlackDraft: (draft, bump = false) =>
    set((s) => ({ slack: { ...s.slack, draft, rev: bump ? s.slack.rev + 1 : s.slack.rev } })),
  sendSlack: () => {
    set((s) => ({ slack: { ...s.slack, sent: true } }));
    get().toggleCompleted("glenn-supabase-rls", true);
  },

  email: {
    draft: EMAIL_DRAFT_INITIAL,
    deposit: null,
    tone: "friendly",
    short: false,
    edited: false,
    rev: 0,
    sent: false,
  },
  setEmailField: (field, value) =>
    set((s) => ({
      email: {
        ...s.email,
        edited: s.email.edited || field === "body",
        draft: { ...s.email.draft, [field]: value },
      },
    })),
  setEmailAnswers: (patch, force = false) => {
    const { email } = get();
    const next = { ...email, ...patch };
    if (email.edited && !force) {
      set({ email: { ...next, edited: true } });
      return false;
    }
    set({
      email: {
        ...next,
        edited: false,
        rev: email.rev + 1,
        draft: {
          ...email.draft,
          body: emailBody({ deposit: next.deposit, tone: next.tone, short: next.short }),
        },
      },
    });
    return true;
  },
  sendEmail: () => {
    set((s) => ({ email: { ...s.email, sent: true } }));
    get().toggleCompleted("alyssa-wix-quotes", true);
  },

  code: {
    diff: MODEL_6D_DIFF,
    phoneRequired: false,
    reply: DANA_REPLY_INITIAL,
    approval: "pending",
    replySent: false,
    rev: 0,
  },
  setPhoneRequired: (required) =>
    set((s) => {
      const diff = MODEL_6D_DIFF.map((f) => {
        if (!required || f.path !== "src/features/model-6d/schema.ts") return f;
        return {
          ...f,
          additions: f.additions - 2,
          patch: f.patch.replace(
            '+    .regex(phonePattern, "Use digits, spaces, + or () only")\n+    .optional()\n+    .or(z.literal("")),',
            '+    .regex(phonePattern, "Use digits, spaces, + or () only"),',
          ),
        };
      });
      const reply = required
        ? s.code.reply.replace(
            "Can you confirm whether phone should stay optional?",
            "I made phone required, per your note. Tell me if any accounts legitimately have no phone.",
          )
        : DANA_REPLY_INITIAL;
      return { code: { ...s.code, diff, phoneRequired: required, reply, rev: s.code.rev + 1 } };
    }),
  setReply: (reply) => set((s) => ({ code: { ...s.code, reply } })),
  setApproval: (approval) => set((s) => ({ code: { ...s.code, approval } })),
  sendReply: () => {
    set((s) => ({ code: { ...s.code, replySent: true } }));
    if (get().code.approval === "approved") get().toggleCompleted("model-6d-self-service", true);
  },

  figma: {
    frames: FIGMA_FRAMES_INITIAL,
    selected: "live",
    lang: "es",
    originalMode: "always",
    srt: false,
    resolved: [],
  },
  figmaSelect: (selected) => set((s) => ({ figma: { ...s.figma, selected } })),
  figmaSetLang: (lang) => set((s) => ({ figma: { ...s.figma, lang } })),
  figmaApprove: (id, v = true) =>
    set((s) => ({
      figma: {
        ...s.figma,
        frames: s.figma.frames.map((f) => (f.id === id ? { ...f, approved: v } : f)),
      },
    })),
  figmaSetOriginalMode: (originalMode) => set((s) => ({ figma: { ...s.figma, originalMode } })),
  figmaSetSrt: (srt) => set((s) => ({ figma: { ...s.figma, srt } })),
  figmaResolve: (id) =>
    set((s) => ({
      figma: {
        ...s.figma,
        resolved: s.figma.resolved.includes(id)
          ? s.figma.resolved.filter((r) => r !== id)
          : [...s.figma.resolved, id],
      },
    })),
  figmaAddErrorFrame: () => {
    if (get().figma.frames.some((f) => f.id === "error")) return false;
    set((s) => ({
      figma: {
        ...s.figma,
        selected: "error",
        frames: [
          ...s.figma.frames,
          {
            id: "error",
            name: "4 · Translation unavailable",
            note: "Error state with retry and fallback to original",
            author: "AI",
            approved: false,
          },
        ],
      },
    }));
    return true;
  },

  prd: {
    title: PRD_TITLE_INITIAL,
    sections: PRD_SECTIONS_INITIAL,
    content: sectionsToContent(PRD_TITLE_INITIAL, PRD_SECTIONS_INITIAL),
  },
  setPrdContent: (content) =>
    set((s) => {
      if (JSON.stringify(s.prd.content) === JSON.stringify(content)) return s;
      return { prd: { ...s.prd, content } };
    }),
  appendRequirement: (text) =>
    set((s) => ({
      prd: {
        ...s.prd,
        content: appendOrderedItem(s.prd.content, "Requirements", text),
        sections: s.prd.sections.map((x) => {
          if (x.id !== "requirements") return x;
          const count = x.body.split("\n").filter(Boolean).length;
          return { ...x, body: `${x.body}\n${count + 1}. ${text}` };
        }),
      },
    })),

  prototype: {
    config: PROTOTYPE_CONFIG_INITIAL,
    versions: PROTOTYPE_VERSIONS_INITIAL,
    current: 2,
  },
  applyPrototypeChange: (patch, label) => {
    const { prototype } = get();
    const version = prototype.versions[prototype.versions.length - 1].version + 1;
    const config = { ...prototype.config, ...patch };
    set({
      prototype: {
        config,
        current: version,
        versions: [...prototype.versions, { version, label, config }],
      },
    });
    return version;
  },
  restorePrototypeVersion: (version) =>
    set((s) => {
      const found = s.prototype.versions.find((v) => v.version === version);
      if (!found) return s;
      return { prototype: { ...s.prototype, config: found.config, current: version } };
    }),
}));

export function resolveStatus(task: Task, completed: boolean): TaskStatus {
  return completed ? "done" : task.status;
}
