import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCockpit } from "@/lib/store";
import { EmailQuestionsCard, SlackDraftCard } from "./draft-cards";

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const initial = useCockpit.getState();
beforeEach(() => useCockpit.setState(initial, true));

describe("SlackDraftCard", () => {
  it("lets the user edit the draft and send it", async () => {
    const user = userEvent.setup();
    render(<SlackDraftCard rev={0} />);
    const box = screen.getByLabelText("Slack reply draft");
    await user.clear(box);
    await user.type(box, "Looks safe to merge.");
    expect(useCockpit.getState().slack.draft).toBe("Looks safe to merge.");

    await user.click(screen.getByRole("button", { name: /send to #eng-backend/i }));
    expect(useCockpit.getState().slack.sent).toBe(true);
    expect(await screen.findByRole("status")).toHaveTextContent("Posted to #eng-backend");
  });

  it("collapses when a newer draft exists", () => {
    useCockpit.getState().setSlackDraft("newer", true);
    render(<SlackDraftCard rev={0} />);
    expect(screen.getByText(/replaced by the newer version/i)).toBeInTheDocument();
  });
});

describe("EmailQuestionsCard", () => {
  it("updates the email when the deposit answer changes", async () => {
    const user = userEvent.setup();
    render(<EmailQuestionsCard />);
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(useCockpit.getState().email.deposit).toBe(true);
    expect(useCockpit.getState().email.draft.body).toMatch(/invoice/);
  });
});
