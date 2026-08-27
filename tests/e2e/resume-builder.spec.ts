import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/**
 * Covers the builder panel end to end: every control changes the rendered
 * resume, writes itself into the URL, and comes back when that URL is opened
 * cold. The last part is the regression guard — hidden companies and projects
 * used to be honoured by the server render and then dropped on hydration.
 *
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
    expect(html).toContain('id="sh-work"');
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
    await page.goto("/?flavor=ai");

    const frame = page.locator(".resume-frame");
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    await expect(frame.locator('[id="sh-work"]')).toBeVisible();

    // Flavor controls are anchors, so switching works without scripting.
    const links = page.locator('a[href^="/?flavor="]');
    expect(await links.count()).toBeGreaterThanOrEqual(6);
    await expect(page.locator('a[aria-current="page"]')).toHaveCount(1);

    await context.close();
  });

  test("server and client render the same resume", async ({ browser }) => {
    const read = async (js: boolean) => {
      const context = await browser.newContext({ javaScriptEnabled: js });
      const page = await context.newPage();
      await page.goto("/?flavor=ai&hc=Yahoo");
      await page.waitForTimeout(1500);
      const text = await page.locator(".resume-frame").innerText();
      await context.close();
      return text;
    };
    // Hidden roles are applied identically either way — `hc` used to be read by
    // the server and then discarded on hydration.
    expect(await read(false)).toBe(await read(true));
  });
});
