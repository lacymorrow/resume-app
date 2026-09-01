import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/**
 * Covers the builder panel end to end: every control changes the rendered
 * resume and writes itself into the URL.
 *
 * Flavors are path segments (/<id>) and are prerendered, so they render
 * without JavaScript. Builder state stays in the query string and is applied
 * on the client after mount — a static page cannot vary by query string, and
 * being static is what makes the flavor pages cacheable and crawlable.
 */

/** The Customize button exists only in the client render, so it marks hydration. */
async function waitForHydration(page: Page) {
  await page.getByRole("button", { name: /Customize/ }).waitFor({ state: "visible" });
}

function view(page: Page) {
  return page.locator(".resume-frame");
}

test.describe("resume builder", () => {
  test("panel controls drive the resume and the URL", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("button", { name: /Customize/ }).click();
    await expect(page.getByRole("complementary", { name: "Resume builder" })).toBeVisible();

    // Section toggle removes the section and records it in the URL.
    await expect(view(page).locator('[id="sh-education"]')).toBeVisible();
    await page.locator("#section-education").click();
    await expect(view(page).locator('[id="sh-education"]')).toHaveCount(0);
    await expect(page).toHaveURL(/off=education/);

    // Hiding a role drops it from the work section.
    await page.getByRole("button", { name: /^Roles/ }).click();
    const firstCompany = page.locator('[id^="company-"]').first();
    const companyName = (await page
      .locator('label[for^="company-"]')
      .first()
      .textContent())!.trim();
    const workItems = view(page).locator('section[aria-labelledby="sh-work"] li');
    const beforeHide = await workItems.count();
    await firstCompany.click();
    // nuqs encodes spaces as "+", so assert the decoded value, not the string.
    await expect.poll(() => new URL(page.url()).searchParams.get("hc")).toBe(companyName);
    expect(await workItems.count()).toBeLessThan(beforeHide);

    // Match mode round-trips.
    await page.getByRole("button", { name: /match any/ }).click();
    await expect(page).toHaveURL(/match=all/);

    // Reset clears every parameter and restores the section.
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(view(page).locator('[id="sh-education"]')).toBeVisible();
  });

  test("a hidden role stays in the builder so it can be switched back on", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("button", { name: /Customize/ }).click();
    await page.getByRole("button", { name: /^Roles/ }).click();

    const panel = page.getByRole("complementary", { name: "Resume builder" });
    const toggles = panel.locator('button[role="switch"][id^="company-"]');
    const total = await toggles.count();
    const id = (await toggles.first().getAttribute("id"))!;

    // The list is the flavor's roles, not the ones surviving the filters. Drive
    // it from the filtered set and the row vanishes the moment it is switched
    // off, stranding the reader with no way back short of Reset.
    await toggles.first().click();
    await expect.poll(() => new URL(page.url()).searchParams.get("hc")).not.toBeNull();
    await expect(toggles).toHaveCount(total);
    const row = panel.locator(`label[for="${id}"]`);
    await expect(row).toHaveCSS("text-decoration-line", "line-through");

    await panel.locator(`button[role="switch"][id="${id}"]`).click();
    await expect.poll(() => new URL(page.url()).searchParams.get("hc")).toBeNull();
    await expect(toggles).toHaveCount(total);
  });

  test("printing keeps the masthead and turns the page light", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    // The rail is a <header>, the contacts a <nav>, the colophon a <footer>.
    // A blanket "hide the chrome" print rule takes the name and every way to
    // reach the candidate with it.
    await expect(view(page).locator(".resume-rail")).toBeVisible();
    await expect(view(page).locator('nav[aria-label="Contact"]')).toBeVisible();
    await expect(view(page).getByRole("heading", { level: 1 })).toBeVisible();

    // Near-white on near-black is unreadable on paper, and prints as a black page.
    await expect(view(page)).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const ink = await view(page)
      .getByRole("heading", { level: 1 })
      .evaluate((el) => getComputedStyle(el).color);
    expect(ink).toBe("rgb(63, 64, 65)");

    // Controls that do nothing on paper stay off it.
    await expect(page.locator(".resume-desk")).toBeHidden();
  });

  interface TransitionReport {
    /** How many view transitions the page started. */
    started: number;
    /** Whether the flag that switches off the frame's colour fades was raised. */
    suppressed: boolean;
  }

  /** Instruments the page, and returns a reader for what it saw. */
  async function watchTransitions(page: Page) {
    await page.evaluate(() => {
      const w = window as unknown as { report: TransitionReport };
      w.report = { started: 0, suppressed: false };
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = (cb) => {
        w.report.started += 1;
        return original(cb);
      };
      new MutationObserver(() => {
        if (document.documentElement.hasAttribute("data-flavor-changing")) {
          w.report.suppressed = true;
        }
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-flavor-changing"],
      });
    });
    return () => page.evaluate(() => (window as unknown as { report: TransitionReport }).report);
  }

  function stillSuppressed(page: Page) {
    return page.evaluate(() => document.documentElement.hasAttribute("data-flavor-changing"));
  }

  test("switching flavor cross-fades instead of snapping", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const report = await watchTransitions(page);

    await page.getByRole("radio", { name: "AI / Agentic Engineer" }).click();
    await page.waitForURL(/\/ai$/);
    expect(await report()).toEqual({ started: 1, suppressed: true });

    // Leaving the flag up would strip the colour fades from the page for the
    // rest of the session, long after the transition it was raised for.
    await expect.poll(() => stillSuppressed(page)).toBe(false);
    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
  });

  test("going back cross-fades too", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("radio", { name: "DevOps Engineer" }).click();
    await page.waitForURL(/\/devops$/);
    await waitForHydration(page);

    // The provider transitions the browser's own buttons as well, a path that
    // never touches the flavor controls and so has to raise the flag itself.
    const report = await watchTransitions(page);
    await page.goBack();
    await page.waitForURL(/\/$/);
    expect(await report()).toEqual({ started: 1, suppressed: true });
    await expect.poll(() => stillSuppressed(page)).toBe(false);
    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
  });

  test("reduced motion switches flavor with no animation at all", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForHydration(page);
    const report = await watchTransitions(page);

    // Not merely a stylesheet override: a view transition freezes the page
    // while it runs, which is itself motion the reader asked not to have.
    await page.getByRole("radio", { name: "DevOps Engineer" }).click();
    await page.waitForURL(/\/devops$/);
    expect(await report()).toEqual({ started: 0, suppressed: false });
    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
  });

  test("a tuned variant downloads as a committable flavor file", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("button", { name: /Customize/ }).click();
    await page.locator("#section-interests").click();

    await page.getByRole("button", { name: /Flavor JSON/ }).click();
    await page.getByLabel("File name").fill("Staff Platform Eng");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "OK", exact: true }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("staff-platform-eng.json");
    const file = JSON.parse(readFileSync((await download.path())!, "utf8"));
    expect(file.id).toBe("staff-platform-eng");
    expect(file.label).toBe("Staff Platform Eng");
    expect(file.sections.interests).toBe(false);
    // Presentation travels with the flavor rather than living in a second file.
    expect(file.accent).toBeTruthy();
    expect(file.statement.headline).toBeTruthy();
  });

  test("a shared URL reproduces the tuned view for a cold visitor", async ({ page }) => {
    await page.goto("/ai?off=awards&hc=Yahoo");
    await waitForHydration(page);

    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
    await expect(view(page).locator('[id="sh-awards"]')).toHaveCount(0);
    await expect(
      view(page).locator('section[aria-labelledby="sh-work"]').getByText("Yahoo", { exact: true })
    ).toHaveCount(0);
  });

  test("legacy ?flavor= links still land on the flavor page", async ({ page }) => {
    await page.goto("/?flavor=ai");
    await expect(page).toHaveURL(/\/ai(\?|$)/);
    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
  });

  test("an unknown flavor is a 404 rather than a silent fallback", async ({ page }) => {
    const response = await page.goto("/not-a-real-flavor");
    expect(response?.status()).toBe(404);
  });

  test("every flavor is present in the server markup", async ({ page }) => {
    // Crawlers that parse HTML without running it still need to find each
    // variant; every flavor has its own title and description via
    // generateMetadata, and these anchors are what point at them.
    await page.goto("/");
    // Scoped to the flavor control anchors: at the root namespace a bare href
    // regex would also sweep up every other link on the page.
    const hrefs = await page.locator('a[role="radio"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href"))
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.length).toBeGreaterThanOrEqual(7);
    // The default flavor is "/", the rest are single root segments.
    expect(hrefs).toContain("/");
    expect(hrefs.filter((h) => h && /^\/[a-z-]+$/.test(h)).length).toBeGreaterThanOrEqual(6);
    expect(await page.content()).toContain('id="sh-work"');
  });

  /**
   * Regression guard for the defect this branch fixed: the resume used to not
   * render without JavaScript at all.
   *
   * src/app/(app)/loading.tsx put a Suspense boundary above the page, and
   * useSearchParams in a client component defers to the nearest boundary — so
   * React streamed the whole resume into a `<div hidden>` that only an inline
   * script could reveal. With scripting off the page showed "Loader..." and
   * nothing else, on production too.
   */
  test("the resume renders fully without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/ai");

    const frame = page.locator(".resume-frame");
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    await expect(frame.locator('[id="sh-work"]')).toBeVisible();

    // Flavor controls are anchors to real pages, so switching works unscripted.
    const links = page.locator('a[href^="/"][role="radio"]');
    expect(await links.count()).toBeGreaterThanOrEqual(6);
    await expect(page.locator('a[aria-current="page"]')).toHaveCount(1);

    await context.close();
  });

  test("a flavor page reads the same with and without JavaScript", async ({ browser }) => {
    const read = async (js: boolean) => {
      const context = await browser.newContext({ javaScriptEnabled: js });
      const page = await context.newPage();
      await page.goto("/ai");
      await page.waitForTimeout(1500);
      const text = await page.locator(".resume-frame").innerText();
      await context.close();
      return text;
    };
    // The prerendered HTML is the whole resume, so hydration changes nothing.
    // This is also the hydration guard: builder state is withheld until after
    // mount precisely so these two renders agree.
    expect(await read(false)).toBe(await read(true));
  });

  test("hydration is clean on a tuned URL", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/ai?hc=Yahoo&off=awards");
    await waitForHydration(page);
    // Tuning is applied after mount, so the first render still matches the
    // static HTML and React has no mismatch to recover from.
    await expect(view(page).locator('[id="sh-awards"]')).toHaveCount(0);
    expect(errors.filter((e) => /hydrat|did not match/i.test(e))).toEqual([]);
  });
});
