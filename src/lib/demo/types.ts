export type TaskKind =
  | "slack-reply"
  | "email-draft"
  | "code-change"
  | "figma-design"
  | "prd-prototype"
  | "ad-hoc";

export type TaskStatus =
  | "needs-review"
  | "needs-input"
  | "awaiting-approval"
  | "collaborating"
  | "iterating"
  | "done";

export type SourceApp = "slack" | "email" | "asana" | "meeting" | "figma" | "github";

export interface Task {
  id: string;
  kind: TaskKind;
  title: string;
  summary: string;
  app: SourceApp;
  requester: string;
  status: TaskStatus;
  statusDetail: string;
  prepared: string[];
  due: string;
  autonomy: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  publisher: string;
  quote: string;
  internal?: boolean;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}
