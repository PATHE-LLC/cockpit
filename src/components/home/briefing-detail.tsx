"use client";

import { MainPrompt } from "@/components/home/main-prompt";
import { TaskChecklist } from "@/components/home/task-checklist";

export function BriefingDetail() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col" data-tour="briefing">
      <div className="edge-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="page-column pt-10 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight">Briefing</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed">
          <p>Five things moved overnight.</p>
          <p>
            Glenn asked in #eng-backend whether turning on RLS breaks the nightly reconcile cron, and why the orders
            list went from about 40ms to 900ms. The job uses the service role key, so RLS does not apply. The slowdown
            is auth.uid() once per row. A Slack reply and a migration sketch are ready. Nothing is posted.
          </p>
          <p>
            Alyssa emailed about the client&rsquo;s Wix site: a custom quote request, a PDF, and online accept, due
            Thursday. Request, itemised quote, PDF, and accept are native in Wix Forms and Price Quotes. A deposit is a
            two-step invoice. Automatic pricing needs Velo. The email is drafted. Deposit and tone are still open.
          </p>
          <p>
            Dana asked in Asana for a self-service form so customers can update name, email, and phone on Model 6D.
            schema.ts, SelfServiceForm.tsx, and the tests are on cursor/model-6d-self-service-form. Typecheck, lint, and
            unit tests passed. Nothing is pushed. A reply to Dana is ready, and a draft PR needs approval.
          </p>
          <p>
            Sam asked for Recall translation screens in the shared Figma file. Three frames are on the translation page:
            language picker, live transcript, and bilingual review. Canvas comments cover always-visible original text
            and SRT export.
          </p>
          <p>
            The kickoff asked for a dashboard PRD and something clickable for Pipeline, Delivery, and Customer Health.
            The PRD is drafted. Prototype v2 is ready, with a trend chart and a strand filter.
          </p>
        </div>
        <div className="mt-8">
          <TaskChecklist compact />
        </div>
        </div>
      </div>
      <div className="shrink-0 bg-background">
        <div className="page-column pt-3 pb-4">
          <MainPrompt />
        </div>
      </div>
    </div>
  );
}
