import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { releaseBlockers } from "@/lib/qa/model";
import { useQA } from "@/lib/qa/store";
import { ReleaseReview, Results, RunPlan } from "./qa-panels";

const openAttempts = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    screen.getByRole("button", {
      name: "View evidence for Confirmation response time",
    }),
  );
};

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
    await openAttempts(user);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(useQA.getState().flakyReviewed).toBe(false);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("combobox", { name: "Run history" }));
    await user.click(
      await screen.findByRole("option", { name: "Run 2 · build 13" }),
    );
    await openAttempts(user);
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

  it("does not accept an earlier attempt on the same build instead of a newer run", async () => {
    const user = userEvent.setup();
    useQA.getState().run();
    useQA.getState().selectResult(2, "C04");
    render(<Results running={false} onRun={vi.fn()} />);
    await openAttempts(user);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(useQA.getState().flakyReviewed).toBe(false);
  });

  it("opens the exact flaky evidence directly from release review", async () => {
    const user = userEvent.setup();
    const view = render(<ReleaseReview />);
    await user.click(
      screen.getByRole("button", { name: "Review flaky check" }),
    );
    expect(useQA.getState().activeCheck).toBe("C04");
    expect(useQA.getState().tab).toBe("results");
    view.rerender(<Results running={false} onRun={vi.fn()} />);
    expect(
      screen.getByRole("dialog", { name: "Confirmation response time" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /I reviewed both attempts/ }),
    ).toBeInTheDocument();
  });
});

describe("choosing a QA run", () => {
  beforeEach(() => useQA.setState(useQA.getInitialState()));

  it("updates the count and estimate before a run, and restores the agreed release selection", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<RunPlan running={false} onRun={run} />);
    await user.click(
      screen.getByRole("checkbox", { name: "Keep message after a failure" }),
    );
    expect(screen.getByText("4 checks selected")).toBeInTheDocument();
    expect(screen.getByText("$0.28 est.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Release pass" }));
    expect(screen.getByText("11 checks selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run 11 checks" }));
    expect(run).toHaveBeenCalledOnce();
  });
});
