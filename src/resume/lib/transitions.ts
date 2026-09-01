/**
 * The two things ShipKit's view-transition provider does not cover.
 *
 * next-view-transitions handles the hard part — a flavor is its own page, so
 * switching is a router push that lands after the call returns, and the
 * provider is what holds the transition open until the new route commits. It
 * also covers the browser's own back and forward buttons. What it does not do
 * is respect reduced motion, or know that this page animates its colours.
 */

/** Present while a transition runs. RESUME_CSS reads it. */
const RUNNING_ATTR = "data-flavor-changing";

/** Backstop for the paths that never report a transition as ready. */
const RESTORE_MS = 1000;

let restoreTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * A view transition freezes the page while it runs, which is itself motion the
 * reader asked not to have, so the answer is to skip it rather than to style it
 * away. Also covers browsers without the API, where the library pushes
 * straight through and no transition would start anyway.
 */
export function shouldTransition(): boolean {
  return (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Colour transitions are still in flight when the incoming state is captured,
 * so without this the new snapshot shows the outgoing accent. Cleared on the
 * transition's own `ready`, by which point both snapshots have been taken.
 *
 * The timer is the way back for the paths that never report ready: a back or
 * forward button, and a transition superseded by a second click, whose `ready`
 * rejects. Leaving the flag set would strip the colour fades from the page for
 * the rest of the session.
 */
export function suppressColorTransitions(): void {
  document.documentElement.setAttribute(RUNNING_ATTR, "");
  clearTimeout(restoreTimer);
  restoreTimer = setTimeout(restoreColorTransitions, RESTORE_MS);
}

export function restoreColorTransitions(): void {
  clearTimeout(restoreTimer);
  document.documentElement.removeAttribute(RUNNING_ATTR);
}
