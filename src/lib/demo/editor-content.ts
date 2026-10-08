import type { JSONContent } from "@tiptap/core";
import type { PrdSection } from "./content";

function text(value: string): JSONContent {
  return { type: "text", text: value };
}

function paragraph(value: string): JSONContent {
  return value ? { type: "paragraph", content: [text(value)] } : { type: "paragraph" };
}

function heading(level: number, value: string): JSONContent {
  return { type: "heading", attrs: { level }, content: [text(value)] };
}

function listItem(value: string): JSONContent {
  return { type: "listItem", content: [paragraph(value)] };
}

function linesOf(body: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Turn a seeded title and sections into a Tiptap document. */
export function sectionsToContent(title: string, sections: PrdSection[]): JSONContent {
  const content: JSONContent[] = [heading(1, title)];
  for (const section of sections) {
    content.push(heading(2, section.heading));
    const lines = linesOf(section.body);
    const numbered = lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line));
    const bullets = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));
    if (numbered || bullets) {
      content.push({
        type: numbered ? "orderedList" : "bulletList",
        ...(numbered ? { attrs: { start: 1 } } : {}),
        content: lines.map((line) => listItem(line.replace(/^(\d+\.|[-*])\s+/, ""))),
      });
    } else if (lines.length === 0) {
      content.push(paragraph(""));
    } else {
      for (const line of lines) content.push(paragraph(line));
    }
  }
  return { type: "doc", content };
}

function nodeText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.text) return node.text;
  return (node.content ?? []).map(nodeText).join("");
}

/** Add one item to the ordered list that follows a heading. */
export function appendOrderedItem(doc: JSONContent, headingText: string, item: string): JSONContent {
  const nodes = [...(doc.content ?? [])];
  const index = nodes.findIndex((node) => node.type === "heading" && nodeText(node) === headingText);
  const list = nodes[index + 1];
  if (index < 0 || !list || list.type !== "orderedList") return doc;
  nodes[index + 1] = { ...list, content: [...(list.content ?? []), listItem(item)] };
  return { ...doc, content: nodes };
}
