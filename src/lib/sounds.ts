export type Cue = "send" | "open-task" | "done" | "discard" | "restore" | "pane";

/** Interface sounds are off. */
export function playCue(_cue: Cue) {}
