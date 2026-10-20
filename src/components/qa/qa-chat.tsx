"use client";

import { useState } from "react";
import { ArrowUpIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { CHECKS, SCOPES, estimatedCost, releaseBlockers } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { money } from "./qa-shared";

export function QAChat({ initialPrompt }: { initialPrompt?: string }) {
  const s = useQA();
  const [input, setInput] = useState("");
  const ask = (text: string) => {
    s.addMessage("user", text);
    const scope = SCOPES.find((scope) => scope.id === s.scope)!;
    let reply = `You’re reviewing Forme build ${s.build}. I can explain the selected coverage, test evidence, linked issue or release blockers. Use the workspace controls to run checks and record decisions.`;
    if (/cost|spend|token|usage/i.test(text)) {
      reply = `This selection has an estimated AI cost of ${money(estimatedCost(s.selected))}, including a retry allowance. Recorded spend across ${s.runs.length} runs is ${money(s.runs.reduce((n, r) => n + r.cost, 0))}. The usage detail in Runs includes failed attempts and retries. These are illustrative demo costs.`;
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
            ? "QA-104 has a fix in build 13, but still needs a passing retest. Affected old evidence is stale. Open Issues to prepare the retest."
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
        ? `Run ${run.id} tested build ${run.build}: ${run.results.filter((r) => r.outcome === "passed").length} passed, ${run.results.filter((r) => r.outcome === "failed").length} failed, ${run.results.filter((r) => r.outcome === "blocked").length} blocked and ${run.results.filter((r) => r.outcome === "flaky").length} flaky. Open a check in Runs for expected versus actual behavior and every attempt. A passing retry does not erase the failure.`
        : "There are no results yet. Review the selected plan and run the checks; the results will be tied to that exact build.";
    } else if (/run|retest|test|check/i.test(text)) {
      reply = `Review the ${s.selected.length} selected checks for build ${s.build}, then use Run checks in the plan. ${s.inbox ? "The demo inbox is configured." : "Inbox delivery needs setup; the other checks can run."} Running and changing builds are explicit workspace actions.`;
    }
    s.addMessage("assistant", reply);
    setInput("");
  };

  const suggestions =
    s.tab === "results"
      ? ["Explain the results", "What needs fixing?"]
      : s.tab === "release"
        ? ["What’s blocking release?", "What did we spend?"]
        : ["Why these checks?", "What will it cost?"];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation
        initial="instant"
        resize="instant"
        aria-label="QA conversation"
        className="min-h-0"
      >
        <ConversationContent>
          {initialPrompt && (
            <Message from="user">
              <MessageContent>{initialPrompt}</MessageContent>
            </Message>
          )}
          {!s.messages.length && (
            <div className="flex flex-col gap-4 py-4">
              <SparklesIcon
                aria-hidden
                className="size-5 text-muted-foreground"
              />
              <h3 className="text-lg font-medium">
                A second look, when you need it.
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Ask about the plan, a finding, or what’s left before release. I
                have the context of your current QA work.
              </p>
              <div className="flex flex-col items-start gap-2">
                {suggestions.map((text) => (
                  <Button
                    key={text}
                    variant="outline"
                    size="sm"
                    onClick={() => ask(text)}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {s.messages.map((message, index) => (
            <Message key={index} from={message.role}>
              <MessageContent>
                <span className="sr-only">
                  {message.role === "user" ? "You: " : "Cockpit: "}
                </span>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.text}
                </p>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton aria-label="Scroll to latest QA message" />
      </Conversation>
      <Separator />
      <form
        className="flex flex-col gap-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (input.trim()) ask(input.trim());
        }}
      >
        <label className="sr-only" htmlFor="qa-chat">
          Message Cockpit about QA
        </label>
        <InputGroup>
          <InputGroupTextarea
            id="qa-chat"
            name="message"
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. What’s blocking this release?"
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                if (input.trim()) ask(input.trim());
              }
            }}
          />
          <InputGroupAddon align="block-end">
            <InputGroupText>Forme · build {s.build}</InputGroupText>
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              className="ml-auto"
              disabled={!input.trim()}
              aria-label="Send QA message"
            >
              <ArrowUpIcon aria-hidden />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <p className="text-center text-xs text-muted-foreground">
          Local demo conversation
        </p>
      </form>
    </div>
  );
}
