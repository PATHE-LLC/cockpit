"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHECKS, SCOPES, estimatedCost, releaseBlockers } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";

const money = (value: number) => `$${value.toFixed(2)}`;

export function QAChat({ initialPrompt }: { initialPrompt?: string }) {
  const s = useQA();
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [s.messages.length]);
  const ask = (text: string) => {
    s.addMessage("user", text);
    const scope = SCOPES.find((scope) => scope.id === s.scope)!;
    let reply = `You’re reviewing Forme build ${s.build}. I can explain the selected coverage, test evidence, linked issue or release blockers. Use the workspace controls to run checks and record decisions.`;
    if (/cost|spend|token|usage/i.test(text)) {
      reply = `This selection has an estimated AI cost of ${money(estimatedCost(s.selected))}, including a retry allowance. Recorded spend across ${s.runs.length} runs is ${money(s.runs.reduce((n, r) => n + r.cost, 0))}. The usage detail in Results includes failed attempts and retries. These are illustrative demo costs.`;
    } else if (/why|coverage|scope|plan/i.test(text)) {
      const omitted = CHECKS.filter((check) => !s.selected.includes(check.id));
      reply = `The ${scope.title.toLowerCase()} plan currently selects ${s.selected.length} of ${CHECKS.length} agreed checks. ${scope.description} ${omitted.length ? `${omitted.length} checks are outside this run; expand Coverage limits to see them.` : "All agreed checks are selected."} Open any check to inspect its steps and expected result. Real payments, production delivery, other browsers and comprehensive security testing remain out of scope.`;
    } else if (/fix|issue|feedback/i.test(text)) {
      const issue = s.issues[0];
      reply = !issue
        ? "No issues have been recorded. Run the test plan, or open the storefront and reproduce a failed submission to report it."
        : issue.status === "resolved"
          ? "QA-104 is resolved: the message-retention check passed on the fixed build. The original failing result and tester feedback remain in history."
          : issue.status === "fixed"
            ? "QA-104 has a fix in build 13, but still needs a passing retest. Affected old evidence is stale. Open Issues to prepare the release retest."
            : "QA-104 links the failed contact-form check with tester feedback. Open Issues to prepare a fix, apply it to build 13, then retest. A fix alone cannot resolve the issue.";
    } else if (/release|approve|ship|block/i.test(text)) {
      const blockers = releaseBlockers(
        s.runs,
        s.build,
        s.issues,
        s.flakyReviewed,
      );
      reply = blockers.length
        ? `Release review still needs: ${blockers.join(" ")} Once those are complete, review coverage limits and record the three named sign-offs. The final decision stays with a person.`
        : "The automated release requirements are complete. Review the coverage limits and record Matt’s product/design sign-off and Abdul’s QA and release sign-offs before approving the demo release.";
    } else if (/result|fail|evidence/i.test(text)) {
      const run = s.runs.at(-1);
      reply = run
        ? `Run ${run.id} tested build ${run.build}: ${run.results.filter((r) => r.outcome === "passed").length} passed, ${run.results.filter((r) => r.outcome === "failed").length} failed, ${run.results.filter((r) => r.outcome === "blocked").length} blocked and ${run.results.filter((r) => r.outcome === "flaky").length} flaky. Select a check in Results for expected versus actual behavior and every attempt. A passing retry does not erase the failure.`
        : "There are no results yet. Review the selected plan and run the checks; the results will be tied to that exact build.";
    } else if (/run|retest|test|check/i.test(text)) {
      reply = `Review the ${s.selected.length} selected checks for build ${s.build}, then use Run checks in the plan. ${s.inbox ? "The demo inbox is configured." : "Inbox delivery needs setup; the other checks can run."} Running and changing builds are explicit workspace actions.`;
    }
    s.addMessage("assistant", reply);
    setInput("");
  };
  const suggestions =
    s.tab === "results"
      ? ["Explain these results", "What needs fixing?"]
      : s.tab === "release"
        ? ["What’s blocking release?", "What did we spend?"]
        : ["Why these checks?", "What will it cost?"];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 text-sm leading-6"
        role="log"
        aria-label="QA conversation"
        aria-live="polite"
      >
        {initialPrompt && (
          <p className="ml-8 rounded-xl bg-muted px-4 py-3">{initialPrompt}</p>
        )}
        <div>
          <SparklesIcon aria-hidden className="mb-2 size-4 text-brand" />
          <p>
            Need a second look? Ask about your plan, findings or what’s left
            before release.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            I have the context of Forme, build {s.build}, and your current QA
            work.
          </p>
        </div>
        {s.messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              message.role === "user"
                ? "ml-8 rounded-xl bg-muted px-4 py-3"
                : "pr-3",
            )}
          >
            <span className="sr-only">
              {message.role === "user" ? "You: " : "Cockpit: "}
            </span>
            {message.text}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="border-t p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((text) => (
            <Button
              key={text}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => ask(text)}
            >
              {text}
            </Button>
          ))}
        </div>
        <form
          className="flex items-end gap-2 rounded-xl border border-input bg-background p-3 focus-within:ring-2 focus-within:ring-brand/30"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) ask(input.trim());
          }}
        >
          <label className="sr-only" htmlFor="qa-chat">
            Message Cockpit about QA
          </label>
          <textarea
            id="qa-chat"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                if (input.trim()) ask(input.trim());
              }
            }}
            placeholder="Ask about this QA review…"
            className="min-w-0 flex-1 resize-none bg-transparent text-base outline-none sm:text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="qa-primary"
            disabled={!input.trim()}
            aria-label="Send QA message"
          >
            <ArrowUpIcon />
          </Button>
        </form>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Local demo conversation
        </p>
      </div>
    </div>
  );
}
