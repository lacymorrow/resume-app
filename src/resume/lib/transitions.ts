/**
 * Flavor switching as a page transition.
 *
 * Changing flavor rewrites the headline, the roles on show, and the accent all
 * at once. As a bare re-render that reads as a flicker — the page looks like it
 * reloaded rather than like the same resume being re-cut. The View Transitions
 * API lets the browser hold both states and cross-fade between them.
 *
 * The awkward part is that a built-in flavor is its own page, so the change is
 * a router push that lands some time after the call returns, and the push
 * remounts the viewer — there is no component state that survives to watch.
 * `startViewTransition` takes a promise for exactly this case, and the
 * `data-flavor` attribute the viewer writes on <html> is the signal that the
 * new flavor has actually rendered.
 */

/** Written by the viewer on every render; read here to know the swap landed. */
const FLAVOR_ATTR = "data-flavor";

/** Present while a transition runs. RESUME_CSS reads both of these. */
const RUNNING_ATTR = "data-flavor-changing";
const ENTERING_ATTR = "data-flavor-entering";

/**
 * Cap on how long the frozen page waits for the push to land. Flavor pages are
 * static and prefetched, so this is a stall guard rather than a duration.
 */
const SETTLE_MS = 600;

/** Long enough to outlast the fallback fade in RESUME_CSS. */
const FALLBACK_MS = 400;

/** Records which flavor is on screen. Also what `transitionToFlavor` waits on. */
export function markFlavor(id: string): void {
  document.documentElement.setAttribute(FLAVOR_ATTR, id);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Resolves once the viewer has marked `id` as rendered, or the cap expires. */
function settled(id: string): Promise<void> {
  const root = document.documentElement;
  if (root.getAttribute(FLAVOR_ATTR) === id) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = () => {
      observer.disconnect();
      clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (root.getAttribute(FLAVOR_ATTR) === id) finish();
    });
    observer.observe(root, { attributes: true, attributeFilter: [FLAVOR_ATTR] });
    const timer = setTimeout(finish, SETTLE_MS);
  });
}

/**
 * Runs `apply` — the state changes and router push that switch flavor — inside
 * a view transition, falling back to a plain swap with a short enter animation
 * where the API is missing and to no animation at all under reduced motion.
 */
export function transitionToFlavor(id: string, apply: () => void): void {
  const root = document.documentElement;

  // Re-selecting the current flavor changes nothing, so there would be nothing
  // to wait for: the transition would freeze the page for the whole cap.
  if (root.getAttribute(FLAVOR_ATTR) === id || prefersReducedMotion()) {
    apply();
    return;
  }

  if (typeof document.startViewTransition !== "function") {
    root.setAttribute(ENTERING_ATTR, "");
    apply();
    void settled(id).then(() => {
      setTimeout(() => root.removeAttribute(ENTERING_ATTR), FALLBACK_MS);
    });
    return;
  }

  root.setAttribute(RUNNING_ATTR, "");
  const done = () => root.removeAttribute(RUNNING_ATTR);
  const transition = document.startViewTransition(() => {
    apply();
    return settled(id);
  });

  // `finished` rejects only if that callback threw. Clear the flag either way:
  // it disables every colour transition in the frame while it is set.
  transition.finished.then(done, done);
}
