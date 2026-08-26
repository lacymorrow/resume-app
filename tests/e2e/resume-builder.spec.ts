import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/**
 * Covers the builder panel end to end: every control changes the rendered
 * resume, writes itself into the URL, and comes back when that URL is opened
 * cold. The last part is the regression guard — hidden companies and projects
 * used to be honoured by the server render and then dropped on hydration.
 *
 * Selectors scope to [data-resume-render="interactive"] because Next streams
 * the Suspense fallback and the hydrated viewer into the same document; see the
 * duplicate-render test at the bottom.
 */

/** The Customize button exists only in the client render, so it marks hydration. */
async function waitForHydration(page: Page) {
  await page.getByRole("button", { name: /Customize/ }).waitFor({ state: "visible" });
}

function view(page: Page) {
  return page.locator('[data-resume-render="interactive"]');
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
    await page.goto("/?flavor=ai&off=awards&hc=Yahoo");
    await waitForHydration(page);

    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
    await expect(view(page).locator('[id="sh-awards"]')).toHaveCount(0);
    await expect(
      view(page).locator('section[aria-labelledby="sh-work"]').getByText("Yahoo", { exact: true })
    ).toHaveCount(0);
  });

  test("every flavor is present in the server markup", async ({ page }) => {
    // Crawlers that parse HTML without running it still need to find each
    // variant; every flavor has its own title and description via
    // generateMetadata, and these anchors are what point at them.
    await page.goto("/");
    const html = await page.content();
    const linked = new Set(Array.from(html.matchAll(/href="\/\?flavor=([a-z]+)"/g), (m) => m[1]));
    expect(linked.size).toBeGreaterThanOrEqual(6);
    expect(html).toContain('data-resume-render="static"');
  });

  /**
   * Known issue, pre-dating this work: the resume does not render without
   * JavaScript at all.
   *
   * page.tsx renders the interactive viewer inside a Suspense boundary whose
   * fallback is the static view. The viewer is a client component that suspends
   * during SSR (nuqs reads useSearchParams), so React streams *both* boundaries
   * out of order, each wrapped in `<div hidden id="S:n">`, and relies on an
   * inline script to reveal the right one. With scripting disabled nothing is
   * revealed: the document contains two complete resumes and shows "Loader...".
   *
   * Confirmed identical on production — resume.lacy.sh wraps both its
   * `resume-grain` and `spectrum-frame` renders in hidden streaming payloads —
   * so this is not a regression from the section registry or builder work. It
   * does mean the static view is not yet doing the job it was added for.
   *
   * The fix is to stop the viewer suspending: page.tsx already receives
   * searchParams on the server, so feeding those in as initial values lets the
   * viewer server-render directly, which removes the Suspense boundary, the
   * duplicate document, and static-view.tsx along with it.
   *
   * Marked test.fail() so it flips green when that lands.
   */
  test.fail("the resume renders without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    await expect(page.locator(".resume-frame")).toHaveCount(1);
    await expect(page.locator(".resume-frame")).toBeVisible();
    await context.close();
  });
});
