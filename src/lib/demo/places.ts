import type { JSONContent } from "@tiptap/core";

export type SectionKind = "overview" | "list" | "memory";

export interface PlaceSection {
  id: string;
  placeId: string;
  title: string;
  kind: SectionKind;
  order: number;
  /** Written overview. List sections keep their writing on items. */
  docId?: string;
}

export interface PlaceItem {
  id: string;
  placeId: string;
  sectionId: string;
  title: string;
  line?: string;
  href?: string;
  tags?: string[];
  order: number;
  docId?: string;
}

const text = (value: string): JSONContent => ({ type: "text", text: value });
const codeText = (value: string): JSONContent => ({ type: "text", text: value, marks: [{ type: "code" }] });
const paragraph = (value: string): JSONContent => ({ type: "paragraph", content: [text(value)] });
const rich = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });
const numbered = (items: string[]): JSONContent => ({
  type: "orderedList",
  attrs: { start: 1 },
  content: items.map((item) => ({ type: "listItem", content: [paragraph(item)] })),
});
const heading = (level: number, value: string): JSONContent => ({
  type: "heading",
  attrs: { level },
  content: [text(value)],
});
const bullets = (items: string[]): JSONContent => ({
  type: "bulletList",
  content: items.map((item) => ({ type: "listItem", content: [paragraph(item)] })),
});
const richBullets = (items: JSONContent[][]): JSONContent => ({
  type: "bulletList",
  content: items.map((bits) => ({ type: "listItem", content: [{ type: "paragraph", content: bits }] })),
});
const code = (value: string): JSONContent => ({ type: "codeBlock", content: [text(value)] });
const doc = (...nodes: JSONContent[]): JSONContent => ({ type: "doc", content: nodes });

export const PLACE_CONTENT: Record<string, JSONContent> = {
  "team-overview": doc(
    paragraph("The playbook for how we work."),
    heading(2, "Processes"),
    bullets(["Start from the kickoff notes.", "Draft the deliverable.", "Review it, then send."]),
    heading(2, "Resources"),
    paragraph("Brand, contracts, and the files those processes use."),
  ),
  "solar-light-note": doc(paragraph("They want short decks.")),
  "solar-kickoff": doc(
    heading(2, "Summary"),
    paragraph("Kickoff asked for a short site and a short contact page."),
  ),
  "solar-cover": doc(paragraph("Covers stay black and white. No extra colors.")),
  "cockpit-overview": doc(
    paragraph("The day's work, prepared before you sit down."),
    heading(2, "Where it stands"),
    numbered([
      "The checklist is the front door.",
      "The library is the shared shelf.",
      "Edit opens the editor, then saving returns here.",
    ]),
    heading(2, "Home"),
    rich(text("The project is "), codeText("in-house"), text(". There is no client line.")),
    code("home: in-house"),
  ),
  "cockpit-checklist": doc(
    heading(2, "Checklist"),
    bullets(["The morning brief plays from home.", "A chat stays personal until it is added."]),
  ),
  "cockpit-library": doc(
    heading(2, "Library"),
    paragraph("Team, clients, projects, and the files on them."),
  ),
  "cockpit-meet-checklist": doc(
    heading(2, "Summary"),
    paragraph("Walked the checklist first, then the morning brief."),
  ),
  "cockpit-meet-library": doc(
    heading(2, "Summary"),
    paragraph("The library holds team, clients, projects, and documents. It is not pasted into the thread."),
    heading(2, "Transcript"),
    paragraph("Where do the files live?"),
    paragraph("On the project, under Files and links. Notes from the work live in Project memory."),
  ),
  "cockpit-decision": doc(paragraph("Chats stay personal until they are added to the checklist.")),
  "cockpit-tone": doc(bullets(["Short sentences.", "Say what is ready.", "No status chatter."])),
  "website-overview": doc(
    paragraph("A shorter marketing site. Home, work, and a short contact page."),
    heading(2, "Where it stands"),
    bullets(["The site map is set.", "Homepage frames are in Figma.", "No long case studies."]),
  ),
  "website-review": doc(
    heading(2, "Summary"),
    paragraph("Reviewed the homepage frames. The cover stays black and white."),
  ),
  "website-scope": doc(paragraph("Home, work, and a short contact page. No long case studies.")),
  "rma-overview": doc(
    paragraph("Self-service form for Model 6D. Customers update name, email, and phone."),
    heading(2, "Where it stands"),
    bullets(["The form spec is written.", "The field list is in Drive.", "Phone is required before save."]),
  ),
  "rma-review": doc(
    heading(2, "Summary"),
    paragraph("The account page should update name, email, and phone."),
  ),
  "rma-phone": doc(paragraph("Phone is required before save.")),
  "strands-overview": doc(
    paragraph("An internal dashboard for Pipeline, Delivery, and Customer Health."),
    heading(2, "Where it stands"),
    bullets(["The PRD is drafted.", "Prototype v2 is up.", "Read-only for v1."]),
  ),
  "strands-review": doc(
    heading(2, "Summary"),
    paragraph("Leadership wants the three strands in under a minute."),
  ),
  "strands-scope": doc(paragraph("Read-only for v1. No custom reports.")),
  "site-map": doc(
    paragraph("The public site stays short. Three pages, and no long case studies."),
    heading(2, "Pages"),
    richBullets([
      [text("Home, "), codeText("/")],
      [text("Work, "), codeText("/work")],
      [text("Contact, "), codeText("/contact")],
    ]),
    code("home\nwork\ncontact"),
  ),
};

export const PLACE_SECTIONS: PlaceSection[] = [
  { id: "team-overview", placeId: "company", title: "Overview", kind: "overview", order: 1, docId: "team-overview" },
  { id: "team-processes", placeId: "company", title: "Processes", kind: "list", order: 2 },
  { id: "team-resources", placeId: "company", title: "Resources", kind: "list", order: 3 },

  { id: "solar-overview", placeId: "solar-light", title: "Overview", kind: "overview", order: 1, docId: "solar-light-note" },
  { id: "solar-memory", placeId: "solar-light", title: "Client memory", kind: "memory", order: 2 },

  { id: "cockpit-overview", placeId: "cockpit-os", title: "Overview", kind: "overview", order: 1, docId: "cockpit-overview" },
  { id: "cockpit-files", placeId: "cockpit-os", title: "Files & links", kind: "list", order: 2 },
  { id: "cockpit-memory", placeId: "cockpit-os", title: "Project memory", kind: "memory", order: 3 },
  { id: "cockpit-voice", placeId: "cockpit-os", title: "Voice", kind: "list", order: 4 },

  { id: "website-overview", placeId: "website-redesign", title: "Overview", kind: "overview", order: 1, docId: "website-overview" },
  { id: "website-files", placeId: "website-redesign", title: "Files & links", kind: "list", order: 2 },
  { id: "website-memory", placeId: "website-redesign", title: "Project memory", kind: "memory", order: 3 },

  { id: "rma-overview", placeId: "rma-form", title: "Overview", kind: "overview", order: 1, docId: "rma-overview" },
  { id: "rma-files", placeId: "rma-form", title: "Files & links", kind: "list", order: 2 },
  { id: "rma-memory", placeId: "rma-form", title: "Project memory", kind: "memory", order: 3 },

  { id: "strands-overview", placeId: "three-strands", title: "Overview", kind: "overview", order: 1, docId: "strands-overview" },
  { id: "strands-files", placeId: "three-strands", title: "Files & links", kind: "list", order: 2 },
  { id: "strands-memory", placeId: "three-strands", title: "Project memory", kind: "memory", order: 3 },
];

export const PLACE_ITEMS: PlaceItem[] = [
  { id: "project-flow", placeId: "company", sectionId: "team-processes", title: "Project flow SOP", line: "Start from the kickoff notes.", order: 1, docId: "project-flow" },
  { id: "proposal-sop", placeId: "company", sectionId: "team-processes", title: "Proposal SOP", line: "Keep the deck short if the client asked for that.", order: 2, docId: "proposal-sop" },
  { id: "contract-template", placeId: "company", sectionId: "team-processes", title: "Contract template", line: "Work starts after the proposal is signed.", order: 3, docId: "contract-template" },
  { id: "brand", placeId: "company", sectionId: "team-resources", title: "Brand", line: "Black and white wordmark. Decks stay short.", order: 1, docId: "brand" },

  { id: "solar-kickoff", placeId: "solar-light", sectionId: "solar-memory", title: "Site kickoff", line: "A short site and a short contact page.", tags: ["Meeting"], order: 1, docId: "solar-kickoff" },
  { id: "solar-cover", placeId: "solar-light", sectionId: "solar-memory", title: "Cover", line: "Covers stay black and white.", tags: ["Preference"], order: 2, docId: "solar-cover" },

  { id: "cockpit-checklist", placeId: "cockpit-os", sectionId: "cockpit-files", title: "Checklist", line: "The morning brief plays from home.", order: 1, docId: "cockpit-checklist" },
  { id: "cockpit-library", placeId: "cockpit-os", sectionId: "cockpit-files", title: "Library map", line: "Team, clients, projects, and documents.", order: 2, docId: "cockpit-library" },
  { id: "cockpit-repo", placeId: "cockpit-os", sectionId: "cockpit-files", title: "Repository", line: "The prototype repo.", href: "https://github.com/acme/cockpit-os", order: 3 },

  { id: "cockpit-meet-checklist", placeId: "cockpit-os", sectionId: "cockpit-memory", title: "Checklist walk", line: "Walked the checklist first.", tags: ["Meeting"], order: 1, docId: "cockpit-meet-checklist" },
  { id: "cockpit-meet-library", placeId: "cockpit-os", sectionId: "cockpit-memory", title: "Library walk", line: "Where the files live.", tags: ["Meeting", "Transcript"], order: 2, docId: "cockpit-meet-library" },
  { id: "cockpit-decision", placeId: "cockpit-os", sectionId: "cockpit-memory", title: "Personal chats", line: "A chat stays personal until it is added.", tags: ["Decision"], order: 3, docId: "cockpit-decision" },
  { id: "cockpit-tone", placeId: "cockpit-os", sectionId: "cockpit-voice", title: "Tone", line: "Short sentences. Say what is ready.", order: 1, docId: "cockpit-tone" },

  { id: "site-map", placeId: "website-redesign", sectionId: "website-files", title: "Site map", line: "Home, work, and a short contact page.", order: 1, docId: "site-map" },
  { id: "website-figma", placeId: "website-redesign", sectionId: "website-files", title: "Homepage frames", line: "Frames for the homepage.", href: "https://www.figma.com/design/solar-light/homepage", order: 2 },
  { id: "website-notion", placeId: "website-redesign", sectionId: "website-files", title: "Content inventory", line: "Copy for the short site.", href: "https://www.notion.so/solar-light-content", order: 3 },
  { id: "website-review", placeId: "website-redesign", sectionId: "website-memory", title: "Homepage review", line: "The cover stays black and white.", tags: ["Meeting"], order: 1, docId: "website-review" },
  { id: "website-scope", placeId: "website-redesign", sectionId: "website-memory", title: "Scope", line: "No long case studies.", tags: ["Decision"], order: 2, docId: "website-scope" },

  { id: "rma-spec", placeId: "rma-form", sectionId: "rma-files", title: "Form spec", line: "Name, email, and phone from the account page.", order: 1, docId: "rma-spec" },
  { id: "rma-drive", placeId: "rma-form", sectionId: "rma-files", title: "Field list", line: "The field list in Drive.", href: "https://drive.google.com/drive/folders/rma-form-fields", order: 2 },
  { id: "rma-review", placeId: "rma-form", sectionId: "rma-memory", title: "Field review", line: "Update name, email, and phone.", tags: ["Meeting"], order: 1, docId: "rma-review" },
  { id: "rma-phone", placeId: "rma-form", sectionId: "rma-memory", title: "Phone", line: "Required before save.", tags: ["Decision"], order: 2, docId: "rma-phone" },

  { id: "three-strands-prd", placeId: "three-strands", sectionId: "strands-files", title: "Dashboard PRD", line: "Pipeline, Delivery, and Customer Health.", order: 1, docId: "three-strands-prd" },
  { id: "three-strands-preview", placeId: "three-strands", sectionId: "strands-files", title: "Hosted prototype", line: "Prototype v2.", href: "/preview/3-strands", order: 2 },
  { id: "strands-review", placeId: "three-strands", sectionId: "strands-memory", title: "Leadership review", line: "The three strands in under a minute.", tags: ["Meeting"], order: 1, docId: "strands-review" },
  { id: "strands-scope", placeId: "three-strands", sectionId: "strands-memory", title: "v1 scope", line: "Read-only. No custom reports.", tags: ["Decision"], order: 2, docId: "strands-scope" },
];

const SHELF_EXISTING = new Set([
  "project-flow",
  "proposal-sop",
  "contract-template",
  "brand",
  "solar-light-note",
  "site-map",
  "website-figma",
  "website-notion",
  "rma-spec",
  "rma-drive",
  "three-strands-prd",
  "three-strands-preview",
]);

export interface ShelfDoc {
  id: string;
  title: string;
  kind: "doc" | "link";
  scopeType: "company" | "client" | "project";
  scopeId: string;
  detail: string;
  line?: string;
  href?: string;
}

function scopeFor(placeId: string): { scopeType: ShelfDoc["scopeType"]; scopeId: string } {
  if (placeId === "company") return { scopeType: "company", scopeId: "company" };
  if (placeId === "solar-light") return { scopeType: "client", scopeId: "solar-light" };
  return { scopeType: "project", scopeId: placeId };
}

export function placeShelfDocs(): ShelfDoc[] {
  const docs: ShelfDoc[] = [];
  for (const section of PLACE_SECTIONS) {
    if (section.kind !== "overview" || !section.docId || SHELF_EXISTING.has(section.docId)) continue;
    docs.push({
      id: section.docId,
      title: "Overview",
      kind: "doc",
      ...scopeFor(section.placeId),
      detail: "Overview",
      line: "The page you read first.",
    });
  }
  for (const item of PLACE_ITEMS) {
    const id = item.docId ?? item.id;
    if (SHELF_EXISTING.has(id) || SHELF_EXISTING.has(item.id)) continue;
    if (item.href && !item.docId) {
      docs.push({
        id: item.id,
        title: item.title,
        kind: "link",
        ...scopeFor(item.placeId),
        detail: "Link",
        line: item.line,
        href: item.href,
      });
      continue;
    }
    docs.push({
      id,
      title: item.title,
      kind: "doc",
      ...scopeFor(item.placeId),
      detail: item.tags?.[0] ?? "Note",
      line: item.line,
    });
  }
  return docs;
}

export function allSections(extra: PlaceSection[] = []) {
  return [...PLACE_SECTIONS, ...extra];
}

export function allItems(extra: PlaceItem[] = []) {
  return [...PLACE_ITEMS, ...extra];
}

export function sectionsFor(placeId: string, extra: PlaceSection[] = []) {
  return allSections(extra)
    .filter((section) => section.placeId === placeId)
    .sort((a, b) => a.order - b.order);
}

export function itemsFor(sectionId: string, extra: PlaceItem[] = []) {
  return allItems(extra)
    .filter((item) => item.sectionId === sectionId)
    .sort((a, b) => a.order - b.order);
}

export function sectionById(id: string, extra: PlaceSection[] = []) {
  return allSections(extra).find((section) => section.id === id);
}

export function itemById(id: string, extra: PlaceItem[] = []) {
  return allItems(extra).find((item) => item.id === id);
}

export function locateDoc(docId: string, extraSections: PlaceSection[] = [], extraItems: PlaceItem[] = []) {
  const section = allSections(extraSections).find((entry) => entry.docId === docId);
  if (section) return { section, item: undefined as PlaceItem | undefined };
  const item = allItems(extraItems).find((entry) => (entry.docId ?? entry.id) === docId || entry.id === docId);
  if (!item) return undefined;
  return { section: sectionById(item.sectionId, extraSections), item };
}

export function placePath(placeId: string) {
  if (placeId === "company") return "/library/company";
  if (placeId === "solar-light") return "/library/clients/solar-light";
  return `/library/projects/${placeId}`;
}

export function memoryTags(sectionId: string, extra: PlaceItem[] = []) {
  const tags: string[] = [];
  for (const item of itemsFor(sectionId, extra)) {
    for (const tag of item.tags ?? []) {
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  return tags;
}
