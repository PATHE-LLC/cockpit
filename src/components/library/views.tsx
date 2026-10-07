"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LibraryFrame, useLibraryQuery } from "@/components/library/library-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CLIENTS,
  DOCUMENT_SCOPES,
  PROJECTS,
  clientById,
  clientMeta,
  docMeta,
  docsFor,
  docsInScope,
  projectById,
  projectMeta,
  projectsForClient,
  type LibraryDoc,
} from "@/lib/demo/library";
import { playCue } from "@/lib/sounds";
import { useCockpit } from "@/lib/store";
import { cn } from "@/lib/utils";

function Crumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-baseline gap-x-1.5">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-baseline gap-x-1.5">
              {index > 0 ? <span aria-hidden>/</span> : null}
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  current && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PageTitle({ crumbs, title }: { crumbs: { href: string; label: string }[]; title: string }) {
  return (
    <>
      <Crumbs items={crumbs} />
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
    </>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <h2 className="mt-8 text-sm font-medium text-muted-foreground">{children}</h2>;
}

function RichRow({
  title,
  meta,
  line,
  href,
  external,
  active,
  onClick,
}: {
  title: string;
  meta: string;
  line?: string;
  href?: string;
  external?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex w-full flex-col items-start gap-0.5 rounded-xl px-2 py-3 text-left outline-none transition-colors duration-150 hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-3",
    active && "bg-accent/60",
  );
  const body = (
    <>
      <span className="flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="inline-flex min-w-0 items-baseline gap-1.5 text-[15px] leading-5 font-medium">
          <span>{title}</span>
          {external ? <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden /> : null}
        </span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </span>
      {line ? <span className="max-w-full text-sm leading-5 text-muted-foreground">{line}</span> : null}
      {external ? <span className="sr-only">(opens in a new tab)</span> : null}
    </>
  );
  if (href) {
    return (
      <li>
        {external ? (
          <a href={href} target="_blank" rel="noreferrer" className={className}>
            {body}
          </a>
        ) : (
          <Link
            href={href}
            onClick={() => {
              if (href.startsWith("/tasks/")) playCue("open-task");
            }}
            className={className}
          >
            {body}
          </Link>
        )}
      </li>
    );
  }
  return (
    <li>
      <button type="button" onClick={onClick} className={className} aria-current={active ? "true" : undefined}>
        {body}
      </button>
    </li>
  );
}

function DocRows({ docs }: { docs: LibraryDoc[] }) {
  const { docId, openDoc } = useLibraryQuery();
  if (!docs.length) {
    return <p className="mt-4 text-sm text-muted-foreground">Nothing filed here.</p>;
  }
  return (
    <ul className="mt-2">
      {docs.map((doc) => (
        <RichRow
          key={doc.id}
          title={doc.title}
          meta={docMeta(doc)}
          line={doc.line}
          active={docId === doc.id}
          {...(doc.kind === "link" && doc.href
            ? { href: doc.href, external: true }
            : { onClick: () => openDoc(doc.id) })}
        />
      ))}
    </ul>
  );
}

function ProjectRows({ projects, className }: { projects: typeof PROJECTS; className?: string }) {
  return (
    <ul className={className ?? "mt-2"}>
      {projects.map((project) => (
        <RichRow
          key={project.id}
          title={project.name}
          meta={projectMeta(project)}
          line={project.summary}
          href={`/library/projects/${project.id}`}
        />
      ))}
    </ul>
  );
}

const library = { href: "/library", label: "Library" };

function LibraryHomeInner() {
  return (
    <LibraryFrame>
      <div data-tour="library">
      <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
      <ul className="mt-6">
        <RichRow title="Company" meta="Playbook" line="Project flow, proposals, contracts, and brand." href="/library/company" />
        <RichRow title="Clients" meta="1 client" line="Solar Light." href="/library/clients" />
        <RichRow
          title="Projects"
          meta="3 projects"
          line="Website Redesign, RMA Form, and an internal dashboard."
          href="/library/projects"
        />
        <RichRow
          title="Documents"
          meta="Files and links"
          line="Everything filed on the company, a client, or a project."
          href="/library/documents"
        />
      </ul>
      </div>
    </LibraryFrame>
  );
}

function CompanyInner() {
  return (
    <LibraryFrame>
      <div data-tour="company">
      <PageTitle crumbs={[library, { href: "/library/company", label: "Company" }]} title="Company" />
      <DocRows docs={docsFor("company", "company")} />
      </div>
    </LibraryFrame>
  );
}

function ClientsInner() {
  return (
    <LibraryFrame>
      <PageTitle crumbs={[library, { href: "/library/clients", label: "Clients" }]} title="Clients" />
      <ul className="mt-6">
        {CLIENTS.map((client) => (
          <RichRow
            key={client.id}
            title={client.name}
            meta={clientMeta(client.id)}
            line={client.note}
            href={`/library/clients/${client.id}`}
          />
        ))}
      </ul>
    </LibraryFrame>
  );
}

function ClientInner({ id }: { id: string }) {
  const client = clientById(id);
  if (!client) {
    return (
      <LibraryFrame>
        <PageTitle crumbs={[library, { href: "/library/clients", label: "Clients" }]} title="That client is gone" />
      </LibraryFrame>
    );
  }
  return (
    <LibraryFrame>
      <div data-tour="client">
      <PageTitle
        crumbs={[library, { href: "/library/clients", label: "Clients" }, { href: `/library/clients/${client.id}`, label: client.name }]}
        title={client.name}
      />
      <p className="mt-4 text-[15px] leading-6">{client.note}</p>
      <SectionLabel>Projects</SectionLabel>
      <ProjectRows projects={projectsForClient(client.id)} />
      <SectionLabel>Documents</SectionLabel>
      <DocRows docs={docsInScope(`client:${client.id}`)} />
      </div>
    </LibraryFrame>
  );
}

function ProjectsInner() {
  return (
    <LibraryFrame>
      <PageTitle crumbs={[library, { href: "/library/projects", label: "Projects" }]} title="Projects" />
      <ProjectRows projects={PROJECTS} className="mt-6" />
    </LibraryFrame>
  );
}

function ProjectInner({ id }: { id: string }) {
  const project = projectById(id);
  const tasks = useCockpit((s) => s.tasks);
  const discarded = useCockpit((s) => s.discarded);
  const onProject = tasks.filter((task) => task.project === project?.name && !discarded[task.id]);
  if (!project) {
    return (
      <LibraryFrame>
        <PageTitle crumbs={[library, { href: "/library/projects", label: "Projects" }]} title="That project is gone" />
      </LibraryFrame>
    );
  }
  const client = project.clientId ? clientById(project.clientId) : undefined;
  return (
    <LibraryFrame>
      <div data-tour="project">
      <PageTitle
        crumbs={[library, { href: "/library/projects", label: "Projects" }, { href: `/library/projects/${project.id}`, label: project.name }]}
        title={project.name}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        {client ? (
          <Link href={`/library/clients/${client.id}`} className="rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            {client.name}
          </Link>
        ) : (
          "Internal"
        )}
        <span> · {projectMeta(project).split(" · ")[1]}</span>
      </p>
      <SectionLabel>Documents</SectionLabel>
      <DocRows docs={docsFor("project", project.id)} />
      <SectionLabel>Tasks</SectionLabel>
      {onProject.length ? (
        <ul className="mt-2">
          {onProject.map((task) => (
            <RichRow
              key={task.id}
              title={task.title}
              meta={[task.statusDetail, task.due].filter(Boolean).join(" · ")}
              href={`/tasks/${task.id}`}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No tasks on this project.</p>
      )}
      </div>
    </LibraryFrame>
  );
}

function DocumentsInner() {
  const { scope, setScope } = useLibraryQuery();
  const docs = docsInScope(scope);
  return (
    <LibraryFrame>
      <PageTitle crumbs={[library, { href: "/library/documents", label: "Documents" }]} title="Documents" />
      <div data-tour="doc-filters" className="mt-6">
      <Tabs value={scope} onValueChange={(value) => setScope(String(value))}>
        <TabsList aria-label="Show documents" className="h-auto w-full flex-wrap justify-start">
          {DOCUMENT_SCOPES.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="h-8 flex-none px-2 text-xs">
              {item.label}
              <span className="tabular-nums text-muted-foreground">{docsInScope(item.id).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      </div>
      <DocRows docs={docs} />
    </LibraryFrame>
  );
}

function Fallback({ title }: { title: string }) {
  return (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto" role="status" aria-label={`Loading ${title}`}>
      <div className="page-column py-8 sm:py-12">
        <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
        <Skeleton className="mt-3 h-8 w-40 motion-reduce:animate-none" />
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-12 w-full motion-reduce:animate-none" />
          <Skeleton className="h-12 w-full motion-reduce:animate-none" />
          <Skeleton className="h-12 w-4/5 motion-reduce:animate-none" />
        </div>
      </div>
      <span className="sr-only">Loading {title}</span>
    </div>
  );
}

function gated(title: string, node: React.ReactNode) {
  return <Suspense fallback={<Fallback title={title} />}>{node}</Suspense>;
}

export function LibraryHome() {
  return gated("Library", <LibraryHomeInner />);
}
export function CompanyPage() {
  return gated("Company", <CompanyInner />);
}
export function ClientsPage() {
  return gated("Clients", <ClientsInner />);
}
export function ClientPage({ id }: { id: string }) {
  return gated("Client", <ClientInner id={id} />);
}
export function ProjectsPage() {
  return gated("Projects", <ProjectsInner />);
}
export function ProjectPage({ id }: { id: string }) {
  return gated("Project", <ProjectInner id={id} />);
}
export function DocumentsPage() {
  return gated("Documents", <DocumentsInner />);
}
