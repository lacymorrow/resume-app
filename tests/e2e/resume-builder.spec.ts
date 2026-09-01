import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/**
 * Covers the builder panel end to end: every control changes the rendered
 * resume and writes itself into the URL.
 *
 * Flavors are path segments (/r/<id>) and are prerendered, so they render
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
    await page.goto("/r/ai?off=awards&hc=Yahoo");
    await waitForHydration(page);

    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
    await expect(view(page).locator('[id="sh-awards"]')).toHaveCount(0);
    await expect(
      view(page).locator('section[aria-labelledby="sh-work"]').getByText("Yahoo", { exact: true })
    ).toHaveCount(0);
  });

  test("legacy ?flavor= links still land on the flavor page", async ({ page }) => {
    await page.goto("/?flavor=ai");
    await expect(page).toHaveURL(/\/r\/ai/);
    await expect(view(page).locator('[id="sh-work"]')).toBeVisible();
  });

  test("an unknown flavor is a 404 rather than a silent fallback", async ({ page }) => {
    const response = await page.goto("/r/not-a-real-flavor");
    expect(response?.status()).toBe(404);
  });

  test("every flavor is present in the server markup", async ({ page }) => {
    // Crawlers that parse HTML without running it still need to find each
    // variant; every flavor has its own title and description via
    // generateMetadata, and these anchors are what point at them.
    await page.goto("/");
    const html = await page.content();
    const linked = new Set(Array.from(html.matchAll(/href="\/r\/([a-z]+)"/g), (m) => m[1]));
    // Six flavors plus the default, which lives at "/" rather than under /r.
    expect(linked.size).toBeGreaterThanOrEqual(6);
    expect(html).toContain('href="/"');
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
    await page.goto("/r/ai");

    const frame = page.locator(".resume-frame");
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    await expect(frame.locator('[id="sh-work"]')).toBeVisible();

    // Flavor controls are anchors to real pages, so switching works unscripted.
    const links = page.locator('a[href^="/r/"]');
    expect(await links.count()).toBeGreaterThanOrEqual(6);
    await expect(page.locator('a[aria-current="page"]')).toHaveCount(1);

    await context.close();
  });

  test("a flavor page reads the same with and without JavaScript", async ({ browser }) => {
    const read = async (js: boolean) => {
      const context = await browser.newContext({ javaScriptEnabled: js });
      const page = await context.newPage();
      await page.goto("/r/ai");
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
    await page.goto("/r/ai?hc=Yahoo&off=awards");
    await waitForHydration(page);
    // Tuning is applied after mount, so the first render still matches the
    // static HTML and React has no mismatch to recover from.
    await expect(view(page).locator('[id="sh-awards"]')).toHaveCount(0);
    expect(errors.filter((e) => /hydrat|did not match/i.test(e))).toEqual([]);
  });
});
