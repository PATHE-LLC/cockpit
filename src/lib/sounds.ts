export type Cue = "send" | "open-task" | "done" | "discard" | "restore" | "pane";

const CLICK_SRC = "/sounds/click.mp3";
const CLICK_VOLUME = 0.28;

let player: HTMLAudioElement | null = null;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Play the recorded click. Silent under prefers-reduced-motion. */
export function playClick() {
  if (typeof window === "undefined") return;
  if (reducedMotion()) return;
  if (!player) {
    player = new Audio(CLICK_SRC);
    player.preload = "auto";
  }
  player.volume = CLICK_VOLUME;
  try {
    player.currentTime = 0;
  } catch {
    // The file may not have metadata yet. play() still starts it.
  }
  void player.play().catch(() => {});
}

const AUDIBLE: Cue[] = ["send", "done", "discard", "restore"];

export function playCue(cue: Cue) {
  if (!AUDIBLE.includes(cue)) return;
  playClick();
}
