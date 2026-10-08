"use client";

import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { PlaceScreen, DocumentsScreen } from "@/components/library/place-view";
import { ProjectFavorite } from "@/components/library/project-favorite";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CLIENTS,
  PROJECTS,
  clientById,
  clientMeta,
  projectById,
  projectMeta,
} from "@/lib/demo/library";
import { cn } from "@/lib/utils";

function Crumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          const words = item.label.trim().split(/\s+/);
          const last = words.pop() ?? item.label;
          return (
            <li key={item.href} className="inline">
              {index > 0 ? " " : null}
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  current && "text-foreground",
                )}
              >
                {words.length ? `${words.join(" ")} ` : null}
                <span className="whitespace-nowrap">
                  {last}
                  {current ? null : "\u00A0/"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function RichRow({
  title,
  meta,
  line,
  href,
  action,
}: {
  title: string;
  meta?: string;
  line?: string;
  href: string;
  action?: ReactNode;
}) {
  return (
    <li className="relative rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-accent/60 sm:px-3">
      <Link
        href={href}
        className={cn(
          "flex flex-col rounded-md outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50",
          action && "pr-8",
        )}
      >
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] leading-5 font-medium">{title}</span>
          {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
        </span>
        {line ? <span className="text-xs text-muted-foreground">{line}</span> : null}
      </Link>
      {action ? <div className="absolute top-1/2 right-1 z-10 -translate-y-1/2 sm:right-2">{action}</div> : null}
    </li>
  );
}

const library = { href: "/library", label: "Library" };

function LibraryHomeInner() {
  return (
    <IndexScreen title="Library" tour="library" crumbs={[]}>
      <RichRow title="Team" meta="Playbook" line="Processes and resources." href="/library/company" />
      <RichRow title="Clients" meta="1 client" line="Solar Light." href="/library/clients" />
      <RichRow
        title="Projects"
        meta="4 projects"
        line="Cockpit OS, Website Redesign, RMA Form, and an internal dashboard."
        href="/library/projects"
      />
    </IndexScreen>
  );
}

function IndexScreen({
  title,
  crumbs,
  tour,
  children,
}: {
  title: string;
  crumbs: { href: string; label: string }[];
  tour?: string;
  children: ReactNode;
}) {
  return (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto" {...(tour ? { "data-tour": tour } : {})}>
      <div className="page-column py-8 sm:py-12">
        <div className="px-2 sm:px-3">
          {crumbs.length ? <Crumbs items={crumbs} /> : null}
          <h1 className={cn("text-2xl font-semibold tracking-tight", crumbs.length && "mt-2")}>{title}</h1>
        </div>
        <ul className="mt-6">{children}</ul>
      </div>
    </div>
  );
}

function ClientsInner() {
  return (
    <IndexScreen title="Clients" crumbs={[library, { href: "/library/clients", label: "Clients" }]}>
      {CLIENTS.map((client) => (
        <RichRow
          key={client.id}
          title={client.name}
          meta={clientMeta(client.id)}
          line={client.note}
          href={`/library/clients/${client.id}`}
        />
      ))}
    </IndexScreen>
  );
}

function ProjectsInner() {
  return (
    <IndexScreen title="Projects" crumbs={[library, { href: "/library/projects", label: "Projects" }]}>
      {PROJECTS.map((project) => (
        <RichRow
          key={project.id}
          title={project.name}
          meta={projectMeta(project)}
          line={project.summary}
          href={`/library/projects/${project.id}`}
          action={<ProjectFavorite id={project.id} />}
        />
      ))}
    </IndexScreen>
  );
}

function TeamInner() {
  return (
    <PlaceScreen
      placeId="company"
      title="Team"
      tour="company"
      crumbs={[library, { href: "/library/company", label: "Team" }]}
    />
  );
}

function ClientInner({ id }: { id: string }) {
  const client = clientById(id);
  if (!client) {
    return (
      <IndexScreen title="That client is gone" crumbs={[library, { href: "/library/clients", label: "Clients" }]}>
        {null}
      </IndexScreen>
    );
  }
  return (
    <PlaceScreen
      placeId={client.id}
      title={client.name}
      tour="client"
      crumbs={[library, { href: "/library/clients", label: "Clients" }, { href: `/library/clients/${client.id}`, label: client.name }]}
    />
  );
}

function ProjectInner({ id }: { id: string }) {
  const project = projectById(id);
  if (!project) {
    return (
      <IndexScreen title="That project is gone" crumbs={[library, { href: "/library/projects", label: "Projects" }]}>
        {null}
      </IndexScreen>
    );
  }
  return (
    <PlaceScreen
      placeId={project.id}
      title={project.name}
      tour="project"
      crumbs={[library, { href: "/library/projects", label: "Projects" }, { href: `/library/projects/${project.id}`, label: project.name }]}
      mark={<ProjectFavorite id={project.id} />}
    />
  );
}

function Fallback({ title }: { title: string }) {
  return (
    <div className="edge-scroll min-h-0 flex-1 overflow-y-auto" role="status" aria-label={`Loading ${title}`}>
      <div className="page-column py-8 sm:py-12">
        <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
        <Skeleton className="mt-3 h-8 w-40 motion-reduce:animate-none" />
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
  return gated("Team", <TeamInner />);
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
  return gated("Documents", <DocumentsScreen />);
}
