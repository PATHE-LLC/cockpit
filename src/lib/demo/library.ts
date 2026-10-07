import type { PrdSection } from "./content";

export interface ClientRecord {
  id: string;
  name: string;
  note: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  /** Omitted when the work is internal. */
  clientId?: string;
  summary: string;
}

export interface LibraryDoc {
  id: string;
  title: string;
  kind: "doc" | "link";
  scopeType: "company" | "client" | "project";
  scopeId: string;
  detail: string;
  /** One line already in the document, shown on the row. */
  line?: string;
  href?: string;
  sections?: PrdSection[];
}

export interface LibraryPill {
  label: string;
  href: string;
  kind: "library" | "link";
  docId?: string;
}

export const CLIENTS: ClientRecord[] = [
  {
    id: "solar-light",
    name: "Solar Light",
    note: "They want short decks.",
  },
];

export const PROJECTS: ProjectRecord[] = [
  {
    id: "website-redesign",
    name: "Website Redesign",
    clientId: "solar-light",
    summary: "A shorter marketing site.",
  },
  {
    id: "rma-form",
    name: "RMA Form",
    clientId: "solar-light",
    summary: "Self-service form for Model 6D.",
  },
  {
    id: "three-strands",
    name: "3 Strands dashboard",
    summary: "Internal dashboard.",
  },
];

/** The 3 Strands PRD already lives in the task editor. */
export const SHARED_PRD_DOC = "three-strands-prd";

export const LIBRARY_DOCS: LibraryDoc[] = [
  {
    id: "project-flow",
    title: "Project flow SOP",
    kind: "doc",
    scopeType: "company",
    scopeId: "company",
    detail: "Document",
    line: "Start from the kickoff notes.",
    sections: [
      {
        id: "steps",
        heading: "Steps",
        body: "1. Start from the kickoff notes.\n2. Draft the deliverable.\n3. Review it with the client.\n4. Send when they say it's ready.",
      },
    ],
  },
  {
    id: "proposal-sop",
    title: "Proposal SOP",
    kind: "doc",
    scopeType: "company",
    scopeId: "company",
    detail: "Document",
    line: "Keep the deck short if the client asked for that.",
    sections: [
      {
        id: "steps",
        heading: "Steps",
        body: "1. Keep the deck short if the client asked for that.\n2. Price only the phase they approved.\n3. Send the PDF.",
      },
    ],
  },
  {
    id: "contract-template",
    title: "Contract template",
    kind: "doc",
    scopeType: "company",
    scopeId: "company",
    detail: "Document",
    line: "Work starts after the proposal is signed.",
    sections: [
      {
        id: "terms",
        heading: "Terms",
        body: "Work starts after the proposal is signed. Scope changes need a written change order.",
      },
    ],
  },
  {
    id: "brand",
    title: "Brand",
    kind: "doc",
    scopeType: "company",
    scopeId: "company",
    detail: "Document",
    line: "Black and white wordmark. Decks stay short.",
    sections: [
      {
        id: "rules",
        heading: "Rules",
        body: "Black and white wordmark. Decks stay short. No extra colors on the cover.",
      },
    ],
  },
  {
    id: "solar-light-note",
    title: "Solar Light note",
    kind: "doc",
    scopeType: "client",
    scopeId: "solar-light",
    detail: "Note",
    line: "They want short decks.",
    sections: [
      {
        id: "note",
        heading: "Note",
        body: "They want short decks.",
      },
    ],
  },
  {
    id: "site-map",
    title: "Site map",
    kind: "doc",
    scopeType: "project",
    scopeId: "website-redesign",
    detail: "Document",
    line: "Home, work, and a short contact page.",
    sections: [
      {
        id: "pages",
        heading: "Pages",
        body: "Home, work, and a short contact page. No long case studies.",
      },
    ],
  },
  {
    id: "website-figma",
    title: "Homepage frames",
    kind: "link",
    scopeType: "project",
    scopeId: "website-redesign",
    detail: "Figma",
    href: "https://www.figma.com/design/solar-light/homepage",
  },
  {
    id: "website-notion",
    title: "Content inventory",
    kind: "link",
    scopeType: "project",
    scopeId: "website-redesign",
    detail: "Notion",
    href: "https://www.notion.so/solar-light-content",
  },
  {
    id: "rma-spec",
    title: "Form spec",
    kind: "doc",
    scopeType: "project",
    scopeId: "rma-form",
    detail: "Document",
    line: "Customers update name, email, and phone from the account page.",
    sections: [
      {
        id: "fields",
        heading: "Fields",
        body: "Customers update name, email, and phone from the account page. Phone is validated before save.",
      },
    ],
  },
  {
    id: "rma-drive",
    title: "Field list",
    kind: "link",
    scopeType: "project",
    scopeId: "rma-form",
    detail: "Drive",
    href: "https://drive.google.com/drive/folders/rma-form-fields",
  },
  {
    id: SHARED_PRD_DOC,
    title: "Dashboard PRD",
    kind: "doc",
    scopeType: "project",
    scopeId: "three-strands",
    detail: "Document",
    line: "Pipeline, Delivery, and Customer Health.",
  },
  {
    id: "three-strands-preview",
    title: "Hosted prototype",
    kind: "link",
    scopeType: "project",
    scopeId: "three-strands",
    detail: "Prototype",
    href: "/preview/3-strands",
  },
];

const RMA_PILLS: LibraryPill[] = [
  { label: "Project flow SOP", href: "/library/company?doc=project-flow", kind: "library", docId: "project-flow" },
  { label: "Solar Light note", href: "/library/clients/solar-light?doc=solar-light-note", kind: "library", docId: "solar-light-note" },
  { label: "Form spec", href: "/library/projects/rma-form?doc=rma-spec", kind: "library", docId: "rma-spec" },
];

export const LIBRARY_PILL_SETS: Record<string, LibraryPill[]> = {
  "model-6d-self-service": RMA_PILLS,
  "rma-form": RMA_PILLS,
  "website-redesign": [
    { label: "Solar Light note", href: "/library/clients/solar-light?doc=solar-light-note", kind: "library", docId: "solar-light-note" },
    { label: "Site map", href: "/library/projects/website-redesign?doc=site-map", kind: "library", docId: "site-map" },
    { label: "Homepage frames", href: "https://www.figma.com/design/solar-light/homepage", kind: "link" },
  ],
  "three-strands": [
    { label: "Dashboard PRD", href: "/library/projects/three-strands?doc=three-strands-prd", kind: "library", docId: SHARED_PRD_DOC },
  ],
};

export const DOC_BY_ID = Object.fromEntries(LIBRARY_DOCS.map((doc) => [doc.id, doc])) as Record<string, LibraryDoc>;

export function clientById(id: string) {
  return CLIENTS.find((client) => client.id === id);
}

export function projectById(id: string) {
  return PROJECTS.find((project) => project.id === id);
}

export function projectByName(name: string) {
  return PROJECTS.find((project) => project.name === name);
}

export function projectsForClient(clientId: string) {
  return PROJECTS.filter((project) => project.clientId === clientId);
}

export function docsFor(scopeType: LibraryDoc["scopeType"], scopeId: string) {
  return LIBRARY_DOCS.filter((doc) => doc.scopeType === scopeType && doc.scopeId === scopeId);
}

export function scopeLabel(doc: LibraryDoc) {
  if (doc.scopeType === "company") return "Company";
  if (doc.scopeType === "client") return clientById(doc.scopeId)?.name ?? "Client";
  return projectById(doc.scopeId)?.name ?? "Project";
}

export function docMeta(doc: LibraryDoc) {
  return `${doc.detail} · ${scopeLabel(doc)}`;
}

export function projectMeta(project: ProjectRecord) {
  const where = project.clientId ? (clientById(project.clientId)?.name ?? "Client") : "Internal";
  const count = docsFor("project", project.id).length;
  const documents = count === 1 ? "1 document" : `${count} documents`;
  return `${where} · ${documents}`;
}

export function clientMeta(clientId: string) {
  return projectsForClient(clientId)
    .map((project) => project.name)
    .join(" · ");
}

export const DOCUMENT_SCOPES = [
  { id: "all", label: "All" },
  { id: "company", label: "Company" },
  { id: "client:solar-light", label: "Solar Light" },
  ...PROJECTS.map((project) => ({ id: `project:${project.id}`, label: project.name })),
];

export function docsInScope(scope: string) {
  if (!scope || scope === "all") return LIBRARY_DOCS;
  if (scope === "company") return LIBRARY_DOCS.filter((doc) => doc.scopeType === "company");
  if (scope.startsWith("client:")) {
    const clientId = scope.slice("client:".length);
    const projectIds = new Set(projectsForClient(clientId).map((project) => project.id));
    return LIBRARY_DOCS.filter(
      (doc) =>
        (doc.scopeType === "client" && doc.scopeId === clientId) ||
        (doc.scopeType === "project" && projectIds.has(doc.scopeId)),
    );
  }
  if (scope.startsWith("project:")) {
    const projectId = scope.slice("project:".length);
    return LIBRARY_DOCS.filter((doc) => doc.scopeType === "project" && doc.scopeId === projectId);
  }
  return LIBRARY_DOCS;
}

/** Project named in a conversation. A client name alone does not pick one. */
export function namedProject(text: string) {
  const t = text.toLowerCase();
  if (/website redesign/.test(t) || (/solar light/.test(t) && /website|redesign/.test(t))) return "Website Redesign";
  if (/rma form|\brma\b/.test(t)) return "RMA Form";
  if (/3 strands|three strands/.test(t)) return "3 Strands dashboard";
  return null;
}
