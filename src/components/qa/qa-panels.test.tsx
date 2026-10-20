import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { releaseBlockers } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { Results } from "./qa-panels";

describe("reviewing flaky QA evidence", () => {
  beforeEach(() => {
    useQA.setState(useQA.getInitialState());
    useQA.getState().run();
    useQA.getState().startFix();
    useQA.getState().fix();
    useQA.getState().configureInbox();
    useQA.getState().setScope("release");
    useQA.getState().run();
  });

  it("requires review of current evidence instead of accepting a stale attempt", async () => {
    const user = userEvent.setup();
    useQA.getState().selectResult(1, "C04");
    render(<Results running={false} onRun={vi.fn()} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(useQA.getState().flakyReviewed).toBe(false);

    await user.selectOptions(screen.getByLabelText("Run history"), "2");
    const review = screen.getByRole("checkbox", {
      name: /I reviewed both attempts/,
    });
    expect(review).not.toHaveAttribute("aria-disabled", "true");
    await user.click(review);

    const state = useQA.getState();
    expect(state.flakyReviewed).toBe(true);
    expect(
      releaseBlockers(
        state.runs,
        state.build,
        state.issues,
        state.flakyReviewed,
      ),
    ).toEqual([]);
  });

  it("keeps earlier attempts on the same build from satisfying review of a newer run", () => {
    useQA.getState().run();
    useQA.getState().selectResult(2, "C04");
    render(<Results running={false} onRun={vi.fn()} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(useQA.getState().flakyReviewed).toBe(false);
  });
});
